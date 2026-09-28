/**
 * =============================================================================
 * Types TypeScript - SAG Siguiri IRS Malaria Note Book 2026
 * Hôpital de Koron - AngloGold Ashanti SAG Siguiri (Guinée)
 * =============================================================================
 */

export type UserRole = 'admin' | 'superviseur' | 'agent' | 'observateur';

export interface UserPrivileges {
  peut_saisir: boolean; // Saisie et enregistrer les fiches 1 à 30 et fiches IRS
  peut_telecharger: boolean; // Télécharger (Excel .xlsx, CSV, PDF, exports de données)
  peut_exporter: boolean; // Alias / rétrocompatibilité
  peut_partager: boolean; // Partager les synthèses, fiches et liens
  peut_generer_rapports: boolean; // Générer les rapports officiels de certification
  peut_modifier: boolean; // Modifier les fiches villages et données
  peut_supprimer: boolean; // Supprimer des enregistrements
}

export interface User extends UserPrivileges {
  id: number;
  nom: string;
  matricule: string;
  email: string;
  role: UserRole;
  village_assigne_id: number | null;
  nom_village_assigne?: string;
  actif: boolean; // Statut activé ou désactivé par l'Admin
  derniere_connexion?: string;
}

export type HeatmapCode = 'vert_fonce' | 'vert_clair' | 'jaune' | 'orange' | 'rouge_clair' | 'rouge_fonce';

export interface HeatmapInfo {
  code: HeatmapCode;
  hex: string;
  label: string;
  textColor: string;
  bgColor: string;
  badgeBg: string;
}

export interface Village {
  id: number;
  code: string;
  nom: string;
  type: 'village' | 'SAG' | 'Autre';
  latitude: number;
  longitude: number;
  population_totale: number;
  nb_stands_total: number;
  nb_structures_total: number;
  nb_familles_total: number;
  // Totaux calculés
  stands_pulverises: number;
  structures_pulverisees: number;
  can_refills_total: number;
  pop_homme: number;
  pop_femme: number;
  pop_femme_enceinte: number;
  pop_enfant_0_5: number;
  pop_couverte_total: number;
  derniere_intervention?: string;
  taux_structures_pct: number;
  taux_chambres_pct: number;
  taux_familles_pct: number;
  chambres_totales: number;
  chambres_pulverisees: number;
  chambres_non_pulverisees: number;
  familles_totales: number;
  familles_pulverisees: number;
  familles_completes?: number; // Concessions dont la maison entière a été pulvérisée à 100%
  familles_partielles?: number; // Concessions avec pulvérisation partielle
  familles_refusees?: number;
  familles_absentes?: number;
  ratio_chambres_famille?: number; // Moyenne de chambres par concession familiale
  heatmap_chambres: HeatmapInfo;
  heatmap_familles: HeatmapInfo;
  heatmap_structures: HeatmapInfo;
  objectif_97_atteint: boolean;
}

export type ChambreStatut = 'pulvérisée' | 'non_pulvérisée' | 'absente' | 'refusée';

export type MotifNonPulverisation = 
  | 'aucun' 
  | 'refus_chef' 
  | 'absence' 
  | 'porte_fermee' 
  | 'chambre_verrouillee' 
  | 'encombrement' 
  | 'autre';

export interface Chambre {
  id: number;
  famille_id: number;
  numero_chambre: number;
  type: string;
  statut: ChambreStatut;
  motif_non_pulverisation: MotifNonPulverisation;
  motif_detail?: string;
  date_pulverisation?: string;
  agent_id?: number;
  nom_agent?: string;
  observation?: string;
}

export interface Famille {
  id: number;
  village_id: number;
  nom_village?: string;
  code_famille: string;
  nom_concession?: string; // Nom de la concession / cour familiale
  chef_famille: string;
  contact: string;
  nb_chambres_total: number; // Nombre total de pièces/chambres dans la concession
  chambres_pulverisees: number; // Nombre de pièces pulvérisées
  chambres_non_pulverisees: number;
  statut_famille: 'Pulvérisée complètement' | 'Partiellement pulvérisée' | 'Refusée' | 'Absente' | 'À repasser' | 'Non visitée';
  maison_entiere_pulverisee?: boolean; // true si 100% des pièces sont traitées
  taux_couverture_famille_pct?: number; // (chambres_pulverisees / nb_chambres_total) * 100
  population_famille?: {
    homme: number;
    femme: number;
    femme_enceinte: number;
    enfant_0_5: number;
    total: number;
  };
  date_dernier_passage?: string;
  chambres?: Chambre[];
}

export interface PassageFamille {
  id: number;
  famille_id: number;
  agent_id: number;
  nom_agent: string;
  campagne_id: number;
  date_passage: string;
  statut_famille: string;
  nb_chambres_pulverisees: number;
  nb_chambres_non_pulverisees: number;
  motif_global: string;
  observation: string;
}

export interface DailySprayRecord {
  id: number;
  village_id: number;
  nom_village: string;
  campagne_id: number;
  agent_id: number;
  nom_agent: string;
  date_intervention: string;
  num_jour: number;
  insecticide: string;
  stands: number[]; // 30 colonnes
  structures: number[]; // 30 colonnes
  can_refills: number[]; // 30 colonnes
  stand_total: number;
  structures_total: number;
  can_refills_total: number;
  population: {
    homme: number;
    femme: number;
    femme_enceinte: number;
    enfant_0_5: number;
    total: number;
  };
  observation: string;
}

export interface VecteurRecord {
  id: number;
  village_id: number;
  nom_village: string;
  espece: 'Anopheles gambiae' | 'Anopheles funestus' | 'Aedes aegypti' | 'Culex quinquefasciatus' | 'Autre';
  methode_capture: 'PSC (Pyrèthre Spray Catch)' | 'HLC (Human Landing Catch)' | 'CDC Light Trap' | 'Larva Dipping';
  date_capture: string;
  quantite: number;
  agent_id: number;
  nom_agent: string;
  test_sensibilite: string;
  mortalite_pct?: number;
  observations: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  nom_utilisateur: string;
  matricule: string;
  role: string;
  action: string;
  table_cible: string;
  enregistrement_id?: number | null;
  details: string;
  ip_adresse: string;
  cree_le: string;
}

export type PreventionCategory = 
  | 'refus_chef' 
  | 'sous_dosage_chimique' 
  | 'chambres_fermees' 
  | 'ecart_seuil_97' 
  | 'resistance_vectorielle' 
  | 'groupes_vulnerables' 
  | 'analyse_ligne_excel'
  | 'requete_personnalisee';

export interface PreventionItem {
  id: string;
  codeReference: string;
  dateCreation: string;
  heureCreation: string;
  auteur: string;
  categorie: PreventionCategory;
  titre: string;
  villageCible: string;
  villageId?: number;
  ligneExcelNumero?: number;
  ligneExcelLabel?: string;
  descriptionProbleme: string;
  analyseDiagnostique: {
    resume: string;
    donneesConstatees: {
      libelle: string;
      valeur: string;
      norme: string;
      ecart: string;
      statutGravite: 'Critique' | 'Majeur' | 'Modéré' | 'Sous Contrôle';
    }[];
    causesRacines: string[];
    impactPopulation: string;
  };
  moyensPreventionEtResolution: {
    actionImmediate24h: string;
    actionMoyenTerme7j: string;
    resolutionStructurelle: string;
    recommandationsVille: string;
    protocoleChimiqueEtTechnique: string;
    indicateurCibleSuivi: string;
  };
  statut: 'Validé & Préconisé' | 'En cours d\'application' | 'Résolu';
}
