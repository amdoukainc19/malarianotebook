<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : controllers/ReportController.php
 * Générateur des rapports officiels : MAIN REPORT, WEEKLY, Mensuels, Trimestriels,
 * multi-villages et exports Excel / CSV
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Response;
use App\Middleware\AuthMiddleware;

class ReportController {
    /**
     * MAIN REPORT - Reproduction exacte du tableau récapitulatif global
     * STAND 1005 | STRUCTURES 7909 | BOITES 1460 | HOMME 4678 | FEMME 4935 | ENCEINTE 569 | ENFANT 4323 | TOTAL 14505
     * GET /api/rapports/main
     */
    public function mainReport(): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $sql = "
            SELECT 
                v.id, v.nom AS village, v.code, v.type,
                v.nb_stands_total AS stands_objectif,
                v.nb_structures_total AS structures_objectif,
                COALESCE(SUM(pj.stand_total), 0) AS stands,
                COALESCE(SUM(pj.structures_total), 0) AS structures,
                COALESCE(SUM(pj.can_refills_total), 0) AS boites,
                COALESCE(SUM(pop.homme), 0) AS homme,
                COALESCE(SUM(pop.femme), 0) AS femme,
                COALESCE(SUM(pop.femme_enceinte), 0) AS femme_enceinte,
                COALESCE(SUM(pop.enfant_0_5), 0) AS enfant_0_5,
                COALESCE(SUM(pop.total), 0) AS total_population
            FROM villages v
            LEFT JOIN pulverisations_journalieres pj ON pj.village_id = v.id
            LEFT JOIN population_journaliere pop ON pop.pulverisation_id = pj.id
            GROUP BY v.id, v.nom, v.code, v.type, v.nb_stands_total, v.nb_structures_total
            ORDER BY v.id ASC
        ";

        $stmt = $pdo->query($sql);
        $lignes = $stmt->fetchAll();

        // Calculs totaux et enrichissement Heatmap
        $totalStands = 0;
        $totalStructures = 0;
        $totalBoites = 0;
        $totalHomme = 0;
        $totalFemme = 0;
        $totalFemmeEnceinte = 0;
        $totalEnfant = 0;
        $totalGeneral = 0;

        foreach ($lignes as &$row) {
            $structObj = (int)$row['structures_objectif'];
            $structReal = (int)$row['structures'];
            $taux = $structObj > 0 ? round(($structReal / $structObj) * 100, 1) : 0.0;
            $row['taux_couverture_pct'] = $taux;
            $row['heatmap'] = VillageController::getHeatmapColor($taux);

            $totalStands += (int)$row['stands'];
            $totalStructures += (int)$row['structures'];
            $totalBoites += (int)$row['boites'];
            $totalHomme += (int)$row['homme'];
            $totalFemme += (int)$row['femme'];
            $totalFemmeEnceinte += (int)$row['femme_enceinte'];
            $totalEnfant += (int)$row['enfant_0_5'];
            $totalGeneral += (int)$row['total_population'];
        }

        $tauxGlobal = $totalStructures > 0 ? round(($totalStructures / 8200) * 100, 1) : 0.0;

        Response::success([
            'lignes' => $lignes,
            'totaux' => [
                'stands' => $totalStands,
                'structures' => $totalStructures,
                'boites' => $totalBoites,
                'homme' => $totalHomme,
                'femme' => $totalFemme,
                'femme_enceinte' => $totalFemmeEnceinte,
                'enfant_0_5' => $totalEnfant,
                'total_population' => $totalGeneral,
                'taux_couverture_global' => $tauxGlobal,
                'heatmap_global' => VillageController::getHeatmapColor($tauxGlobal)
            ],
            'meta' => [
                'titre' => 'MAIN REPORT - PULVERISATION INTRADOMICILIAIRE 2026',
                'insecticide' => 'Actellic 300cs',
                'hopital' => 'Hôpital de Koron - SAG Siguiri'
            ]
        ], 'MAIN REPORT consolidé avec succès');
    }

    /**
     * Rapport comparatif multi-villages (Module 12.5)
     * GET /api/rapports/comparatif
     */
    public function comparativeReport(): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $sql = "
            SELECT 
                v.id, v.nom AS village, v.code,
                v.nb_familles_total AS familles_totales,
                COUNT(DISTINCT CASE WHEN c.statut = 'pulvérisée' THEN f.id END) AS familles_pulverisees,
                v.nb_structures_total AS chambres_totales,
                COALESCE(SUM(pj.structures_total), 0) AS chambres_pulverisees,
                COALESCE(SUM(pop.total), 0) AS population_couverte,
                COALESCE(SUM(pj.can_refills_total), 0) AS recharges,
                MAX(pj.date_intervention) AS derniere_intervention,
                GROUP_CONCAT(DISTINCT u.nom SEPARATOR ', ') AS agents
            FROM villages v
            LEFT JOIN familles f ON f.village_id = v.id
            LEFT JOIN chambres c ON c.famille_id = f.id
            LEFT JOIN pulverisations_journalieres pj ON pj.village_id = v.id
            LEFT JOIN users u ON u.id = pj.agent_id
            LEFT JOIN population_journaliere pop ON pop.pulverisation_id = pj.id
            GROUP BY v.id
            ORDER BY v.nom ASC
        ";

        $stmt = $pdo->query($sql);
        $villages = $stmt->fetchAll();

        foreach ($villages as &$v) {
            $fTot = (int)$v['familles_totales'];
            $fPulv = (int)$v['familles_pulverisees'];
            if ($fPulv === 0 && $fTot > 0) {
                // Estimation de fallback basée sur l'avancement structures
                $fPulv = (int)round($fTot * ((int)$v['chambres_pulverisees'] / max(1, (int)$v['chambres_totales'])));
            }
            $tauxFam = $fTot > 0 ? round(($fPulv / $fTot) * 100, 1) : 0.0;

            $cTot = (int)$v['chambres_totales'];
            $cPulv = (int)$v['chambres_pulverisees'];
            $tauxChamb = $cTot > 0 ? round(($cPulv / $cTot) * 100, 1) : 0.0;

            $v['familles_pulverisees'] = $fPulv;
            $v['taux_familles_pct'] = $tauxFam;
            $v['taux_chambres_pct'] = $tauxChamb;
            $v['heatmap_familles'] = VillageController::getHeatmapColor($tauxFam);
            $v['heatmap_chambres'] = VillageController::getHeatmapColor($tauxChamb);
            $v['regle_97_chambres'] = $tauxChamb >= 97.0;
            $v['regle_97_familles'] = $tauxFam >= 97.0;
        }

        Response::success($villages, 'Rapport comparatif multi-villages généré');
    }

    /**
     * Rapports par période : Mois ou Trimestres
     * GET /api/rapports/periode?type=mois|trimestre&valeur=06|T2
     */
    public function periodReport(): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $type = $_GET['type'] ?? 'mois';
        $valeur = $_GET['valeur'] ?? '06'; // Ex: '06' pour Juin, 'T2' pour 2e trimestre

        $whereClause = "WHERE 1=1";
        if ($type === 'mois') {
            $whereClause .= " AND MONTH(pj.date_intervention) = " . (int)$valeur;
        } elseif ($type === 'trimestre') {
            $trimestre = (int)str_replace('T', '', $valeur);
            $whereClause .= " AND QUARTER(pj.date_intervention) = {$trimestre}";
        }

        $sql = "
            SELECT 
                v.nom AS village,
                COALESCE(SUM(pj.stand_total), 0) AS stands,
                COALESCE(SUM(pj.structures_total), 0) AS structures,
                COALESCE(SUM(pj.can_refills_total), 0) AS boites,
                COALESCE(SUM(pop.homme), 0) AS homme,
                COALESCE(SUM(pop.femme), 0) AS femme,
                COALESCE(SUM(pop.femme_enceinte), 0) AS femme_enceinte,
                COALESCE(SUM(pop.enfant_0_5), 0) AS enfant_0_5,
                COALESCE(SUM(pop.total), 0) AS total_population
            FROM villages v
            LEFT JOIN pulverisations_journalieres pj ON pj.village_id = v.id
            LEFT JOIN population_journaliere pop ON pop.pulverisation_id = pj.id
            {$whereClause}
            GROUP BY v.id, v.nom
            ORDER BY v.nom ASC
        ";

        $stmt = $pdo->query($sql);
        $donnees = $stmt->fetchAll();

        Response::success([
            'periode' => ['type' => $type, 'valeur' => $valeur],
            'donnees' => $donnees
        ], 'Rapport de période généré');
    }
}
