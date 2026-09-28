<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : controllers/EntomologyController.php
 * Surveillance entomologique : Anopheles, Aedes, Culex, captures et tests de sensibilité
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Response;
use App\Middleware\AuthMiddleware;

class EntomologyController {
    /**
     * Liste des captures entomologiques
     * GET /api/vecteurs
     */
    public function index(): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $stmt = $pdo->query("
            SELECT v.*, vil.nom AS nom_village, u.nom AS nom_agent
            FROM vecteurs v
            JOIN villages vil ON vil.id = v.village_id
            JOIN users u ON u.id = v.agent_id
            ORDER BY v.date_capture DESC
        ");
        $captures = $stmt->fetchAll();

        // Statistiques par espèce
        $stmtStats = $pdo->query("
            SELECT espece, SUM(quantite) as total_captures, AVG(mortalite_pct) as mortalite_moyenne
            FROM vecteurs
            GROUP BY espece
        ");
        $statsEspeces = $stmtStats->fetchAll();

        Response::success([
            'captures' => $captures,
            'statistiques_especes' => $statsEspeces
        ], 'Données entomologiques récupérées');
    }

    /**
     * Enregistrer une capture de vecteurs ou un test de sensibilité
     * POST /api/vecteurs
     */
    public function store(): void {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireSaisiePermission($user);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $villageId = (int)($data['village_id'] ?? 0);
        $espece = $data['espece'] ?? 'Anopheles gambiae';
        $methode = $data['methode_capture'] ?? 'PSC (Pyrèthre Spray Catch)';
        $dateCapture = $data['date_capture'] ?? date('Y-m-d');
        $quantite = (int)($data['quantite'] ?? 0);
        $testSensibilite = trim($data['test_sensibilite'] ?? 'Actellic 300cs (Pirimiphos-méthyl)');
        $mortalitePct = isset($data['mortalite_pct']) ? (float)$data['mortalite_pct'] : null;
        $observations = trim($data['observations'] ?? '');

        if ($villageId <= 0 || $quantite < 0) {
            Response::error('Village et quantité valides requis', 422);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            INSERT INTO vecteurs (village_id, espece, methode_capture, date_capture, quantite, agent_id, test_sensibilite, mortalite_pct, observations)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$villageId, $espece, $methode, $dateCapture, $quantite, $user['id'], $testSensibilite, $mortalitePct, $observations]);
        $id = (int)$pdo->lastInsertId();

        AuthMiddleware::logAudit($user['id'], 'ENREGISTREMENT_VECTEURS', 'vecteurs', $id, "Espèce: {$espece}, Qté: {$quantite}, Village #{$villageId}");

        Response::success(['id' => $id], 'Relevé entomologique enregistré avec succès', 201);
    }
}
