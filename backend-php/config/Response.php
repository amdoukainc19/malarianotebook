<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : config/Response.php
 * Gestionnaire standardisé de réponses JSON et en-têtes HTTP sécurisés
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Config;

class Response {
    /**
     * Appliquer les en-têtes de sécurité et CORS
     */
    public static function initCors(): void {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json; charset=UTF-8');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    /**
     * Réponse JSON de succès
     */
    public static function success(mixed $data = null, string $message = 'Opération réussie', int $statusCode = 200): void {
        http_response_code($statusCode);
        echo json_encode([
            'succes' => true,
            'message' => $message,
            'donnees' => $data,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Réponse JSON d'erreur
     */
    public static function error(string $message = 'Une erreur est survenue', int $statusCode = 400, mixed $details = null): void {
        http_response_code($statusCode);
        echo json_encode([
            'succes' => false,
            'message' => $message,
            'details' => $details,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
