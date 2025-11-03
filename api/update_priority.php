<?php
/**
 * API Endpoint: Öncelik Skoru Güncelle
 * POST /api/update_priority.php
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
    if (!isset($_POST['id']) || !isset($_POST['score']) || !isset($_POST['level'])) {
        sendErrorResponse('Eksik parametreler', 400);
    }

    $id = (int)$_POST['id'];
    $score = (float)$_POST['score'];
    $level = cleanInput($_POST['level']);

    // Validasyon
    if ($score < 0 || $score > 100) {
        sendErrorResponse('Skor 0-100 arasında olmalıdır', 400);
    }

    $validLevels = ['critical', 'high', 'medium', 'low'];
    if (!in_array($level, $validLevels)) {
        sendErrorResponse('Geçersiz öncelik seviyesi', 400);
    }

    $networkEvent = new NetworkEvent();
    $result = $networkEvent->updatePriority($id, $score, $level);

    if ($result) {
        // Log kaydet
        $db = Database::getInstance();
        $db->execute(
            "INSERT INTO system_logs (log_type, action, description, ip_address, user_agent)
             VALUES (:type, :action, :description, :ip, :agent)",
            [
                ':type' => 'info',
                ':action' => 'Priority Updated',
                ':description' => "Olay #$id öncelik skoru güncellendi: $score ($level)",
                ':ip' => getClientIP(),
                ':agent' => getUserAgent()
            ]
        );

        sendSuccessResponse([
            'event_id' => $id,
            'new_score' => $score,
            'new_level' => $level
        ], 'Öncelik skoru başarıyla güncellendi');
    } else {
        sendErrorResponse('Öncelik skoru güncellenirken hata oluştu', 500);
    }

} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 500);
}
