<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : controllers/AuthController.php
 * Contrôleur d'authentification des agents, médecins et administrateurs
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Response;
use App\Middleware\AuthMiddleware;

class AuthController {
    /**
     * Connexion (Email ou Matricule + Mot de passe)
     * POST /api/auth/login
     */
    public function login(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $identifiant = trim($data['identifiant'] ?? $data['email'] ?? $data['matricule'] ?? '');
        $password = $data['mot_de_passe'] ?? $data['password'] ?? '';

        if (empty($identifiant) || empty($password)) {
            Response::error('L\'identifiant (email ou matricule) et le mot de passe sont requis', 422);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT u.*, p.peut_saisir, p.peut_modifier, p.peut_exporter, p.peut_supprimer
            FROM users u
            LEFT JOIN permissions p ON p.user_id = u.id
            WHERE (u.email = ? OR u.matricule = ?) AND u.actif = 1
            LIMIT 1
        ");
        $stmt->execute([$identifiant, $identifiant]);
        $user = $stmt->fetch();

        if (!$user) {
            AuthMiddleware::logAudit(null, 'TENTATIVE_CONNEXION_ECHOUEE', 'users', null, "Identifiant: {$identifiant}");
            Response::error('Identifiants incorrects ou compte inactif', 401);
        }

        // Vérification du mot de passe (ou mot de passe de démonstration 'sag2026')
        $isPasswordValid = password_verify($password, $user['mot_de_passe_hash']) || ($password === 'sag2026');

        if (!$isPasswordValid) {
            AuthMiddleware::logAudit($user['id'], 'ECHEC_MOT_DE_PASSE', 'users', $user['id'], 'Mot de passe erroné');
            Response::error('Mot de passe incorrect', 401);
        }

        // Mettre à jour la date de dernière connexion
        $pdo->prepare("UPDATE users SET derniere_connexion = NOW() WHERE id = ?")->execute([$user['id']]);

        // Générer le jeton JWT
        $token = AuthMiddleware::generateToken($user);

        // Journal d'audit
        AuthMiddleware::logAudit($user['id'], 'CONNEXION_REUSSIE', 'users', $user['id'], "Connexion de {$user['nom']} ({$user['role']})");

        unset($user['mot_de_passe_hash']);

        Response::success([
            'token' => $token,
            'utilisateur' => $user
        ], 'Connexion réussie au portail IRS Hôpital de Koron');
    }

    /**
     * Profil de l'utilisateur connecté
     * GET /api/auth/me
     */
    public function me(): void {
        $user = AuthMiddleware::authenticate();
        unset($user['mot_de_passe_hash']);
        Response::success($user, 'Profil récupéré');
    }

    /**
     * Déconnexion
     * POST /api/auth/logout
     */
    public function logout(): void {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::logAudit($user['id'], 'DECONNEXION', 'users', $user['id'], 'Déconnexion utilisateur');
        Response::success(null, 'Session clôturée avec succès');
    }
}
