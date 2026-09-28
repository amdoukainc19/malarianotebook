import { Village, Famille, Chambre } from '../types';
import { getHeatmapInfo } from './heatmap';

/**
 * Calcul officiel de couverture de pulvérisation IRS
 * Règle stricte SAG / Hôpital de Koron :
 * - Taux (%) = (chambres_pulvérisées / total_chambres) * 100
 * - SI chambres_pulvérisées === total_chambres (et total > 0) => EXACTEMENT 100%
 * - Seuil cible OMS / SAG : 97.0% (Tag 97% Atteint)
 */
export interface SprayCalculationResult {
  rate: number;
  totalChambres: number;
  chambresPulverisees: number;
  chambresNonPulverisees: number;
  is100Pct: boolean;
  is97TargetReached: boolean;
  tagLabel: string;
  tagBadgeClass: string;
  subText: string;
}

export function calculateSprayCoverage(
  totalChambres: number,
  chambresPulverisees: number
): SprayCalculationResult {
  const tot = Math.max(0, Number(totalChambres) || 0);
  const pulv = Math.max(0, Math.min(tot, Number(chambresPulverisees) || 0));
  const nonPulv = Math.max(0, tot - pulv);

  let rate = 0;
  let is100Pct = false;
  let is97TargetReached = false;
  let tagLabel = 'Non évalué';
  let tagBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
  let subText = 'Aucune chambre recensée';

  if (tot > 0) {
    if (pulv === tot) {
      rate = 100.0;
      is100Pct = true;
      is97TargetReached = true;
      tagLabel = 'TAG 100% · PULVÉRISATION INTÉGRALE';
      tagBadgeClass = 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-bold';
      subText = 'Toutes les chambres traitées (100%)';
    } else {
      rate = Number(((pulv / tot) * 100).toFixed(1));
      is100Pct = false;
      is97TargetReached = rate >= 97.0;

      if (is97TargetReached) {
        tagLabel = `TAG 97% · SEUIL ATTEINT (${rate}%)`;
        tagBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
        subText = `Objectif OMS / SAG 97% validé (${nonPulv} ch. non traitée${nonPulv > 1 ? 's' : ''})`;
      } else {
        tagLabel = `TAG < 97% · VIGILANCE (${rate}%)`;
        tagBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
        subText = `Manque ${Math.max(1, Math.ceil(tot * 0.97) - pulv)} chambre(s) pour atteindre le seuil de 97%`;
      }
    }
  }

  return {
    rate,
    totalChambres: tot,
    chambresPulverisees: pulv,
    chambresNonPulverisees: nonPulv,
    is100Pct,
    is97TargetReached,
    tagLabel,
    tagBadgeClass,
    subText
  };
}

/**
 * Synchronise les données statistiques consolidées d'un village
 * à partir de l'enrôlement réel de terrain (familles et chambres).
 * C'est le socle de vérité calculatoire de l'application SAG.
 */
export function syncVillageWithFieldData(
  village: Village,
  allFamilles: Famille[],
  allChambres: Chambre[]
): Village {
  const villageFamilles = allFamilles.filter(f => f.village_id === village.id);
  
  if (villageFamilles.length === 0) {
    // Conserver les données initiales du village si aucune famille enrôlée
    return village;
  }

  const famIds = new Set(villageFamilles.map(f => f.id));
  const villageChambres = allChambres.filter(c => famIds.has(c.famille_id));

  // 1. Totaux des Chambres
  const chambresTotales = villageFamilles.reduce((sum, f) => sum + (f.nb_chambres_total || 0), 0) 
    || villageChambres.length 
    || village.chambres_totales;

  const chambresPulverisees = villageChambres.filter(c => c.statut === 'pulvérisée').length;
  const chambresNonPulverisees = Math.max(0, chambresTotales - chambresPulverisees);

  const calc = calculateSprayCoverage(chambresTotales, chambresPulverisees);

  // 2. Totaux des Familles
  const famillesTotales = villageFamilles.length;
  let famillesCompletes = 0;
  let famillesPartielles = 0;
  let famillesRefusees = 0;
  let famillesAbsentes = 0;

  villageFamilles.forEach(f => {
    const fChambres = villageChambres.filter(c => c.famille_id === f.id);
    const pulvInFam = fChambres.filter(c => c.statut === 'pulvérisée').length;
    const totInFam = f.nb_chambres_total || fChambres.length;

    if (totInFam > 0 && pulvInFam === totInFam) {
      famillesCompletes++;
    } else if (pulvInFam > 0) {
      famillesPartielles++;
    } else if (f.statut_famille === 'Refusée') {
      famillesRefusees++;
    } else if (f.statut_famille === 'Absente') {
      famillesAbsentes++;
    }
  });

  const famillesPulverisees = famillesCompletes + famillesPartielles;
  
  let tauxFamilles = 0;
  if (famillesTotales > 0) {
    if (famillesPulverisees === famillesTotales) {
      tauxFamilles = 100.0;
    } else {
      tauxFamilles = Number(((famillesPulverisees / famillesTotales) * 100).toFixed(1));
    }
  }

  // 3. Démographie enrôlée sur le terrain
  let popHomme = 0;
  let popFemme = 0;
  let popEnceinte = 0;
  let popEnfant = 0;
  let popCouverte = 0;

  villageFamilles.forEach(f => {
    const fChambres = villageChambres.filter(c => c.famille_id === f.id);
    const pulvInFam = fChambres.filter(c => c.statut === 'pulvérisée').length;

    if (f.population_famille) {
      const h = Number(f.population_famille.homme) || 0;
      const w = Number(f.population_famille.femme) || 0;
      const e = Number(f.population_famille.femme_enceinte) || 0;
      const k = Number(f.population_famille.enfant_0_5) || 0;
      const famTotal = Number(f.population_famille.total) || (h + w + e + k);

      popHomme += h;
      popFemme += w;
      popEnceinte += e;
      popEnfant += k;

      if (pulvInFam > 0) {
        popCouverte += famTotal;
      }
    } else {
      // Valeurs par défaut si non spécifié
      popHomme += 2;
      popFemme += 2;
      popEnfant += 1;
      if (pulvInFam > 0) popCouverte += 5;
    }
  });

  const popTotale = popHomme + popFemme + popEnceinte + popEnfant;
  const ratio = famillesTotales > 0 ? Number((chambresTotales / famillesTotales).toFixed(2)) : 5.0;

  return {
    ...village,
    chambres_totales: chambresTotales,
    chambres_pulverisees: chambresPulverisees,
    chambres_non_pulverisees: chambresNonPulverisees,
    taux_chambres_pct: calc.rate,
    objectif_97_atteint: calc.is97TargetReached,
    
    nb_structures_total: chambresTotales,
    structures_pulverisees: chambresPulverisees,
    taux_structures_pct: calc.rate,

    familles_totales: famillesTotales,
    nb_familles_total: famillesTotales,
    familles_pulverisees: famillesPulverisees,
    stands_pulverises: famillesPulverisees,
    nb_stands_total: famillesTotales,
    familles_completes: famillesCompletes,
    familles_partielles: famillesPartielles,
    familles_refusees: famillesRefusees,
    familles_absentes: famillesAbsentes,
    taux_familles_pct: tauxFamilles,

    pop_homme: popHomme || village.pop_homme,
    pop_femme: popFemme || village.pop_femme,
    pop_femme_enceinte: popEnceinte || village.pop_femme_enceinte,
    pop_enfant_0_5: popEnfant || village.pop_enfant_0_5,
    pop_couverte_total: popCouverte || village.pop_couverte_total,
    population_totale: popTotale || village.population_totale,

    ratio_chambres_famille: ratio,
    heatmap_chambres: getHeatmapInfo(calc.rate),
    heatmap_structures: getHeatmapInfo(calc.rate),
    heatmap_familles: getHeatmapInfo(tauxFamilles)
  };
}
