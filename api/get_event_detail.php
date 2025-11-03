<?php
/**
 * API Endpoint: Olay Detayı
 * GET /api/get_event_detail.php?id=123
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/NetworkEvent.php';

try {
    if (!isset($_GET['id'])) {
        sendErrorResponse('Olay ID\'si gerekli', 400);
    }

    $id = (int)$_GET['id'];
    $networkEvent = new NetworkEvent();
    $event = $networkEvent->getEventById($id);

    if (!$event) {
        sendErrorResponse('Olay bulunamadı', 404);
    }

    // İlgili diğer olayları da getir (aynı kaynak IP'den)
    $relatedEvents = $networkEvent->getEvents([
        'source_ip' => $event['source_ip'],
        'attack_types' => [$event['attack_type']]
    ], 1, 5);

    // Önerilen aksiyonları getir
    $db = Database::getInstance();
    $attackWeight = $db->queryOne(
        "SELECT recommended_action FROM attack_weights WHERE attack_type = :type",
        [':type' => $event['attack_type']]
    );

    sendSuccessResponse([
        'event' => $event,
        'related_events' => $relatedEvents['data'] ?? [],
        'recommended_action' => $attackWeight['recommended_action'] ?? 'Detaylı analiz yapın.'
    ]);

} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 500);
}
