<?php
/**
 * API Endpoint: Olayı İşlenmiş Olarak İşaretle
 * POST /api/process_event.php
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/NetworkEvent.php';

// Sadece POST izin ver
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Sadece POST metodu kabul edilir', 405);
}

try {
    // CSRF token kontrolü
    $token = $_POST[CSRF_TOKEN_NAME] ?? '';
    if (!validateCSRFToken($token)) {
        sendErrorResponse('Geçersiz güvenlik token\'ı', 403);
    }

    // Gerekli parametreleri kontrol et
    if (!isset($_POST['id'])) {
        sendErrorResponse('Olay ID\'si gerekli', 400);
    }

    $id = (int)$_POST['id'];
    $notes = isset($_POST['notes']) ? cleanInput($_POST['notes']) : '';

    $networkEvent = new NetworkEvent();
    $result = $networkEvent->markAsProcessed($id, $notes);

    if ($result) {
        // Log kaydet
        $db = Database::getInstance();
        $db->execute(
            "INSERT INTO system_logs (log_type, action, description, ip_address, user_agent)
             VALUES (:type, :action, :description, :ip, :agent)",
            [
                ':type' => 'info',
                ':action' => 'Event Processed',
                ':description' => "Olay #$id işlenmiş olarak işaretlendi",
                ':ip' => getClientIP(),
                ':agent' => getUserAgent()
            ]
        );

        sendSuccessResponse(['event_id' => $id], 'Olay başarıyla işlenmiş olarak işaretlendi');
    } else {
        sendErrorResponse('Olay işlenirken hata oluştu', 500);
    }

} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 500);
}
