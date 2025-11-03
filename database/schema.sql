-- ============================================
-- Ağ Olay Önceliklendirme Sistemi - Veritabanı Şeması
-- CICIDS2017 Network Intrusion Dataset için
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Veritabanı oluştur
CREATE DATABASE IF NOT EXISTS `network_event_system`
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `network_event_system`;

-- ============================================
-- Tablo 1: Ağ Olay Kayıtları (Ana Tablo)
-- ============================================

CREATE TABLE `network_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `flow_id` VARCHAR(255) DEFAULT NULL,
  `timestamp` DATETIME NOT NULL,
  `source_ip` VARCHAR(45) NOT NULL,
  `destination_ip` VARCHAR(45) NOT NULL,
  `source_port` INT UNSIGNED NOT NULL,
  `destination_port` INT UNSIGNED NOT NULL,
  `protocol` TINYINT UNSIGNED NOT NULL,
  `flow_duration` BIGINT DEFAULT 0,
  `total_fwd_packets` INT UNSIGNED DEFAULT 0,
  `total_bwd_packets` INT UNSIGNED DEFAULT 0,
  `total_length_fwd_packets` BIGINT DEFAULT 0,
  `total_length_bwd_packets` BIGINT DEFAULT 0,
  `fwd_packet_length_max` INT DEFAULT 0,
  `fwd_packet_length_min` INT DEFAULT 0,
  `fwd_packet_length_mean` FLOAT DEFAULT 0,
  `fwd_packet_length_std` FLOAT DEFAULT 0,
  `bwd_packet_length_max` INT DEFAULT 0,
  `bwd_packet_length_min` INT DEFAULT 0,
  `bwd_packet_length_mean` FLOAT DEFAULT 0,
  `bwd_packet_length_std` FLOAT DEFAULT 0,
  `flow_bytes_per_s` FLOAT DEFAULT 0,
  `flow_packets_per_s` FLOAT DEFAULT 0,
  `flow_iat_mean` FLOAT DEFAULT 0,
  `flow_iat_std` FLOAT DEFAULT 0,
  `flow_iat_max` BIGINT DEFAULT 0,
  `flow_iat_min` BIGINT DEFAULT 0,
  `fwd_iat_total` BIGINT DEFAULT 0,
  `fwd_iat_mean` FLOAT DEFAULT 0,
  `fwd_iat_std` FLOAT DEFAULT 0,
  `fwd_iat_max` BIGINT DEFAULT 0,
  `fwd_iat_min` BIGINT DEFAULT 0,
  `bwd_iat_total` BIGINT DEFAULT 0,
  `bwd_iat_mean` FLOAT DEFAULT 0,
  `bwd_iat_std` FLOAT DEFAULT 0,
  `bwd_iat_max` BIGINT DEFAULT 0,
  `bwd_iat_min` BIGINT DEFAULT 0,
  `fwd_psh_flags` TINYINT DEFAULT 0,
  `bwd_psh_flags` TINYINT DEFAULT 0,
  `fwd_urg_flags` TINYINT DEFAULT 0,
  `bwd_urg_flags` TINYINT DEFAULT 0,
  `fwd_header_length` INT DEFAULT 0,
  `bwd_header_length` INT DEFAULT 0,
  `fwd_packets_per_s` FLOAT DEFAULT 0,
  `bwd_packets_per_s` FLOAT DEFAULT 0,
  `min_packet_length` INT DEFAULT 0,
  `max_packet_length` INT DEFAULT 0,
  `packet_length_mean` FLOAT DEFAULT 0,
  `packet_length_std` FLOAT DEFAULT 0,
  `packet_length_variance` FLOAT DEFAULT 0,
  `fin_flag_count` TINYINT DEFAULT 0,
  `syn_flag_count` TINYINT DEFAULT 0,
  `rst_flag_count` TINYINT DEFAULT 0,
  `psh_flag_count` TINYINT DEFAULT 0,
  `ack_flag_count` TINYINT DEFAULT 0,
  `urg_flag_count` TINYINT DEFAULT 0,
  `cwe_flag_count` TINYINT DEFAULT 0,
  `ece_flag_count` TINYINT DEFAULT 0,
  `down_up_ratio` FLOAT DEFAULT 0,
  `average_packet_size` FLOAT DEFAULT 0,
  `avg_fwd_segment_size` FLOAT DEFAULT 0,
  `avg_bwd_segment_size` FLOAT DEFAULT 0,
  `fwd_header_length_1` INT DEFAULT 0,
  `fwd_avg_bytes_bulk` INT DEFAULT 0,
  `fwd_avg_packets_bulk` INT DEFAULT 0,
  `fwd_avg_bulk_rate` INT DEFAULT 0,
  `bwd_avg_bytes_bulk` INT DEFAULT 0,
  `bwd_avg_packets_bulk` INT DEFAULT 0,
  `bwd_avg_bulk_rate` INT DEFAULT 0,
  `subflow_fwd_packets` INT DEFAULT 0,
  `subflow_fwd_bytes` INT DEFAULT 0,
  `subflow_bwd_packets` INT DEFAULT 0,
  `subflow_bwd_bytes` INT DEFAULT 0,
  `init_win_bytes_forward` INT DEFAULT 0,
  `init_win_bytes_backward` INT DEFAULT 0,
  `act_data_pkt_fwd` INT DEFAULT 0,
  `min_seg_size_forward` INT DEFAULT 0,
  `active_mean` FLOAT DEFAULT 0,
  `active_std` FLOAT DEFAULT 0,
  `active_max` BIGINT DEFAULT 0,
  `active_min` BIGINT DEFAULT 0,
  `idle_mean` FLOAT DEFAULT 0,
  `idle_std` FLOAT DEFAULT 0,
  `idle_max` BIGINT DEFAULT 0,
  `idle_min` BIGINT DEFAULT 0,
  `attack_type` ENUM('BENIGN', 'DoS Hulk', 'DoS GoldenEye', 'DoS slowloris', 'DoS Slowhttptest',
                      'DDoS', 'PortScan', 'FTP-Patator', 'SSH-Patator', 'Web Attack Brute Force',
                      'Web Attack XSS', 'Web Attack Sql Injection', 'Infiltration', 'Bot', 'Heartbleed') NOT NULL,
  `priority_score` DECIMAL(5,2) DEFAULT 0.00,
  `priority_level` ENUM('critical', 'high', 'medium', 'low') DEFAULT 'low',
  `is_processed` BOOLEAN DEFAULT FALSE,
  `processed_at` DATETIME DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_timestamp` (`timestamp`),
  INDEX `idx_source_ip` (`source_ip`),
  INDEX `idx_destination_ip` (`destination_ip`),
  INDEX `idx_attack_type` (`attack_type`),
  INDEX `idx_priority_level` (`priority_level`),
  INDEX `idx_priority_score` (`priority_score` DESC),
  INDEX `idx_is_processed` (`is_processed`),
  INDEX `idx_composite_filter` (`timestamp`, `attack_type`, `priority_level`),
  INDEX `idx_source_dest` (`source_ip`, `destination_ip`),
  INDEX `idx_ports` (`destination_port`, `source_port`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tablo 2: Saldırı Tipi Ağırlıkları
-- ============================================

CREATE TABLE `attack_weights` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attack_type` VARCHAR(100) NOT NULL,
  `weight` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `severity_level` ENUM('critical', 'high', 'medium', 'low') NOT NULL,
  `description` TEXT,
  `recommended_action` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attack_type` (`attack_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saldırı tipi ağırlıklarını ekle
INSERT INTO `attack_weights` (`attack_type`, `weight`, `severity_level`, `description`, `recommended_action`) VALUES
('DDoS', 100.00, 'critical', 'Dağıtık Hizmet Engelleme saldırısı - En yüksek öncelik', 'Acil müdahale gerekli. Trafik filtreleme ve kaynak koruması uygulayın.'),
('Infiltration', 95.00, 'critical', 'Ağ içine sızma girişimi', 'Acil güvenlik analizi yapın. Etkilenen sistemleri izole edin.'),
('DoS Hulk', 90.00, 'critical', 'Hulk DoS saldırısı', 'IP bloklama ve trafik limitlemesi uygulayın.'),
('DoS GoldenEye', 90.00, 'critical', 'GoldenEye DoS saldırısı', 'Kaynak tabanlı koruma mekanizmalarını aktive edin.'),
('DoS slowloris', 85.00, 'critical', 'Slowloris DoS saldırısı', 'Bağlantı timeout ayarlarını optimize edin.'),
('DoS Slowhttptest', 85.00, 'critical', 'Slow HTTP Test DoS saldırısı', 'HTTP request limitleri uygulayın.'),
('Bot', 80.00, 'high', 'Botnet aktivitesi tespit edildi', 'İlgili IP adreslerini engelleyin ve detaylı analiz yapın.'),
('Heartbleed', 85.00, 'critical', 'Heartbleed güvenlik açığı sömürüsü', 'Acil sistem güncellemesi gerekli. SSL/TLS sertifikalarını yenileyin.'),
('FTP-Patator', 70.00, 'high', 'FTP Brute Force saldırısı', 'Başarısız login denemelerini limiteleyin. Multi-factor authentication aktive edin.'),
('SSH-Patator', 75.00, 'high', 'SSH Brute Force saldırısı', 'SSH port değiştirme veya key-based authentication kullanın.'),
('Web Attack Brute Force', 70.00, 'high', 'Web uygulaması Brute Force saldırısı', 'Rate limiting ve CAPTCHA uygulayın.'),
('Web Attack XSS', 65.00, 'high', 'Cross-Site Scripting saldırısı', 'Input validation ve output encoding uygulayın.'),
('Web Attack Sql Injection', 80.00, 'high', 'SQL Injection saldırısı', 'Prepared statements kullanın ve input validation yapın.'),
('PortScan', 50.00, 'medium', 'Port tarama aktivitesi', 'Kaynak IP adresini izlemeye alın. Firewall kurallarını gözden geçirin.'),
('BENIGN', 0.00, 'low', 'Normal ağ trafiği', 'Aksiyona gerek yok.');

-- ============================================
-- Tablo 3: Kritik Port Listesi
-- ============================================

CREATE TABLE `critical_ports` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `port_number` INT UNSIGNED NOT NULL,
  `service_name` VARCHAR(100) NOT NULL,
  `criticality_score` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `description` TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_port` (`port_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kritik portları ekle
INSERT INTO `critical_ports` (`port_number`, `service_name`, `criticality_score`, `description`) VALUES
(20, 'FTP-Data', 70.00, 'FTP veri transferi'),
(21, 'FTP', 75.00, 'File Transfer Protocol'),
(22, 'SSH', 90.00, 'Secure Shell - Kritik uzak erişim'),
(23, 'Telnet', 85.00, 'Telnet - Güvensiz protokol'),
(25, 'SMTP', 70.00, 'Simple Mail Transfer Protocol'),
(53, 'DNS', 80.00, 'Domain Name System'),
(80, 'HTTP', 85.00, 'Web sunucu'),
(110, 'POP3', 65.00, 'Post Office Protocol'),
(143, 'IMAP', 65.00, 'Internet Message Access Protocol'),
(443, 'HTTPS', 90.00, 'Güvenli web sunucu'),
(445, 'SMB', 80.00, 'Server Message Block'),
(1433, 'MSSQL', 85.00, 'Microsoft SQL Server'),
(3306, 'MySQL', 85.00, 'MySQL veritabanı'),
(3389, 'RDP', 95.00, 'Remote Desktop Protocol - Çok kritik'),
(5432, 'PostgreSQL', 85.00, 'PostgreSQL veritabanı'),
(5900, 'VNC', 80.00, 'Virtual Network Computing'),
(8080, 'HTTP-Alt', 75.00, 'Alternatif HTTP portu'),
(8443, 'HTTPS-Alt', 80.00, 'Alternatif HTTPS portu');

-- ============================================
-- Tablo 4: Kullanıcı Ayarları
-- ============================================

CREATE TABLE `user_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT,
  `description` VARCHAR(255),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan ayarları ekle
INSERT INTO `user_settings` (`setting_key`, `setting_value`, `description`) VALUES
('theme_mode', 'light', 'Arayüz teması (light/dark)'),
('critical_threshold', '80', 'Kritik öncelik eşik değeri'),
('medium_threshold', '50', 'Orta öncelik eşik değeri'),
('refresh_interval', '30', 'Dashboard yenileme süresi (saniye)'),
('items_per_page', '25', 'Sayfa başına gösterilecek kayıt sayısı'),
('notification_enabled', '1', 'Bildirimler aktif mi'),
('auto_process_low', '0', 'Düşük öncelikli olayları otomatik işle'),
('working_hours_start', '09:00', 'Mesai başlangıç saati'),
('working_hours_end', '18:00', 'Mesai bitiş saati'),
('alert_email', '', 'Kritik olaylar için e-posta adresi');

-- ============================================
-- Tablo 5: Sistem Logları
-- ============================================

CREATE TABLE `system_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `log_type` ENUM('info', 'warning', 'error', 'critical') NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `ip_address` VARCHAR(45),
  `user_agent` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_log_type` (`log_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tablo 6: Dashboard İstatistikleri Cache
-- ============================================

CREATE TABLE `dashboard_stats_cache` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stat_key` VARCHAR(100) NOT NULL,
  `stat_value` TEXT,
  `date_range` VARCHAR(50),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stat` (`stat_key`, `date_range`),
  INDEX `idx_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tablo 7: Saldırı Frekans Analizi
-- ============================================

CREATE TABLE `attack_frequency` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_ip` VARCHAR(45) NOT NULL,
  `attack_type` VARCHAR(100) NOT NULL,
  `hour_of_day` TINYINT UNSIGNED,
  `day_of_week` TINYINT UNSIGNED,
  `count` INT UNSIGNED DEFAULT 1,
  `last_seen` DATETIME NOT NULL,
  `first_seen` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_source_attack` (`source_ip`, `attack_type`),
  INDEX `idx_hour` (`hour_of_day`),
  INDEX `idx_day` (`day_of_week`),
  INDEX `idx_count` (`count` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tablo 8: Raporlar
-- ============================================

CREATE TABLE `reports` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_name` VARCHAR(255) NOT NULL,
  `report_type` ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `total_events` INT UNSIGNED DEFAULT 0,
  `critical_events` INT UNSIGNED DEFAULT 0,
  `high_events` INT UNSIGNED DEFAULT 0,
  `medium_events` INT UNSIGNED DEFAULT 0,
  `low_events` INT UNSIGNED DEFAULT 0,
  `report_data` LONGTEXT,
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_report_type` (`report_type`),
  INDEX `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- View: Özet İstatistikler
-- ============================================

CREATE VIEW `v_summary_stats` AS
SELECT
  COUNT(*) as total_events,
  SUM(CASE WHEN priority_level = 'critical' THEN 1 ELSE 0 END) as critical_count,
  SUM(CASE WHEN priority_level = 'high' THEN 1 ELSE 0 END) as high_count,
  SUM(CASE WHEN priority_level = 'medium' THEN 1 ELSE 0 END) as medium_count,
  SUM(CASE WHEN priority_level = 'low' THEN 1 ELSE 0 END) as low_count,
  SUM(CASE WHEN attack_type != 'BENIGN' THEN 1 ELSE 0 END) as malicious_count,
  SUM(CASE WHEN is_processed = 1 THEN 1 ELSE 0 END) as processed_count,
  DATE(timestamp) as event_date
FROM network_events
GROUP BY DATE(timestamp);

-- ============================================
-- View: En Çok Saldırı Yapan IP Adresleri
-- ============================================

CREATE VIEW `v_top_attackers` AS
SELECT
  source_ip,
  COUNT(*) as attack_count,
  attack_type,
  MAX(timestamp) as last_attack,
  AVG(priority_score) as avg_priority
FROM network_events
WHERE attack_type != 'BENIGN'
GROUP BY source_ip, attack_type
ORDER BY attack_count DESC;

-- ============================================
-- View: En Çok Hedef Alınan IP Adresleri
-- ============================================

CREATE VIEW `v_top_targets` AS
SELECT
  destination_ip,
  COUNT(*) as target_count,
  COUNT(DISTINCT attack_type) as attack_variety,
  MAX(timestamp) as last_targeted,
  MAX(priority_score) as max_priority
FROM network_events
WHERE attack_type != 'BENIGN'
GROUP BY destination_ip
ORDER BY target_count DESC;

COMMIT;

-- ============================================
-- Performans İpuçları ve Notlar
-- ============================================

-- 1. Indexler: Tüm sık sorgulanan kolonlar için index oluşturulmuştur
-- 2. Partitioning: Büyük veri setleri için timestamp bazlı partitioning önerilebilir
-- 3. Archiving: 6 aydan eski kayıtlar için arşivleme stratejisi düşünülmelidir
-- 4. Cache: dashboard_stats_cache tablosu sık kullanılan istatistikler için kullanılmalıdır
-- 5. Monitoring: slow query log aktif edilmeli ve optimize edilmelidir
