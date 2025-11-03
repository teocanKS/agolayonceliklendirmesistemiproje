<?php
/**
 * Yardımcı Fonksiyonlar
 *
 * @package NetworkEventSystem
 * @version 1.0.0
 */

/**
 * Öncelik seviyesine göre badge class döndür
 *
 * @param string $level
 * @return string
 */
function getPriorityBadgeClass($level) {
    $classes = [
        'critical' => 'badge-critical',
        'high' => 'badge-high',
        'medium' => 'badge-medium',
        'low' => 'badge-low'
    ];
    return $classes[$level] ?? 'badge-secondary';
}

/**
 * Öncelik seviyesine göre Türkçe isim döndür
 *
 * @param string $level
 * @return string
 */
function getPriorityLabel($level) {
    $labels = [
        'critical' => 'Kritik',
        'high' => 'Yüksek',
        'medium' => 'Orta',
        'low' => 'Düşük'
    ];
    return $labels[$level] ?? 'Bilinmiyor';
}

/**
 * Saldırı tipine göre renk döndür
 *
 * @param string $attackType
 * @return string
 */
function getAttackTypeColor($attackType) {
    $colors = [
        'DDoS' => '#dc3545',
        'Infiltration' => '#d63384',
        'DoS Hulk' => '#fd7e14',
        'DoS GoldenEye' => '#fd7e14',
        'DoS slowloris' => '#fd7e14',
        'DoS Slowhttptest' => '#fd7e14',
        'Bot' => '#6610f2',
        'Heartbleed' => '#e83e8c',
        'FTP-Patator' => '#ffc107',
        'SSH-Patator' => '#ffc107',
        'Web Attack Brute Force' => '#fd7e14',
        'Web Attack XSS' => '#20c997',
        'Web Attack Sql Injection' => '#0dcaf0',
        'PortScan' => '#6c757d',
        'BENIGN' => '#198754'
    ];
    return $colors[$attackType] ?? '#6c757d';
}

/**
 * Saldırı tipine göre ikon döndür
 *
 * @param string $attackType
 * @return string
 */
function getAttackTypeIcon($attackType) {
    $icons = [
        'DDoS' => '🚨',
        'Infiltration' => '🔓',
        'DoS Hulk' => '💥',
        'DoS GoldenEye' => '💥',
        'DoS slowloris' => '🐌',
        'DoS Slowhttptest' => '🐢',
        'Bot' => '🤖',
        'Heartbleed' => '💔',
        'FTP-Patator' => '🔑',
        'SSH-Patator' => '🔐',
        'Web Attack Brute Force' => '🔨',
        'Web Attack XSS' => '⚡',
        'Web Attack Sql Injection' => '💉',
        'PortScan' => '🔍',
        'BENIGN' => '✅'
    ];
    return $icons[$attackType] ?? '⚠️';
}

/**
 * Byte'ı okunabilir formata çevir
 *
 * @param int $bytes
 * @param int $precision
 * @return string
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, $precision) . ' ' . $units[$pow];
}

/**
 * Zaman farkını Türkçe göster
 *
 * @param string $datetime
 * @return string
 */
function timeAgo($datetime) {
    $timestamp = strtotime($datetime);
    $diff = time() - $timestamp;

    if ($diff < 60) {
        return $diff . ' saniye önce';
    } elseif ($diff < 3600) {
        return floor($diff / 60) . ' dakika önce';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . ' saat önce';
    } elseif ($diff < 604800) {
        return floor($diff / 86400) . ' gün önce';
    } else {
        return date('d.m.Y H:i', $timestamp);
    }
}

/**
 * IP adresini maskele (GDPR uyumlu)
 *
 * @param string $ip
 * @return string
 */
function maskIP($ip) {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $parts = explode('.', $ip);
        $parts[3] = 'xxx';
        return implode('.', $parts);
    } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        $parts = explode(':', $ip);
        $parts[count($parts) - 1] = 'xxxx';
        return implode(':', $parts);
    }
    return $ip;
}

/**
 * Çalışma saati kontrolü
 *
 * @param string $time
 * @return bool
 */
function isWorkingHours($time = null) {
    $db = Database::getInstance();
    $settings = $db->queryOne("SELECT setting_value FROM user_settings WHERE setting_key = 'working_hours_start'");
    $workStart = $settings['setting_value'] ?? '09:00';

    $settings = $db->queryOne("SELECT setting_value FROM user_settings WHERE setting_key = 'working_hours_end'");
    $workEnd = $settings['setting_value'] ?? '18:00';

    $checkTime = $time ? date('H:i', strtotime($time)) : date('H:i');
    return ($checkTime >= $workStart && $checkTime <= $workEnd);
}

/**
 * Öncelik skoru hesapla
 *
 * @param array $event
 * @return array ['score' => float, 'level' => string]
 */
function calculatePriorityScore($event) {
    $db = Database::getInstance();

    // 1. Saldırı tipi ağırlığı
    $attackWeight = $db->queryOne(
        "SELECT weight FROM attack_weights WHERE attack_type = :type",
        [':type' => $event['attack_type']]
    );
    $attackScore = ($attackWeight['weight'] ?? 0) * (WEIGHT_ATTACK_TYPE / 100);

    // 2. Trafik hacmi skoru (normalize edilmiş)
    $totalPackets = ($event['total_fwd_packets'] ?? 0) + ($event['total_bwd_packets'] ?? 0);
    $totalBytes = ($event['total_length_fwd_packets'] ?? 0) + ($event['total_length_bwd_packets'] ?? 0);

    // Trafik hacmi normalizasyonu (0-100 arası)
    $trafficScore = min(100, ($totalPackets / 100) + ($totalBytes / 10000));
    $trafficScore = $trafficScore * (WEIGHT_TRAFFIC_VOLUME / 100);

    // 3. Port kritikliği
    $portCriticality = $db->queryOne(
        "SELECT criticality_score FROM critical_ports WHERE port_number = :port",
        [':port' => $event['destination_port'] ?? 0]
    );
    $portScore = ($portCriticality['criticality_score'] ?? 25) * (WEIGHT_PORT_CRITICALITY / 100);

    // 4. Frekans skoru (aynı kaynaktan tekrar sayısı)
    $frequency = $db->queryOne(
        "SELECT count FROM attack_frequency WHERE source_ip = :ip AND attack_type = :type",
        [':ip' => $event['source_ip'], ':type' => $event['attack_type']]
    );
    $frequencyCount = $frequency['count'] ?? 1;
    $frequencyScore = min(100, $frequencyCount * 10) * (WEIGHT_FREQUENCY / 100);

    // 5. Zaman faktörü (mesai dışı şüpheli)
    $timeScore = 50; // Varsayılan
    if (!isWorkingHours($event['timestamp'] ?? null)) {
        $timeScore = 80; // Mesai dışı daha şüpheli
    }
    $timeScore = $timeScore * (WEIGHT_TIME_FACTOR / 100);

    // Toplam skor
    $totalScore = $attackScore + $trafficScore + $portScore + $frequencyScore + $timeScore;
    $totalScore = min(100, max(0, $totalScore)); // 0-100 arası sınırla

    // Seviye belirle
    $level = 'low';
    if ($totalScore >= CRITICAL_THRESHOLD) {
        $level = 'critical';
    } elseif ($totalScore >= HIGH_THRESHOLD) {
        $level = 'high';
    } elseif ($totalScore >= MEDIUM_THRESHOLD) {
        $level = 'medium';
    }

    return [
        'score' => round($totalScore, 2),
        'level' => $level,
        'breakdown' => [
            'attack_type' => round($attackScore, 2),
            'traffic_volume' => round($trafficScore, 2),
            'port_criticality' => round($portScore, 2),
            'frequency' => round($frequencyScore, 2),
            'time_factor' => round($timeScore, 2)
        ]
    ];
}

/**
 * Kullanıcı ayarını al
 *
 * @param string $key
 * @param mixed $default
 * @return mixed
 */
function getSetting($key, $default = null) {
    $db = Database::getInstance();
    $result = $db->queryOne(
        "SELECT setting_value FROM user_settings WHERE setting_key = :key",
        [':key' => $key]
    );
    return $result ? $result['setting_value'] : $default;
}

/**
 * Kullanıcı ayarını güncelle
 *
 * @param string $key
 * @param mixed $value
 * @return bool
 */
function updateSetting($key, $value) {
    $db = Database::getInstance();
    $sql = "UPDATE user_settings SET setting_value = :value WHERE setting_key = :key";
    return $db->execute($sql, [':value' => $value, ':key' => $key]) > 0;
}

/**
 * Olay detaylarını formatla
 *
 * @param array $event
 * @return array
 */
function formatEventDetails($event) {
    return [
        'id' => $event['id'],
        'timestamp' => formatTurkishDate($event['timestamp']),
        'time_ago' => timeAgo($event['timestamp']),
        'source_ip' => $event['source_ip'],
        'destination_ip' => $event['destination_ip'],
        'source_port' => $event['source_port'],
        'destination_port' => $event['destination_port'],
        'protocol' => getProtocolName($event['protocol']),
        'attack_type' => $event['attack_type'],
        'attack_icon' => getAttackTypeIcon($event['attack_type']),
        'attack_color' => getAttackTypeColor($event['attack_type']),
        'priority_score' => $event['priority_score'],
        'priority_level' => $event['priority_level'],
        'priority_label' => getPriorityLabel($event['priority_level']),
        'priority_badge' => getPriorityBadgeClass($event['priority_level']),
        'is_processed' => $event['is_processed'],
        'flow_duration' => formatDuration($event['flow_duration']),
        'total_packets' => formatNumber($event['total_fwd_packets'] + $event['total_bwd_packets']),
        'total_bytes' => formatBytes($event['total_length_fwd_packets'] + $event['total_length_bwd_packets'])
    ];
}

/**
 * Protokol numarasını isme çevir
 *
 * @param int $protocol
 * @return string
 */
function getProtocolName($protocol) {
    $protocols = [
        1 => 'ICMP',
        6 => 'TCP',
        17 => 'UDP',
        41 => 'IPv6',
        47 => 'GRE',
        50 => 'ESP',
        51 => 'AH',
        58 => 'ICMPv6'
    ];
    return $protocols[$protocol] ?? "Protocol $protocol";
}

/**
 * Süreyi okunabilir formata çevir
 *
 * @param int $microseconds
 * @return string
 */
function formatDuration($microseconds) {
    $seconds = $microseconds / 1000000;

    if ($seconds < 60) {
        return round($seconds, 2) . ' saniye';
    } elseif ($seconds < 3600) {
        return round($seconds / 60, 2) . ' dakika';
    } else {
        return round($seconds / 3600, 2) . ' saat';
    }
}

/**
 * Güvenli redirect
 *
 * @param string $url
 * @return void
 */
function redirect($url) {
    header("Location: $url");
    exit;
}

/**
 * Debug yazdır (sadece development'ta)
 *
 * @param mixed $data
 * @return void
 */
function debug($data) {
    if (error_reporting() !== 0) {
        echo '<pre>';
        print_r($data);
        echo '</pre>';
    }
}
