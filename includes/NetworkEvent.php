<?php
/**
 * Network Event Model Sınıfı
 * Ağ olayları için CRUD işlemleri
 *
 * @package NetworkEventSystem
 * @version 1.0.0
 */

class NetworkEvent {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Tüm olayları getir (filtreleme ve sayfalama ile)
     *
     * @param array $filters
     * @param int $page
     * @param int $perPage
     * @param string $orderBy
     * @param string $orderDir
     * @return array
     */
    public function getEvents($filters = [], $page = 1, $perPage = 25, $orderBy = 'priority_score', $orderDir = 'DESC') {
        $where = [];
        $params = [];

        // Tarih aralığı filtresi
        if (!empty($filters['start_date'])) {
            $where[] = "timestamp >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $where[] = "timestamp <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        // Saldırı tipi filtresi
        if (!empty($filters['attack_types']) && is_array($filters['attack_types'])) {
            $placeholders = [];
            foreach ($filters['attack_types'] as $index => $type) {
                $key = ":attack_type_$index";
                $placeholders[] = $key;
                $params[$key] = $type;
            }
            $where[] = "attack_type IN (" . implode(',', $placeholders) . ")";
        }

        // Öncelik seviyesi filtresi
        if (!empty($filters['priority_levels']) && is_array($filters['priority_levels'])) {
            $placeholders = [];
            foreach ($filters['priority_levels'] as $index => $level) {
                $key = ":priority_level_$index";
                $placeholders[] = $key;
                $params[$key] = $level;
            }
            $where[] = "priority_level IN (" . implode(',', $placeholders) . ")";
        }

        // IP adresi filtresi
        if (!empty($filters['source_ip'])) {
            $where[] = "source_ip LIKE :source_ip";
            $params[':source_ip'] = '%' . $filters['source_ip'] . '%';
        }

        if (!empty($filters['destination_ip'])) {
            $where[] = "destination_ip LIKE :destination_ip";
            $params[':destination_ip'] = '%' . $filters['destination_ip'] . '%';
        }

        // Port filtresi
        if (!empty($filters['destination_port'])) {
            $where[] = "destination_port = :destination_port";
            $params[':destination_port'] = $filters['destination_port'];
        }

        // İşlenmiş filtresi
        if (isset($filters['is_processed'])) {
            $where[] = "is_processed = :is_processed";
            $params[':is_processed'] = $filters['is_processed'] ? 1 : 0;
        }

        // Arama (genel)
        if (!empty($filters['search'])) {
            $where[] = "(source_ip LIKE :search OR destination_ip LIKE :search OR attack_type LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Toplam kayıt sayısı
        $countSql = "SELECT COUNT(*) as total FROM network_events $whereClause";
        $countResult = $this->db->queryOne($countSql, $params);
        $total = $countResult['total'] ?? 0;

        // Sayfalama
        $offset = ($page - 1) * $perPage;
        $totalPages = ceil($total / $perPage);

        // Veriyi çek
        $dataSql = "SELECT * FROM network_events $whereClause
                    ORDER BY $orderBy $orderDir
                    LIMIT :limit OFFSET :offset";

        $stmt = $this->db->getConnection()->prepare($dataSql);

        // Parametreleri bind et
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);

        $stmt->execute();
        $data = $stmt->fetchAll();

        return [
            'success' => true,
            'data' => array_map([$this, 'formatEvent'], $data),
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'total_pages' => $totalPages,
                'has_prev' => $page > 1,
                'has_next' => $page < $totalPages
            ]
        ];
    }

    /**
     * Tek bir olayı getir
     *
     * @param int $id
     * @return array|null
     */
    public function getEventById($id) {
        $sql = "SELECT * FROM network_events WHERE id = :id LIMIT 1";
        $event = $this->db->queryOne($sql, [':id' => $id]);

        if (!$event) {
            return null;
        }

        return $this->formatEvent($event);
    }

    /**
     * Dashboard özet istatistiklerini getir
     *
     * @return array
     */
    public function getSummaryStats() {
        return $this->db->cache('summary_stats', function() {
            $stats = [];

            // Toplam olay sayısı
            $result = $this->db->queryOne("SELECT COUNT(*) as total FROM network_events");
            $stats['total_events'] = $result['total'] ?? 0;

            // Öncelik seviyelerine göre sayılar
            $levels = $this->db->query("
                SELECT priority_level, COUNT(*) as count
                FROM network_events
                GROUP BY priority_level
            ");

            foreach ($levels as $level) {
                $stats['priority_' . $level['priority_level']] = $level['count'];
            }

            // Varsayılan değerler
            $stats['priority_critical'] = $stats['priority_critical'] ?? 0;
            $stats['priority_high'] = $stats['priority_high'] ?? 0;
            $stats['priority_medium'] = $stats['priority_medium'] ?? 0;
            $stats['priority_low'] = $stats['priority_low'] ?? 0;

            // Günlük ortalama
            $result = $this->db->queryOne("
                SELECT COUNT(DISTINCT DATE(timestamp)) as days,
                       COUNT(*) as total
                FROM network_events
            ");
            $days = $result['days'] ?? 1;
            $stats['daily_average'] = round($result['total'] / $days, 2);

            // En sık saldırı tipi
            $result = $this->db->queryOne("
                SELECT attack_type, COUNT(*) as count
                FROM network_events
                WHERE attack_type != 'BENIGN'
                GROUP BY attack_type
                ORDER BY count DESC
                LIMIT 1
            ");
            $stats['most_common_attack'] = $result['attack_type'] ?? 'Yok';

            // İşlenmemiş kritik olay sayısı
            $result = $this->db->queryOne("
                SELECT COUNT(*) as count
                FROM network_events
                WHERE priority_level = 'critical' AND is_processed = 0
            ");
            $stats['unprocessed_critical'] = $result['count'] ?? 0;

            return $stats;
        }, 60); // 1 dakika cache
    }

    /**
     * Saldırı tipi dağılımını getir
     *
     * @return array
     */
    public function getAttackTypeDistribution() {
        return $this->db->cache('attack_type_distribution', function() {
            return $this->db->query("
                SELECT
                    attack_type,
                    COUNT(*) as count,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM network_events)), 2) as percentage
                FROM network_events
                GROUP BY attack_type
                ORDER BY count DESC
            ");
        }, 300);
    }

    /**
     * Saatlik olay dağılımını getir
     *
     * @param string $date
     * @return array
     */
    public function getHourlyDistribution($date = null) {
        $cacheKey = 'hourly_distribution_' . ($date ?? 'all');

        return $this->db->cache($cacheKey, function() use ($date) {
            $whereClause = $date ? "WHERE DATE(timestamp) = :date" : "";
            $params = $date ? [':date' => $date] : [];

            return $this->db->query("
                SELECT
                    HOUR(timestamp) as hour,
                    COUNT(*) as total_events,
                    SUM(CASE WHEN priority_level = 'critical' THEN 1 ELSE 0 END) as critical_events,
                    SUM(CASE WHEN priority_level = 'high' THEN 1 ELSE 0 END) as high_events,
                    SUM(CASE WHEN priority_level = 'medium' THEN 1 ELSE 0 END) as medium_events
                FROM network_events
                $whereClause
                GROUP BY HOUR(timestamp)
                ORDER BY hour
            ", $params);
        }, 300);
    }

    /**
     * En çok hedef alınan portları getir
     *
     * @param int $limit
     * @return array
     */
    public function getTopTargetedPorts($limit = 10) {
        return $this->db->cache('top_targeted_ports', function() use ($limit) {
            return $this->db->query("
                SELECT
                    destination_port,
                    COUNT(*) as count,
                    cp.service_name,
                    cp.criticality_score
                FROM network_events ne
                LEFT JOIN critical_ports cp ON ne.destination_port = cp.port_number
                WHERE attack_type != 'BENIGN'
                GROUP BY destination_port
                ORDER BY count DESC
                LIMIT :limit
            ", [':limit' => $limit]);
        }, 300);
    }

    /**
     * Zaman-gün bazlı risk haritasını getir
     *
     * @return array
     */
    public function getRiskHeatmap() {
        return $this->db->cache('risk_heatmap', function() {
            return $this->db->query("
                SELECT
                    DAYOFWEEK(timestamp) as day_of_week,
                    HOUR(timestamp) as hour,
                    COUNT(*) as event_count,
                    AVG(priority_score) as avg_priority
                FROM network_events
                WHERE attack_type != 'BENIGN'
                GROUP BY DAYOFWEEK(timestamp), HOUR(timestamp)
            ");
        }, 600);
    }

    /**
     * En tehlikeli kaynak IP'leri getir
     *
     * @param int $limit
     * @return array
     */
    public function getTopAttackers($limit = 10) {
        return $this->db->query("
            SELECT * FROM v_top_attackers
            LIMIT :limit
        ", [':limit' => $limit]);
    }

    /**
     * En çok hedef alınan IP'leri getir
     *
     * @param int $limit
     * @return array
     */
    public function getTopTargets($limit = 10) {
        return $this->db->query("
            SELECT * FROM v_top_targets
            LIMIT :limit
        ", [':limit' => $limit]);
    }

    /**
     * Olayı işlenmiş olarak işaretle
     *
     * @param int $id
     * @param string $notes
     * @return bool
     */
    public function markAsProcessed($id, $notes = '') {
        $sql = "UPDATE network_events
                SET is_processed = 1,
                    processed_at = CURRENT_TIMESTAMP,
                    notes = :notes
                WHERE id = :id";

        $result = $this->db->execute($sql, [':id' => $id, ':notes' => $notes]);

        if ($result) {
            $this->db->clearCache(); // Cache temizle
        }

        return $result > 0;
    }

    /**
     * Öncelik skorunu manuel güncelle
     *
     * @param int $id
     * @param float $score
     * @param string $level
     * @return bool
     */
    public function updatePriority($id, $score, $level) {
        $sql = "UPDATE network_events
                SET priority_score = :score,
                    priority_level = :level
                WHERE id = :id";

        $result = $this->db->execute($sql, [
            ':id' => $id,
            ':score' => $score,
            ':level' => $level
        ]);

        if ($result) {
            $this->db->clearCache();
        }

        return $result > 0;
    }

    /**
     * Olayı formatla
     *
     * @param array $event
     * @return array
     */
    private function formatEvent($event) {
        return [
            'id' => $event['id'],
            'timestamp' => $event['timestamp'],
            'formatted_timestamp' => formatTurkishDate($event['timestamp']),
            'time_ago' => timeAgo($event['timestamp']),
            'source_ip' => $event['source_ip'],
            'destination_ip' => $event['destination_ip'],
            'source_port' => $event['source_port'],
            'destination_port' => $event['destination_port'],
            'protocol' => getProtocolName($event['protocol']),
            'attack_type' => $event['attack_type'],
            'attack_icon' => getAttackTypeIcon($event['attack_type']),
            'attack_color' => getAttackTypeColor($event['attack_type']),
            'priority_score' => (float)$event['priority_score'],
            'priority_level' => $event['priority_level'],
            'priority_label' => getPriorityLabel($event['priority_level']),
            'is_processed' => (bool)$event['is_processed'],
            'processed_at' => $event['processed_at'],
            'notes' => $event['notes'],
            'total_packets' => ($event['total_fwd_packets'] ?? 0) + ($event['total_bwd_packets'] ?? 0),
            'total_bytes' => ($event['total_length_fwd_packets'] ?? 0) + ($event['total_length_bwd_packets'] ?? 0),
            'formatted_bytes' => formatBytes(($event['total_length_fwd_packets'] ?? 0) + ($event['total_length_bwd_packets'] ?? 0))
        ];
    }

    /**
     * Trend analizi yap (haftalık/aylık karşılaştırma)
     *
     * @param string $period 'week' veya 'month'
     * @return array
     */
    public function getTrendAnalysis($period = 'week') {
        $cacheKey = "trend_analysis_$period";

        return $this->db->cache($cacheKey, function() use ($period) {
            $interval = $period === 'week' ? '7 DAY' : '30 DAY';

            return $this->db->query("
                SELECT
                    DATE(timestamp) as date,
                    COUNT(*) as total_events,
                    SUM(CASE WHEN priority_level = 'critical' THEN 1 ELSE 0 END) as critical_events,
                    SUM(CASE WHEN attack_type != 'BENIGN' THEN 1 ELSE 0 END) as malicious_events
                FROM network_events
                WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL $interval)
                GROUP BY DATE(timestamp)
                ORDER BY date
            ");
        }, 300);
    }
}
