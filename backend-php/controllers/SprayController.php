<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : controllers/SprayController.php
 * Saisie journalière de pulvérisation : STAND / STRUCTURES / CAN REFILLS (1 à 30)
 * + Tableau POPULATION (HOMME, FEMME, FEMME ENCEINTE, ENFANT 0-5 ANS)
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Response;
use App\Middleware\AuthMiddleware;

class SprayController {
    /**
     * Enregistrer une journée de pulvérisation (Saisie directe format Excel 1-30)
     * POST /api/pulverisations
     */
    public function store(): void {
        $user = AuthMiddleware::authenticate();
        AuthMiddleware::requireSaisiePermission($user);

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $villageId = (int)($data['village_id'] ?? 0);
        $campagneId = (int)($data['campagne_id'] ?? 1);
        $dateIntervention = $data['date_intervention'] ?? date('Y-m-d');
        $numJour = (int)($data['num_jour'] ?? 1);
        $insecticide = trim($data['insecticide'] ?? 'Actellic 300cs');
        $observation = trim($data['observation'] ?? '');

        // Tableaux des 30 colonnes
        $standsCols = $data['stands'] ?? array_fill(1, 30, 0);
        $structuresCols = $data['structures'] ?? array_fill(1, 30, 0);
        $refillsCols = $data['can_refills'] ?? array_fill(1, 30, 0);

        // Données population
        $homme = (int)($data['population']['homme'] ?? 0);
        $femme = (int)($data['population']['femme'] ?? 0);
        $femmeEnceinte = (int)($data['population']['femme_enceinte'] ?? 0);
        $enfant = (int)($data['population']['enfant_0_5'] ?? 0);

        // Calcul automatique des totaux
        $totalStands = array_sum($standsCols);
        $totalStructures = array_sum($structuresCols);
        $totalRefills = array_sum($refillsCols);

        if ($villageId <= 0) {
            Response::error('Le village sélectionné est invalide', 422);
        }

        // Si l'agent a un village assigné restreint, vérifier
        if ($user['role'] === 'agent' && $user['village_assigne_id'] !== null && (int)$user['village_assigne_id'] !== $villageId) {
            Response::error('Vous n\'êtes autorisé à saisir que pour votre village assigné', 403);
        }

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            // 1. Insertion dans pulverisations_journalieres
            $stmtPj = $pdo->prepare("
                INSERT INTO pulverisations_journalieres 
                (village_id, campagne_id, agent_id, date_intervention, num_jour, insecticide, stand_total, structures_total, can_refills_total, observation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtPj->execute([
                $villageId, $campagneId, $user['id'], $dateIntervention, $numJour,
                $insecticide, $totalStands, $totalStructures, $totalRefills, $observation
            ]);
            $pjId = (int)$pdo->lastInsertId();

            // 2. Insertion des colonnes 1 à 30 pour STANDS
            $stmtStand = $pdo->prepare("INSERT INTO pulverisations_stands (pulverisation_id, colonne_num, valeur) VALUES (?, ?, ?)");
            for ($col = 1; $col <= 30; $col++) {
                $val = (int)($standsCols[$col] ?? 0);
                $stmtStand->execute([$pjId, $col, $val]);
            }

            // 3. Insertion des colonnes 1 à 30 pour STRUCTURES
            $stmtStruct = $pdo->prepare("INSERT INTO pulverisations_structures (pulverisation_id, colonne_num, valeur) VALUES (?, ?, ?)");
            for ($col = 1; $col <= 30; $col++) {
                $val = (int)($structuresCols[$col] ?? 0);
                $stmtStruct->execute([$pjId, $col, $val]);
            }

            // 4. Insertion des colonnes 1 à 30 pour CAN REFILLS
            $stmtRefill = $pdo->prepare("INSERT INTO pulverisations_can_refills (pulverisation_id, colonne_num, valeur) VALUES (?, ?, ?)");
            for ($col = 1; $col <= 30; $col++) {
                $val = (int)($refillsCols[$col] ?? 0);
                $stmtRefill->execute([$pjId, $col, $val]);
            }

            // 5. Insertion de la population journalière associée
            $stmtPop = $pdo->prepare("
                INSERT INTO population_journaliere (pulverisation_id, village_id, date_releve, homme, femme, femme_enceinte, enfant_0_5)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtPop->execute([$pjId, $villageId, $dateIntervention, $homme, $femme, $femmeEnceinte, $enfant]);

            $pdo->commit();

            // Journaliser dans l'audit log
            AuthMiddleware::logAudit($user['id'], 'SAISIE_JOURNALIERE_EXCEL', 'pulverisations_journalieres', $pjId, "Village #{$villageId} : {$totalStructures} structures, {$totalStands} stands, {$totalRefills} refills, Pop: " . ($homme + $femme + $femmeEnceinte + $enfant));

            Response::success([
                'id' => $pjId,
                'total_stands' => $totalStands,
                'total_structures' => $totalStructures,
                'total_can_refills' => $totalRefills,
                'total_population' => $homme + $femme + $femmeEnceinte + $enfant
            ], 'Journée de pulvérisation enregistrée avec succès', 201);

        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::error('Erreur lors de la sauvegarde : ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupérer les détails d'une pulvérisation journalière avec ses 30 colonnes
     * GET /api/pulverisations/{id}
     */
    public function show(int $id): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $stmtP = $pdo->prepare("SELECT * FROM pulverisations_journalieres WHERE id = ?");
        $stmtP->execute([$id]);
        $pj = $stmtP->fetch();
        if (!$pj) {
            Response::error('Enregistrement introuvable', 404);
        }

        $stmtStands = $pdo->prepare("SELECT colonne_num, valeur FROM pulverisations_stands WHERE pulverisation_id = ? ORDER BY colonne_num ASC");
        $stmtStands->execute([$id]);
        $stands = $stmtStands->fetchAll();

        $stmtStructs = $pdo->prepare("SELECT colonne_num, valeur FROM pulverisations_structures WHERE pulverisation_id = ? ORDER BY colonne_num ASC");
        $stmtStructs->execute([$id]);
        $structures = $stmtStructs->fetchAll();

        $stmtRefills = $pdo->prepare("SELECT colonne_num, valeur FROM pulverisations_can_refills WHERE pulverisation_id = ? ORDER BY colonne_num ASC");
        $stmtRefills->execute([$id]);
        $refills = $stmtRefills->fetchAll();

        $stmtPop = $pdo->prepare("SELECT * FROM population_journaliere WHERE pulverisation_id = ?");
        $stmtPop->execute([$id]);
        $population = $stmtPop->fetch();

        Response::success([
            'pulverisation' => $pj,
            'stands' => $stands,
            'structures' => $structures,
            'can_refills' => $refills,
            'population' => $population
        ], 'Détail de la pulvérisation journalière');
    }
}
