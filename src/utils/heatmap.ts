import { HeatmapCode, HeatmapInfo } from '../types';

/**
 * Calcul de la classification Heatmap à 6 couleurs (Règle des 97% SAG Siguiri)
 */
export function getHeatmapInfo(taux: number): HeatmapInfo {
  if (taux >= 97.0) {
    return {
      code: 'vert_fonce',
      hex: '#15803d',
      label: 'Objectif atteint (≥97%)',
      textColor: 'text-emerald-800',
      bgColor: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      badgeBg: 'bg-emerald-700 text-white'
    };
  } else if (taux >= 90.0) {
    return {
      code: 'vert_clair',
      hex: '#22c55e',
      label: 'Quasi atteint (90–96.9%)',
      textColor: 'text-green-800',
      bgColor: 'bg-green-50 border-green-300 text-green-800',
      badgeBg: 'bg-green-600 text-white'
    };
  } else if (taux >= 75.0) {
    return {
      code: 'jaune',
      hex: '#eab308',
      label: 'En cours (75–89.9%)',
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-50 border-amber-300 text-amber-800',
      badgeBg: 'bg-amber-500 text-white'
    };
  } else if (taux >= 50.0) {
    return {
      code: 'orange',
      hex: '#f97316',
      label: 'Insuffisant (50–74.9%)',
      textColor: 'text-orange-800',
      bgColor: 'bg-orange-50 border-orange-300 text-orange-800',
      badgeBg: 'bg-orange-600 text-white'
    };
  } else if (taux >= 25.0) {
    return {
      code: 'rouge_clair',
      hex: '#ef4444',
      label: 'Critique (25–49.9%)',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50 border-red-300 text-red-700',
      badgeBg: 'bg-red-500 text-white'
    };
  } else {
    return {
      code: 'rouge_fonce',
      hex: '#b91c1c',
      label: 'Très critique (<25%)',
      textColor: 'text-red-950',
      bgColor: 'bg-red-100 border-red-400 text-red-950',
      badgeBg: 'bg-red-800 text-white'
    };
  }
}

/**
 * Traduction des motifs de non-pulvérisation
 */
export const MOTIF_LABELS: Record<string, string> = {
  aucun: 'Aucun (pulvérisée)',
  refus_chef: 'Refus du chef de famille',
  absence: 'Absence des occupants',
  porte_fermee: 'Porte fermée',
  chambre_verrouillee: 'Chambre verrouillée',
  encombrement: 'Chambre trop encombrée',
  autre: 'Autre motif spécifique'
};
