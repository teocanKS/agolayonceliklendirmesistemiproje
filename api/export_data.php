<?php
/**
 * API Endpoint: Veri Dışa Aktar (CSV/JSON)
 * GET /api/export_data.php?format=csv&filters=...
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/NetworkEvent.php';

try {
    // Format kontrolü
    $format = isset($_GET['format']) ? strtolower($_GET['format']) : 'csv';
    if (!in_array($format, ['csv', 'json'])) {
        sendErrorResponse('Geçersiz format. Sadece csv veya json desteklenir.', 400);
    }

    // Filtreleri oluştur
    $filters = [];

    if (!empty($_GET['start_date'])) {
        $filters['start_date'] = cleanInput($_GET['start_date']);
    }

    if (!empty($_GET['end_date'])) {
        $filters['end_date'] = cleanInput($_GET['end_date']);
    }

    if (!empty($_GET['attack_types'])) {
        $filters['attack_types'] = is_array($_GET['attack_types'])
            ? array_map('cleanInput', $_GET['attack_types'])
            : [cleanInput($_GET['attack_types'])];
    }

    if (!empty($_GET['priority_levels'])) {
        $filters['priority_levels'] = is_array($_GET['priority_levels'])
            ? array_map('cleanInput', $_GET['priority_levels'])
            : [cleanInput($_GET['priority_levels'])];
    }

    // Verileri getir (maksimum limit ile)
    $networkEvent = new NetworkEvent();
    $result = $networkEvent->getEvents($filters, 1, EXPORT_MAX_RECORDS);

    if (empty($result['data'])) {
        sendErrorResponse('Dışa aktarılacak veri bulunamadı', 404);
    }

    // Export formatına göre işle
    if ($format === 'csv') {
        exportAsCSV($result['data']);
    } else {
        exportAsJSON($result['data']);
    }

} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 500);
}

/**
 * CSV olarak dışa aktar
 */
function exportAsCSV($data) {
    $filename = 'network_events_' . date('Y-m-d_His') . '.csv';

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');

    // UTF-8 BOM (Excel için)
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Başlıkları yaz
    $headers = [
        'ID',
        'Tarih-Saat',
        'Kaynak IP',
        'Hedef IP',
        'Kaynak Port',
        'Hedef Port',
        'Protokol',
        'Saldırı Tipi',
        'Öncelik Skoru',
        'Öncelik Seviyesi',
        'Toplam Paket',
        'Toplam Byte',
        'İşlenmiş',
        'Notlar'
    ];
    fputcsv($output, $headers);

    // Verileri yaz
    foreach ($data as $row) {
        $csvRow = [
            $row['id'],
            $row['formatted_timestamp'],
            $row['source_ip'],
            $row['destination_ip'],
            $row['source_port'],
            $row['destination_port'],
            $row['protocol'],
            $row['attack_type'],
            $row['priority_score'],
            $row['priority_label'],
            $row['total_packets'],
            $row['total_bytes'],
            $row['is_processed'] ? 'Evet' : 'Hayır',
            $row['notes'] ?? ''
        ];
        fputcsv($output, $csvRow);
    }

    fclose($output);
    exit;
}

/**
 * JSON olarak dışa aktar
 */
function exportAsJSON($data) {
    $filename = 'network_events_' . date('Y-m-d_His') . '.json';

    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo json_encode([
        'export_date' => date('Y-m-d H:i:s'),
        'total_records' => count($data),
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    exit;
}
