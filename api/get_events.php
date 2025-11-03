<?php
/**
 * API Endpoint: Olayları Getir
 * GET /api/get_events.php
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/NetworkEvent.php';

try {
    // Parametreleri al ve temizle
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_ITEMS_PER_PAGE) : DEFAULT_ITEMS_PER_PAGE;
    $orderBy = isset($_GET['order_by']) ? cleanInput($_GET['order_by']) : 'priority_score';
    $orderDir = isset($_GET['order_dir']) && strtoupper($_GET['order_dir']) === 'ASC' ? 'ASC' : 'DESC';

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

    if (!empty($_GET['source_ip'])) {
        $filters['source_ip'] = cleanInput($_GET['source_ip']);
    }

    if (!empty($_GET['destination_ip'])) {
        $filters['destination_ip'] = cleanInput($_GET['destination_ip']);
    }

    if (!empty($_GET['destination_port'])) {
        $filters['destination_port'] = (int)$_GET['destination_port'];
    }

    if (isset($_GET['is_processed'])) {
        $filters['is_processed'] = (bool)$_GET['is_processed'];
    }

    if (!empty($_GET['search'])) {
        $filters['search'] = cleanInput($_GET['search']);
    }

    // NetworkEvent sınıfını kullan
    $networkEvent = new NetworkEvent();
    $result = $networkEvent->getEvents($filters, $page, $perPage, $orderBy, $orderDir);

    sendJsonResponse($result);

} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 500);
}
