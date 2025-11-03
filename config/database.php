<?php
/**
 * Veritabanı Bağlantı Sınıfı
 * PDO kullanarak güvenli veritabanı bağlantısı sağlar
 *
 * @package NetworkEventSystem
 * @version 1.0.0
 */

class Database {
    private static $instance = null;
    private $connection = null;
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $charset;

    /**
     * Constructor - Private (Singleton pattern)
     */
    private function __construct() {
        $this->host = DB_HOST;
        $this->dbname = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
        $this->charset = DB_CHARSET;

        $this->connect();
    }

    /**
     * Singleton instance al
     *
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Veritabanına bağlan
     *
     * @return void
     */
    private function connect() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}",
                PDO::ATTR_PERSISTENT         => true
            ];

            $this->connection = new PDO($dsn, $this->username, $this->password, $options);

            // Sistem loguna yaz
            $this->log('info', 'Database Connected', 'Veritabanı bağlantısı başarılı');

        } catch (PDOException $e) {
            $this->log('critical', 'Database Connection Failed', $e->getMessage());
            throw new Exception('Veritabanı bağlantısı kurulamadı: ' . $e->getMessage());
        }
    }

    /**
     * PDO connection'ı döndür
     *
     * @return PDO
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Query çalıştır (SELECT)
     *
     * @param string $sql
     * @param array $params
     * @return array
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->log('error', 'Query Failed', $sql . ' - ' . $e->getMessage());
            throw new Exception('Sorgu hatası: ' . $e->getMessage());
        }
    }

    /**
     * Tek satır getir
     *
     * @param string $sql
     * @param array $params
     * @return array|null
     */
    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (PDOException $e) {
            $this->log('error', 'Query Failed', $sql . ' - ' . $e->getMessage());
            throw new Exception('Sorgu hatası: ' . $e->getMessage());
        }
    }

    /**
     * INSERT/UPDATE/DELETE çalıştır
     *
     * @param string $sql
     * @param array $params
     * @return int Etkilenen satır sayısı
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->log('error', 'Execute Failed', $sql . ' - ' . $e->getMessage());
            throw new Exception('İşlem hatası: ' . $e->getMessage());
        }
    }

    /**
     * Son eklenen ID'yi döndür
     *
     * @return string
     */
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }

    /**
     * Transaction başlat
     *
     * @return bool
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }

    /**
     * Transaction commit
     *
     * @return bool
     */
    public function commit() {
        return $this->connection->commit();
    }

    /**
     * Transaction rollback
     *
     * @return bool
     */
    public function rollback() {
        return $this->connection->rollBack();
    }

    /**
     * Sayfa bazlı veri çek (pagination)
     *
     * @param string $table
     * @param array $conditions
     * @param int $page
     * @param int $perPage
     * @param string $orderBy
     * @param string $orderDir
     * @return array
     */
    public function paginate($table, $conditions = [], $page = 1, $perPage = 25, $orderBy = 'id', $orderDir = 'DESC') {
        try {
            // WHERE clause oluştur
            $where = '';
            $params = [];
            if (!empty($conditions)) {
                $whereParts = [];
                foreach ($conditions as $key => $value) {
                    $whereParts[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
                $where = 'WHERE ' . implode(' AND ', $whereParts);
            }

            // Toplam kayıt sayısı
            $countSql = "SELECT COUNT(*) as total FROM $table $where";
            $totalResult = $this->queryOne($countSql, $params);
            $total = $totalResult['total'] ?? 0;

            // Sayfalama hesapla
            $offset = ($page - 1) * $perPage;
            $totalPages = ceil($total / $perPage);

            // Veriyi çek
            $dataSql = "SELECT * FROM $table $where ORDER BY $orderBy $orderDir LIMIT $perPage OFFSET $offset";
            $data = $this->query($dataSql, $params);

            return [
                'data' => $data,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                    'has_prev' => $page > 1,
                    'has_next' => $page < $totalPages
                ]
            ];
        } catch (PDOException $e) {
            throw new Exception('Sayfalama hatası: ' . $e->getMessage());
        }
    }

    /**
     * Cache'den veri al veya sorguyu çalıştırıp cache'e yaz
     *
     * @param string $cacheKey
     * @param callable $callback
     * @param int $lifetime
     * @return mixed
     */
    public function cache($cacheKey, callable $callback, $lifetime = CACHE_LIFETIME) {
        if (!CACHE_ENABLED) {
            return $callback();
        }

        // Cache'den kontrol et
        $sql = "SELECT stat_value, UNIX_TIMESTAMP(updated_at) as cache_time
                FROM dashboard_stats_cache
                WHERE stat_key = :key
                LIMIT 1";

        $cached = $this->queryOne($sql, [':key' => $cacheKey]);

        if ($cached && (time() - $cached['cache_time']) < $lifetime) {
            return json_decode($cached['stat_value'], true);
        }

        // Cache yoksa veya eskiyse, callback çalıştır
        $result = $callback();

        // Cache'e kaydet
        $insertSql = "INSERT INTO dashboard_stats_cache (stat_key, stat_value, date_range)
                      VALUES (:key, :value, :range)
                      ON DUPLICATE KEY UPDATE stat_value = :value, updated_at = CURRENT_TIMESTAMP";

        $this->execute($insertSql, [
            ':key' => $cacheKey,
            ':value' => json_encode($result, JSON_UNESCAPED_UNICODE),
            ':range' => 'default'
        ]);

        return $result;
    }

    /**
     * Cache temizle
     *
     * @param string|null $cacheKey Null ise tüm cache temizlenir
     * @return int
     */
    public function clearCache($cacheKey = null) {
        if ($cacheKey === null) {
            return $this->execute("DELETE FROM dashboard_stats_cache");
        } else {
            return $this->execute("DELETE FROM dashboard_stats_cache WHERE stat_key = :key", [':key' => $cacheKey]);
        }
    }

    /**
     * Sistem loguna yaz
     *
     * @param string $type
     * @param string $action
     * @param string $description
     * @return void
     */
    private function log($type, $action, $description) {
        if (!LOG_ENABLED) {
            return;
        }

        try {
            $sql = "INSERT INTO system_logs (log_type, action, description, ip_address, user_agent)
                    VALUES (:type, :action, :description, :ip, :agent)";

            $stmt = $this->connection->prepare($sql);
            $stmt->execute([
                ':type' => $type,
                ':action' => $action,
                ':description' => $description,
                ':ip' => getClientIP(),
                ':agent' => getUserAgent()
            ]);

            // Dosya loguna da yaz
            if (defined('LOG_FILE')) {
                $logMessage = sprintf(
                    "[%s] [%s] %s - %s - IP: %s\n",
                    date('Y-m-d H:i:s'),
                    strtoupper($type),
                    $action,
                    $description,
                    getClientIP()
                );
                file_put_contents(LOG_FILE, $logMessage, FILE_APPEND);
            }
        } catch (PDOException $e) {
            // Log hatası - sessizce geç
        }
    }

    /**
     * Clone ve unserialize engelle (Singleton pattern)
     */
    private function __clone() {}
    public function __wakeup() {
        throw new Exception("Singleton sınıfı unserialize edilemez");
    }
}
