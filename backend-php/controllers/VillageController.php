<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : controllers/VillageController.php
 * Gestion des villages, calculs de couverture 97%, heatmap et fiches détaillées
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Response;
use App\Middleware\AuthMiddleware;

class VillageController {
    /**
     * Calculer la classe de couleur Heatmap selon le taux en %
     */
    public static function getHeatmapColor(float $taux): array {
        if ($taux >= 97.0) {
            return ['code' => 'vert_fonce', 'hex' => '#15803d', 'label' => 'Objectif atteint (≥97%)'];
        } elseif ($taux >= 90.0) {
            return ['code' => 'vert_clair', 'hex' => '#22c55e', 'label' => 'Quasi atteint (90-96.9%)'];
        } elseif ($taux >= 75.0) {
            return ['code' => 'jaune', 'hex' => '#eab308', 'label' => 'En cours (75-89.9%)'];
        } elseif ($taux >= 50.0) {
            return ['code' => 'orange', 'hex' => '#f97316', 'label' => 'Insuffisant (50-74.9%)'];
        } elseif ($taux >= 25.0) {
            return ['code' => 'rouge_clair', 'hex' => '#ef4444', 'label' => 'Critique (25-49.9%)'];
        } else {
            return ['code' => 'rouge_fonce', 'hex' => '#b91c1c', 'label' => 'Très critique (<25%)'];
        }
    }

    /**
     * Liste de tous les villages avec statistiques consolidées et pastilles Heatmap
     * GET /api/villages
     */
    public function index(): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        $sql = "
            SELECT 
                v.id, v.code, v.nom, v.type, v.latitude, v.longitude,
                v.population_totale, v.nb_stands_total, v.nb_structures_total, v.nb_familles_total,
                COALESCE(SUM(pj.stand_total), 0) AS stands_pulverises,
                COALESCE(SUM(pj.structures_total), 0) AS structures_pulverisees,
                COALESCE(SUM(pj.can_refills_total), 0) AS can_refills_total,
                COALESCE(SUM(pop.homme), 0) AS pop_homme,
                COALESCE(SUM(pop.femme), 0) AS pop_femme,
                COALESCE(SUM(pop.femme_enceinte), 0) AS pop_femme_enceinte,
                COALESCE(SUM(pop.enfant_0_5), 0) AS pop_enfant_0_5,
                COALESCE(SUM(pop.total), 0) AS pop_couverte_total,
                MAX(pj.date_intervention) AS derniere_intervention
            FROM villages v
            LEFT JOIN pulverisations_journalieres pj ON pj.village_id = v.id
            LEFT JOIN population_journaliere pop ON pop.pulverisation_id = pj.id
            GROUP BY v.id
            ORDER BY v.type ASC, v.nom ASC
        ";

        $stmt = $pdo->query($sql);
        $villages = $stmt->fetchAll();

        // Récupérer également les stats familles / chambres
        $sqlFam = "
            SELECT 
                v.id AS village_id,
                COUNT(DISTINCT f.id) AS nb_familles_recensees,
                COALESCE(SUM(f.nb_chambres_total), 0) AS nb_chambres_recensees,
                COUNT(DISTINCT CASE WHEN c.statut = 'pulvérisée' THEN f.id END) AS nb_familles_pulverisees,
                COUNT(DISTINCT CASE WHEN c.statut = 'refusée' OR c.motif_non_pulverisation = 'refus_chef' THEN f.id END) AS nb_familles_refusees,
                COUNT(DISTINCT CASE WHEN c.statut = 'absente' OR c.motif_non_pulverisation = 'absence' THEN f.id END) AS nb_familles_absentes,
                COUNT(CASE WHEN c.statut = 'pulvérisée' THEN c.id END) AS nb_chambres_pulverisees
            FROM villages v
            LEFT JOIN familles f ON f.village_id = v.id
            LEFT JOIN chambres c ON c.famille_id = f.id
            GROUP BY v.id
        ";
        $stmtFam = $pdo->query($sqlFam);
        $famStats = [];
        foreach ($stmtFam->fetchAll() as $row) {
            $famStats[$row['village_id']] = $row;
        }

        $resultat = [];
        foreach ($villages as $v) {
            $vId = $v['id'];
            $fStat = $famStats[$vId] ?? [];

            // Calcul du taux structures (ancien Excel)
            $nbStructTot = (int)$v['nb_structures_total'];
            $nbStructPulv = (int)$v['structures_pulverisees'];
            $tauxStructures = $nbStructTot > 0 ? round(($nbStructPulv / $nbStructTot) * 100, 1) : 0.0;

            // Calcul taux chambres
            $nbChambresTot = (int)($fStat['nb_chambres_recensees'] ?? ($nbStructTot * 4));
            $nbChambresPulv = (int)($fStat['nb_chambres_pulverisees'] ?? ($nbStructPulv * 4));
            $tauxChambres = $nbChambresTot > 0 ? round(($nbChambresPulv / $nbChambresTot) * 100, 1) : $tauxStructures;

            // Calcul taux familles
            $nbFamTot = (int)$v['nb_familles_total'];
            $nbFamPulv = (int)($fStat['nb_familles_pulverisees'] ?? round($nbFamTot * ($tauxStructures / 100)));
            $tauxFamilles = $nbFamTot > 0 ? round(($nbFamPulv / $nbFamTot) * 100, 1) : 0.0;

            // Heatmap duale
            $heatmapChambres = self::getHeatmapColor($tauxChambres);
            $heatmapFamilles = self::getHeatmapColor($tauxFamilles);

            $resultat[] = array_merge($v, [
                'taux_structures_pct' => $tauxStructures,
                'taux_chambres_pct' => $tauxChambres,
                'taux_familles_pct' => $tauxFamilles,
                'chambres_totales' => $nbChambresTot,
                'chambres_pulverisees' => $nbChambresPulv,
                'familles_totales' => $nbFamTot,
                'familles_pulverisees' => $nbFamPulv,
                'heatmap_chambres' => $heatmapChambres,
                'heatmap_familles' => $heatmapFamilles,
                'objectif_97_atteint' => $tauxChambres >= 97.0
            ]);
        }

        Response::success($resultat, 'Liste des villages récupérée');
    }

    /**
     * Fiche détaillée d'un village
     * GET /api/villages/{id}/stats
     */
    public function stats(int $id): void {
        AuthMiddleware::authenticate();
        $pdo = Database::getConnection();

        // 1. Informations village
        $stmtV = $pdo->prepare("SELECT * FROM villages WHERE id = ?");
        $stmtV->execute([$id]);
        $village = $stmtV->fetch();
        if (!$village) {
            Response::error('Village introuvable', 404);
        }

        // 2. Historique des pulvérisations journalières (les blocs Excel)
        $stmtP = $pdo->prepare("
            SELECT pj.*, u.nom AS nom_agent,
                   pop.homme, pop.femme, pop.femme_enceinte, pop.enfant_0_5, pop.total AS total_population
            FROM pulverisations_journalieres pj
            LEFT JOIN users u ON u.id = pj.agent_id
            LEFT JOIN population_journaliere pop ON pop.pulverisation_id = pj.id
            WHERE pj.village_id = ?
            ORDER BY pj.date_intervention ASC
        ");
        $stmtP->execute([$id]);
        $historiqueJours = $stmtP->fetchAll();

        // 3. Familles et chambres du village
        $stmtF = $pdo->prepare("
            SELECT f.*, 
                   COUNT(c.id) AS nb_chambres_creees,
                   SUM(CASE WHEN c.statut = 'pulvérisée' THEN 1 ELSE 0 END) AS chambres_pulverisees,
                   SUM(CASE WHEN c.statut = 'non_pulvérisée' THEN 1 ELSE 0 END) AS chambres_non_pulverisees
            FROM familles f
            LEFT JOIN chambres c ON c.famille_id = f.id
            WHERE f.village_id = ?
            GROUP BY f.id
        ");
        $stmtF->execute([$id]);
        $familles = $stmtF->fetchAll();

        // 4. Motifs de refus / non-pulvérisation
        $stmtM = $pdo->prepare("
            SELECT motif_non_pulverisation, COUNT(*) as nombre
            FROM chambres c
            JOIN familles f ON f.id = c.famille_id
            WHERE f.village_id = ? AND c.motif_non_pulverisation != 'aucun'
            GROUP BY motif_non_pulverisation
        ");
        $stmtM->execute([$id]);
        $motifsRefus = $stmtM->fetchAll();

        Response::success([
            'village' => $village,
            'historique_jours' => $historiqueJours,
            'familles' => $familles,
            'motifs_refus' => $motifsRefus
        ], "Fiche statistique du village {$village['nom']}");
    }
}
