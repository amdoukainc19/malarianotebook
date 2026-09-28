import * as XLSX from 'xlsx';
import { Village } from '../types';

/**
 * Exporte le MAIN REPORT au format Excel XLSX identique au classeur de l'Hôpital de Koron
 */
export function exportMainReportToExcel(villages: Village[], totaux: any) {
  const data: Record<string, any>[] = villages.map((v) => ({
    'CODE': v.code,
    'VILLAGE / LOCALITÉ': v.nom,
    'TYPE': v.type,
    'STAND': v.stands_pulverises,
    'STRUCTURES': v.structures_pulverisees,
    'NBRE DE BOITES': v.can_refills_total,
    'HOMME': v.pop_homme,
    'FEMME': v.pop_femme,
    'FEMME ENCEINTE': v.pop_femme_enceinte,
    'ENFANT 0-5 ANS': v.pop_enfant_0_5,
    'TOTAL POPULATION': v.pop_couverte_total,
    'OBJECTIF STRUCTURES': v.nb_structures_total,
    'TAUX COUVERTURE (%)': v.taux_structures_pct,
    'STATUT HEATMAP': v.heatmap_structures.label
  }));

  // Ligne de TOTAL
  data.push({
    'CODE': 'TOT',
    'VILLAGE / LOCALITÉ': 'TOTAL GÉNÉRAL',
    'TYPE': 'GLOBAL',
    'STAND': totaux.stands,
    'STRUCTURES': totaux.structures,
    'NBRE DE BOITES': totaux.boites,
    'HOMME': totaux.homme,
    'FEMME': totaux.femme,
    'FEMME ENCEINTE': totaux.femme_enceinte,
    'ENFANT 0-5 ANS': totaux.enfant_0_5,
    'TOTAL POPULATION': totaux.total_population,
    'OBJECTIF STRUCTURES': totaux.structures_objectif || 8200,
    'TAUX COUVERTURE (%)': totaux.taux_couverture_global,
    'STATUT HEATMAP': totaux.heatmap_global?.label || 'Objectif global'
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MAIN REPORT');

  XLSX.writeFile(wb, `MALARIA_NOTE_BOOK_2026_MAIN_REPORT_${new Date().toISOString().substring(0, 10)}.xlsx`);
}

/**
 * Exporte la fiche complète d'un village
 */
export function exportVillageSheetToExcel(village: Village, familles: any[]) {
  const wb = XLSX.utils.book_new();

  // Feuille 1 : Récapitulatif
  const summaryData = [
    { 'Indicateur': 'Village / Site', 'Valeur': village.nom },
    { 'Indicateur': 'Code', 'Valeur': village.code },
    { 'Indicateur': 'Insecticide Utilisé', 'Valeur': 'Actellic 300cs (Pirimiphos-méthyl)' },
    { 'Indicateur': 'Objectif de Couverture', 'Valeur': '97.0%' },
    { 'Indicateur': 'Stands Pulvérisés', 'Valeur': village.stands_pulverises },
    { 'Indicateur': 'Structures Pulvérisées', 'Valeur': village.structures_pulverisees },
    { 'Indicateur': 'Structures Totales (Recensement)', 'Valeur': village.nb_structures_total },
    { 'Indicateur': 'Taux Couverture Structures', 'Valeur': `${village.taux_structures_pct}%` },
    { 'Indicateur': 'Chambres Pulvérisées', 'Valeur': village.chambres_pulverisees },
    { 'Indicateur': 'Chambres Totales', 'Valeur': village.chambres_totales },
    { 'Indicateur': 'Taux Couverture Chambres', 'Valeur': `${village.taux_chambres_pct}%` },
    { 'Indicateur': 'Familles Pulvérisées', 'Valeur': `${village.familles_pulverisees} / ${village.familles_totales} (${village.taux_familles_pct}%)` },
    { 'Indicateur': 'Recharges Bidons (Can Refills)', 'Valeur': village.can_refills_total },
    { 'Indicateur': 'Population Protégée', 'Valeur': `${village.pop_couverte_total} (H:${village.pop_homme}, F:${village.pop_femme}, Enceintes:${village.pop_femme_enceinte}, 0-5 ans:${village.pop_enfant_0_5})` },
    { 'Indicateur': 'Dernière Intervention', 'Valeur': village.derniere_intervention || 'N/A' }
  ];
  const ws1 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'SYNTHÈSE');

  // Feuille 2 : Détail des familles
  if (familles.length > 0) {
    const famData = familles.map(f => ({
      'Code Famille': f.code_famille,
      'Chef de Famille': f.chef_famille,
      'Contact': f.contact || '-',
      'Chambres Totales': f.nb_chambres_total,
      'Chambres Pulvérisées': f.chambres_pulverisees,
      'Chambres Non Pulvérisées': f.chambres_non_pulverisees,
      'Statut IRS': f.statut_famille,
      'Dernier Passage': f.date_dernier_passage || '-'
    }));
    const ws2 = XLSX.utils.json_to_sheet(famData);
    XLSX.utils.book_append_sheet(wb, ws2, 'FAMILLES_CHAMBRES');
  }

  XLSX.writeFile(wb, `IRS_${village.nom}_FICHE_2026.xlsx`);
}
