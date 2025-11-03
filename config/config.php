<?php
/**
 * Ağ Olay Önceliklendirme Sistemi - Ana Konfigürasyon Dosyası
 *
 * @package NetworkEventSystem
 * @version 1.0.0
 */

// Hata raporlama ayarları (Production'da kapatılmalı)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone ayarı
date_default_timezone_set('Europe/Istanbul');

// Veritabanı bağlantı bilgileri
define('DB_HOST', 'localhost');
define('DB_NAME', 'network_event_system');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Uygulama ayarları
define('APP_NAME', 'Ağ Olay Önceliklendirme Sistemi');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost');

// Session ayarları
define('SESSION_NAME', 'network_event_session');
define('SESSION_LIFETIME', 3600); // 1 saat

// Güvenlik ayarları
define('CSRF_TOKEN_NAME', 'csrf_token');
define('CSRF_TOKEN_LIFETIME', 3600);

// Sayfalama ayarları
define('DEFAULT_ITEMS_PER_PAGE', 25);
define('MAX_ITEMS_PER_PAGE', 100);

// Cache ayarları (saniye cinsinden)
define('CACHE_ENABLED', true);
define('CACHE_LIFETIME', 300); // 5 dakika

// Öncelik skorlama ayarları
define('CRITICAL_THRESHOLD', 80);
define('HIGH_THRESHOLD', 60);
define('MEDIUM_THRESHOLD', 40);

// Ağırlık faktörleri (toplam 100)
define('WEIGHT_ATTACK_TYPE', 40);
define('WEIGHT_TRAFFIC_VOLUME', 25);
define('WEIGHT_PORT_CRITICALITY', 20);
define('WEIGHT_FREQUENCY', 10);
define('WEIGHT_TIME_FACTOR', 5);

// Export ayarları
define('EXPORT_TEMP_DIR', __DIR__ . '/../temp/exports');
define('EXPORT_MAX_RECORDS', 50000);

// Log ayarları
define('LOG_ENABLED', true);
define('LOG_FILE', __DIR__ . '/../logs/system.log');
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR, CRITICAL

// API ayarları
define('API_RATE_LIMIT', 100); // İstek/dakika
define('API_RESPONSE_FORMAT', 'json');

// Güvenlik başlıkları
$securityHeaders = [
    'X-Frame-Options' => 'SAMEORIGIN',
    'X-Content-Type-Options' => 'nosniff',
    'X-XSS-Protection' => '1; mode=block',
    'Referrer-Policy' => 'strict-origin-when-cross-origin',
    'Content-Security-Policy' => "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:;"
];

// Güvenlik başlıklarını uygula
foreach ($securityHeaders as $header => $value) {
    header("$header: $value");
}

// Session başlat
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', 0); // HTTPS kullanıyorsanız 1 yapın
    session_name(SESSION_NAME);
    session_start();
}

// CSRF Token oluştur
if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
    $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    $_SESSION[CSRF_TOKEN_NAME . '_time'] = time();
}

// Gerekli dizinleri oluştur
$requiredDirs = [
    __DIR__ . '/../temp',
    __DIR__ . '/../temp/exports',
    __DIR__ . '/../logs'
];

foreach ($requiredDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

/**
 * CSRF Token doğrulama fonksiyonu
 *
 * @param string $token
 * @return bool
 */
function validateCSRFToken($token) {
    if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
        return false;
    }

    if (!isset($_SESSION[CSRF_TOKEN_NAME . '_time'])) {
        return false;
    }

    // Token süresi dolmuş mu kontrol et
    if ((time() - $_SESSION[CSRF_TOKEN_NAME . '_time']) > CSRF_TOKEN_LIFETIME) {
        return false;
    }

    return hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

/**
 * CSRF Token al
 *
 * @return string
 */
function getCSRFToken() {
    return $_SESSION[CSRF_TOKEN_NAME] ?? '';
}

/**
 * Input temizleme fonksiyonu
 *
 * @param mixed $data
 * @return mixed
 */
function cleanInput($data) {
    if (is_array($data)) {
        return array_map('cleanInput', $data);
    }

    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');

    return $data;
}

/**
 * JSON response gönder
 *
 * @param mixed $data
 * @param int $statusCode
 * @return void
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Hata response gönder
 *
 * @param string $message
 * @param int $statusCode
 * @return void
 */
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], $statusCode);
}

/**
 * Başarı response gönder
 *
 * @param mixed $data
 * @param string $message
 * @return void
 */
function sendSuccessResponse($data = null, $message = 'İşlem başarılı') {
    sendJsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], 200);
}

/**
 * IP adresi al
 *
 * @return string
 */
function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

/**
 * User Agent al
 *
 * @return string
 */
function getUserAgent() {
    return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
}

/**
 * Türkçe tarih formatla
 *
 * @param string $date
 * @param string $format
 * @return string
 */
function formatTurkishDate($date, $format = 'd.m.Y H:i:s') {
    $timestamp = strtotime($date);
    return date($format, $timestamp);
}

/**
 * Sayı formatla (Türkçe)
 *
 * @param float $number
 * @param int $decimals
 * @return string
 */
function formatNumber($number, $decimals = 0) {
    return number_format($number, $decimals, ',', '.');
}
