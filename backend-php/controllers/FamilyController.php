<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : controllers/FamilyController.php
 * Module central IRS : Suivi des familles et pulvérisation chambre par chambre
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Response;
use App\Middleware\AuthMiddleware;

class FamilyController {
    /**
     * Liste des familles par village
     * GET /api/villages/{id}/familles
     */
    public function getByVillage(int $villageId): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT f.*,
                   COUNT(c.id) AS total_chambres_enregistrees,
                   SUM(CASE WHEN c.statut = 'pulvérisée' THEN 1 ELSE 0 END) AS chambres_pulverisees,
                   SUM(CASE WHEN c.statut != 'pulvérisée' THEN 1 ELSE 0 END) AS chambres_non_pulverisees
            FROM familles f
            LEFT JOIN chambres c ON c.famille_id = f.id
            WHERE f.village_id = ?
            GROUP BY f.id
            ORDER BY f.code_famille ASC
        ");
        $stmt->execute([$villageId]);
        $familles = $stmt->fetchAll();

        Response::success($familles, 'Liste des familles récupérée');
    }

    /**
     * Détail d'une famille avec toutes ses chambres
     * GET /api/familles/{id}/chambres
     */
    public function getChambres(int $familleId): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $stmtFam = $pdo->prepare("SELECT f.*, v.nom AS nom_village FROM familles f JOIN villages v ON v.id = f.village_id WHERE f.id = ?");
        $stmtFam->execute([$familleId]);
        $famille = $stmtFam->fetch();
        if (!$famille) {
            Response::error('Famille introuvable', 404);
        }

        $stmtC = $pdo->prepare("
            SELECT c.*, u.nom AS nom_agent 
            FROM chambres c 
            LEFT JOIN users u ON u.id = c.agent_id 
            WHERE c.famille_id = ? 
            ORDER BY c.numero_chambre ASC
        ");
        $stmtC->execute([$familleId]);
        $chambres = $stmtC->fetchAll();

        // Passages antérieurs
        $stmtPass = $pdo->prepare("
            SELECT p.*, u.nom AS nom_agent 
            FROM passages_familles p 
            LEFT JOIN users u ON u.id = p.agent_id 
            WHERE p.famille_id = ? 
            ORDER BY p.date_passage DESC
        ");
        $stmtPass->execute([$familleId]);
        $passages = $stmtPass->fetchAll();

        Response::success([
            'famille' => $famille,
            'chambres' => $chambres,
            'historique_passages' => $passages
        ], 'Détail des chambres de la famille');
    }

    /**
     * Pulvériser une chambre individuelle (ou marquer non pulvérisée avec motif obligatoire)
     * POST /api/chambres/{id}/pulverisation
     */
    public function pulveriserChambre(int $chambreId): void {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireSaisiePermission($user);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $statut = $data['statut'] ?? 'pulvérisée'; // 'pulvérisée', 'non_pulvérisée', 'absente', 'refusée'
        $motif = $data['motif_non_pulverisation'] ?? 'aucun';
        $motifDetail = trim($data['motif_detail'] ?? '');
        $datePulv = $data['date_pulverisation'] ?? date('Y-m-d');
        $observation = trim($data['observation'] ?? '');

        // RÈGLE MÉTIER : Motif obligatoire si non pulvérisée
        if ($statut !== 'pulvérisée' && ($motif === 'aucun' || empty($motif))) {
            Response::error('Le motif de non-pulvérisation est obligatoire (refus, absence, porte fermée, etc.)', 422);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            UPDATE chambres 
            SET statut = ?, motif_non_pulverisation = ?, motif_detail = ?, date_pulverisation = ?, agent_id = ?, observation = ?
            WHERE id = ?
        ");
        $stmt->execute([$statut, $motif, $motifDetail, $datePulv, $user['id'], $observation, $chambreId]);

        AuthMiddleware::logAudit($user['id'], 'PULVERISATION_CHAMBRE', 'chambres', $chambreId, "Statut: {$statut}, Motif: {$motif}");

        Response::success(null, 'Chambre mise à jour avec succès');
    }

    /**
     * Enregistrer un passage complet sur une famille (Mobile agent IRS)
     * POST /api/familles/{id}/passages
     */
    public function enregistrerPassage(int $familleId): void {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireSaisiePermission($user);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $chambresData = $data['chambres'] ?? []; // Tableau de statuts de chaque chambre
        $campagneId = (int)($data['campagne_id'] ?? 1);
        $datePassage = $data['date_passage'] ?? date('Y-m-d');
        $observation = trim($data['observation'] ?? '');

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $nbPulv = 0;
            $nbNonPulv = 0;
            $motifPrincipal = 'aucun';

            foreach ($chambresData as $c) {
                $cId = (int)$c['id'];
                $cStatut = $c['statut'];
                $cMotif = $c['motif_non_pulverisation'] ?? 'aucun';
                $cDetail = $c['motif_detail'] ?? '';

                if ($cStatut === 'pulvérisée') {
                    $nbPulv++;
                } else {
                    $nbNonPulv++;
                    if ($motifPrincipal === 'aucun' && $cMotif !== 'aucun') {
                        $motifPrincipal = $cMotif;
                    }
                }

                $stmtUpdate = $pdo->prepare("
                    UPDATE chambres 
                    SET statut = ?, motif_non_pulverisation = ?, motif_detail = ?, date_pulverisation = ?, agent_id = ?, campagne_id = ?
                    WHERE id = ? AND famille_id = ?
                ");
                $stmtUpdate->execute([$cStatut, $cMotif, $cDetail, $datePassage, $user['id'], $campagneId, $cId, $familleId]);
            }

            // Déduire le statut global de la famille
            $statutFamille = 'Pulvérisée complètement';
            if ($nbPulv === 0) {
                if ($motifPrincipal === 'refus_chef') {
                    $statutFamille = 'Refusée';
                } elseif ($motifPrincipal === 'absence') {
                    $statutFamille = 'Absente';
                } else {
                    $statutFamille = 'À repasser';
                }
            } elseif ($nbNonPulv > 0) {
                $statutFamille = 'Partiellement pulvérisée';
            }

            // Insérer dans passages_familles
            $stmtPassage = $pdo->prepare("
                INSERT INTO passages_familles (famille_id, agent_id, campagne_id, date_passage, statut_famille, nb_chambres_pulverisees, nb_chambres_non_pulverisees, motif_global, observation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtPassage->execute([
                $familleId, $user['id'], $campagneId, $datePassage, $statutFamille,
                $nbPulv, $nbNonPulv, $motifPrincipal, $observation
            ]);
            $passageId = (int)$pdo->lastInsertId();

            $pdo->commit();

            AuthMiddleware::logAudit($user['id'], 'ENREGISTREMENT_PASSAGE_FAMILLE', 'passages_familles', $passageId, "Famille #{$familleId} : {$statutFamille} ({$nbPulv} pulv / {$nbNonPulv} non pulv)");

            Response::success([
                'passage_id' => $passageId,
                'statut_famille' => $statutFamille,
                'nb_pulverisees' => $nbPulv,
                'nb_non_pulverisees' => $nbNonPulv
            ], 'Passage IRS enregistré avec succès');

        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::error('Erreur lors de l\'enregistrement du passage : ' . $e->getMessage(), 500);
        }
    }
}
