<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : middleware/AuthMiddleware.php
 * Authentification JWT, contrôle d'accès RBAC et journal d'audit
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Config\Database;
use App\Config\Response;
use PDO;

class AuthMiddleware {
    private const SECRET_KEY = 'SAG_SIGUIRI_MALARIA_IRS_2026_SECRET_KEY_KORON_HOSPITAL';

    /**
     * Générer un token sécurisé
     */
    public static function generateToken(array $user): string {
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode([
            'id' => $user['id'],
            'matricule' => $user['matricule'],
            'nom' => $user['nom'],
            'email' => $user['email'],
            'role' => $user['role'],
            'village_assigne_id' => $user['village_assigne_id'],
            'exp' => time() + (8 * 3600) // 8 heures de validité pour les agents de terrain
        ]));
        $signature = hash_hmac('sha256', "{$header}.{$payload}", self::SECRET_KEY, true);
        $base64Signature = base64_encode($signature);

        return "{$header}.{$payload}.{$base64Signature}";
    }

    /**
     * Vérifier l'authentification et renvoyer l'utilisateur courant
     */
    public static function authenticate(): array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            Response::error('Accès non autorisé : jeton d\'authentification manquant', 401);
        }

        $jwt = $matches[1];
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) !== 3) {
            Response::error('Jeton invalide', 401);
        }

        [$header64, $payload64, $sig64] = $tokenParts;
        $sig = base64_decode($sig64);
        $expectedSig = hash_hmac('sha256', "{$header64}.{$payload64}", self::SECRET_KEY, true);

        if (!hash_equals($expectedSig, $sig)) {
            Response::error('Signature du jeton invalide', 401);
        }

        $payload = json_decode(base64_decode($payload64), true);
        if (!isset($payload['exp']) || $payload['exp'] < time()) {
            Response::error('Session expirée, veuillez vous reconnecter', 401);
        }

        // Récupérer l'utilisateur frais et ses permissions en base
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT u.id, u.nom, u.matricule, u.email, u.role, u.village_assigne_id, u.actif,
                   p.peut_saisir, p.peut_modifier, p.peut_exporter, p.peut_supprimer
            FROM users u
            LEFT JOIN permissions p ON p.user_id = u.id
            WHERE u.id = ? AND u.actif = 1
        ");
        $stmt->execute([$payload['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Compte utilisateur introuvable ou désactivé', 403);
        }

        return $user;
    }

    /**
     * Vérifier que l'utilisateur possède un rôle spécifique
     */
    public static function requireRole(array $user, array $allowedRoles): void {
        if (!in_array($user['role'], $allowedRoles, true)) {
            Response::error('Permissions insuffisantes pour cette opération', 403);
        }
    }

    /**
     * Vérifier la permission de saisie (règle stricte demandée)
     */
    public static function requireSaisiePermission(array $user): void {
        if ((int)$user['peut_saisir'] !== 1) {
            Response::error('Votre droit de saisie est suspendu ou non accordé par l\'administrateur', 403);
        }
    }

    /**
     * Enregistrer une action dans l'Audit Log
     */
    public static function logAudit(?int $userId, string $action, string $tableCible, ?int $recordId, ?string $details = null): void {
        try {
            $pdo = Database::getConnection();
            $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            $stmt = $pdo->prepare("
                INSERT INTO audit_logs (user_id, action, table_cible, enregistrement_id, details, ip_adresse)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$userId, $action, $tableCible, $recordId, $details, $ip]);
        } catch (\Throwable $e) {
            // Ne bloque pas la transaction principale
            error_log("Erreur Audit Log : " . $e->getMessage());
        }
    }
}
