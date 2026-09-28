<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : controllers/AdminController.php
 * Module d'administration : Gestion des agents, permissions de saisie et audit logs
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Response;
use App\Middleware\AuthMiddleware;

class AdminController {
    /**
     * Liste des utilisateurs et leurs permissions
     * GET /api/admin/utilisateurs
     */
    public function listUsers(): void {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireRole($user, ['admin']);

        $pdo = Database::getConnection();
        $stmt = $pdo->query("
            SELECT u.id, u.nom, u.matricule, u.email, u.role, u.village_assigne_id, u.actif, u.derniere_connexion,
                   p.peut_saisir, p.peut_modifier, p.peut_exporter, p.peut_supprimer,
                   v.nom AS nom_village_assigne
            FROM users u
            LEFT JOIN permissions p ON p.user_id = u.id
            LEFT JOIN villages v ON v.id = u.village_assigne_id
            ORDER BY u.role ASC, u.nom ASC
        ");
        $users = $stmt->fetchAll();

        Response::success($users, 'Liste des utilisateurs');
    }

    /**
     * Basculer le droit de saisie d'un agent (règle stricte RBAC)
     * POST /api/admin/utilisateurs/{id}/toggle-saisie
     */
    public function toggleDroitSaisie(int $targetUserId): void {
        $admin = AuthMiddleware::authenticate();
        AuthMiddleware::requireRole($admin, ['admin']);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $peutSaisir = isset($data['peut_saisir']) ? (int)(bool)$data['peut_saisir'] : 0;

        $pdo = Database::getConnection();
        // Vérifier si la ligne de permission existe
        $stmtCheck = $pdo->prepare("SELECT id FROM permissions WHERE user_id = ?");
        $stmtCheck->execute([$targetUserId]);
        if ($stmtCheck->fetch()) {
            $stmt = $pdo->prepare("UPDATE permissions SET peut_saisir = ? WHERE user_id = ?");
            $stmt->execute([$peutSaisir, $targetUserId]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO permissions (user_id, peut_saisir, peut_modifier, peut_exporter, peut_supprimer) VALUES (?, ?, 0, 1, 0)");
            $stmt->execute([$targetUserId, $peutSaisir]);
        }

        $actionTxt = $peutSaisir === 1 ? 'OCTROI_DROIT_SAISIE' : 'RETRAIT_DROIT_SAISIE';
        AuthMiddleware::logAudit($admin['id'], $actionTxt, 'permissions', $targetUserId, "Droit de saisie mis à {$peutSaisir} pour l'agent #{$targetUserId}");

        Response::success(['user_id' => $targetUserId, 'peut_saisir' => $peutSaisir], 'Permission de saisie mise à jour');
    }

    /**
     * Créer un nouvel utilisateur
     * POST /api/admin/utilisateurs
     */
    public function createUser(): void {
        $admin = AuthMiddleware::authenticate();
        AuthMiddleware::requireRole($admin, ['admin']);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $nom = trim($data['nom'] ?? '');
        $matricule = trim($data['matricule'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['mot_de_passe'] ?? 'sag2026';
        $role = $data['role'] ?? 'agent';
        $villageId = !empty($data['village_assigne_id']) ? (int)$data['village_assigne_id'] : null;
        $peutSaisir = isset($data['peut_saisir']) ? (int)(bool)$data['peut_saisir'] : 1;

        if (empty($nom) || empty($matricule) || empty($email)) {
            Response::error('Le nom, le matricule et l\'adresse email sont requis', 422);
        }

        $pdo = Database::getConnection();
        $hash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $stmt = $pdo->prepare("
                INSERT INTO users (nom, matricule, email, mot_de_passe_hash, role, village_assigne_id, actif)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            ");
            $stmt->execute([$nom, $matricule, $email, $hash, $role, $villageId]);
            $newId = (int)$pdo->lastInsertId();

            $stmtP = $pdo->prepare("
                INSERT INTO permissions (user_id, peut_saisir, peut_modifier, peut_exporter, peut_supprimer)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmtP->execute([$newId, $peutSaisir, $role === 'admin' ? 1 : 0, 1, $role === 'admin' ? 1 : 0]);

            AuthMiddleware::logAudit($admin['id'], 'CREATION_UTILISATEUR', 'users', $newId, "Création de {$nom} ({$matricule}, rôle {$role})");

            Response::success(['id' => $newId], 'Utilisateur créé avec succès', 201);
        } catch (\PDOException $e) {
            Response::error('Erreur lors de la création (matricule ou email déjà existant)', 409);
        }
    }

    /**
     * Consulter le Journal d'Audit
     * GET /api/admin/audit-logs
     */
    public function auditLogs(): void {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireRole($user, ['admin', 'superviseur']);

        $pdo = Database::getConnection();
        $stmt = $pdo->query("
            SELECT a.*, u.nom AS nom_utilisateur, u.matricule, u.role
            FROM audit_logs a
            LEFT JOIN users u ON u.id = a.user_id
            ORDER BY a.cree_le DESC
            LIMIT 100
        ");
        $logs = $stmt->fetchAll();

        Response::success($logs, 'Journal d\'audit récupéré');
    }
}
