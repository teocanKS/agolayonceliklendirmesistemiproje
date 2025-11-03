<?php
/**
 * API Endpoint: Dashboard Özet İstatistikleri
 * GET /api/get_summary.php
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/NetworkEvent.php';

try {
    $networkEvent = new NetworkEvent();

    $data = [
        'summary' => $networkEvent->getSummaryStats(),
        'attack_distribution' => $networkEvent->getAttackTypeDistribution(),
        'hourly_distribution' => $networkEvent->getHourlyDistribution(),
        'top_ports' => $networkEvent->getTopTargetedPorts(10),
        'top_attackers' => $networkEvent->getTopAttackers(5),
        'top_targets' => $networkEvent->getTopTargets(5),
        'trend_analysis' => $networkEvent->getTrendAnalysis('week')
    ];

    sendSuccessResponse($data);

} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 500);
}
