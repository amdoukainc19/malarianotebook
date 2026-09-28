import { Village, User, Famille, Chambre, DailySprayRecord, VecteurRecord, AuditLog, ChambreStatut, MotifNonPulverisation, PreventionItem } from '../types';
import { getHeatmapInfo } from '../utils/heatmap';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    nom: 'Dr. Faremba Doumbouya',
    matricule: 'SAG-ADM-001',
    email: 'dr.faremba@sag-koron.gn',
    role: 'admin',
    village_assigne_id: null,
    actif: true,
    peut_saisir: true,
    peut_telecharger: true,
    peut_exporter: true,
    peut_partager: true,
    peut_generer_rapports: true,
    peut_modifier: true,
    peut_supprimer: true,
    derniere_connexion: '2026-09-23 08:30:00'
  },
  {
    id: 2,
    nom: 'Dr. Colonel Magassouba',
    matricule: 'SAG-SUP-002',
    email: 'dr.magassouba@sag-koron.gn',
    role: 'superviseur',
    village_assigne_id: null,
    actif: true,
    peut_saisir: true,
    peut_telecharger: true,
    peut_exporter: true,
    peut_partager: true,
    peut_generer_rapports: true,
    peut_modifier: true,
    peut_supprimer: false,
    derniere_connexion: '2026-09-23 08:00:00'
  },
  {
    id: 3,
    nom: 'Agent terrain',
    matricule: 'SAG-AGT-003',
    email: 'agent.terrain@sag-koron.gn',
    role: 'agent',
    village_assigne_id: 1,
    nom_village_assigne: 'FIENKOLEN',
    actif: true,
    peut_saisir: true,
    peut_telecharger: true,
    peut_exporter: true,
    peut_partager: false,
    peut_generer_rapports: false,
    peut_modifier: false,
    peut_supprimer: false,
    derniere_connexion: '2026-09-23 07:45:00'
  },
  {
    id: 4,
    nom: 'Observateur (Visiteur)',
    matricule: 'SAG-OBS-004',
    email: 'observateur.vue@sag-koron.gn',
    role: 'observateur',
    village_assigne_id: null,
    actif: true,
    peut_saisir: false,
    peut_telecharger: false,
    peut_exporter: false,
    peut_partager: false,
    peut_generer_rapports: false,
    peut_modifier: false,
    peut_supprimer: false,
    derniere_connexion: '2026-09-23 06:15:00'
  }
];

export interface RawVillageData {
  id: number;
  code: string;
  nom: string;
  type: 'village' | 'SAG' | 'Autre';
  lat: number;
  lng: number;
  standsObj: number;
  structObj: number;
  standsReel: number;
  structReel: number;
  boites: number;
  homme: number;
  femme: number;
  enceinte: number;
  enfant: number;
  famillesTot: number;
  famillesPulv: number;
  chambresTot: number;
  chambresPulv: number;
  dateDerniere: string;
}

export const RAW_VILLAGES_DATA: RawVillageData[] = [
  { id: 1,  code: 'FIE', nom: 'FIENKOLEN',            type: 'village', lat: 11.4580, lng: -9.1820, standsObj: 95,  structObj: 750, standsReel: 95,  structReel: 745, boites: 138, homme: 450, femme: 480, enceinte: 56, enfant: 420, famillesTot: 150, famillesPulv: 148, chambresTot: 750, chambresPulv: 745, dateDerniere: '2026-06-15' },
  { id: 2,  code: 'SIL', nom: 'SILABADA',             type: 'village', lat: 11.4120, lng: -9.1450, standsObj: 88,  structObj: 690, standsReel: 88,  structReel: 680, boites: 125, homme: 410, femme: 435, enceinte: 50, enfant: 380, famillesTot: 140, famillesPulv: 138, chambresTot: 690, chambresPulv: 680, dateDerniere: '2026-06-16' },
  { id: 3,  code: 'KOL', nom: 'KOLENDA',              type: 'village', lat: 11.4780, lng: -9.1200, standsObj: 80,  structObj: 620, standsReel: 78,  structReel: 610, boites: 112, homme: 370, femme: 390, enceinte: 45, enfant: 340, famillesTot: 125, famillesPulv: 122, chambresTot: 620, chambresPulv: 610, dateDerniere: '2026-06-18' },
  { id: 4,  code: 'TIN', nom: 'TINTISSABANI',         type: 'village', lat: 11.3900, lng: -9.2100, standsObj: 90,  structObj: 710, standsReel: 89,  structReel: 695, boites: 128, homme: 420, femme: 445, enceinte: 52, enfant: 388, famillesTot: 145, famillesPulv: 142, chambresTot: 710, chambresPulv: 695, dateDerniere: '2026-06-19' },
  { id: 5,  code: 'DOU', nom: 'DOUBAYA',              type: 'village', lat: 11.3650, lng: -9.1600, standsObj: 70,  structObj: 540, standsReel: 68,  structReel: 530, boites: 98,  homme: 315, femme: 335, enceinte: 38, enfant: 290, famillesTot: 110, famillesPulv: 107, chambresTot: 540, chambresPulv: 530, dateDerniere: '2026-06-20' },
  { id: 6,  code: 'FAD', nom: 'FADAKO',               type: 'village', lat: 11.5120, lng: -9.2400, standsObj: 105, structObj: 830, standsReel: 104, structReel: 825, boites: 152, homme: 500, femme: 525, enceinte: 62, enfant: 455, famillesTot: 170, famillesPulv: 168, chambresTot: 830, chambresPulv: 825, dateDerniere: '2026-06-22' },
  { id: 7,  code: 'KAM', nom: 'KAMAGAN',              type: 'village', lat: 11.4350, lng: -9.2650, standsObj: 62,  structObj: 480, standsReel: 61,  structReel: 470, boites: 87,  homme: 275, femme: 295, enceinte: 34, enfant: 250, famillesTot: 95,  famillesPulv: 93,  chambresTot: 480, chambresPulv: 470, dateDerniere: '2026-06-23' },
  { id: 8,  code: 'DAB', nom: 'DABA',                 type: 'village', lat: 11.3400, lng: -9.1100, standsObj: 55,  structObj: 430, standsReel: 54,  structReel: 420, boites: 78,  homme: 255, femme: 270, enceinte: 30, enfant: 230, famillesTot: 88,  famillesPulv: 85,  chambresTot: 430, chambresPulv: 420, dateDerniere: '2026-06-24' },
  { id: 9,  code: 'TOR', nom: 'TOROKORO',             type: 'village', lat: 11.4900, lng: -9.0900, standsObj: 72,  structObj: 560, standsReel: 71,  structReel: 550, boites: 102, homme: 330, femme: 348, enceinte: 40, enfant: 300, famillesTot: 115, famillesPulv: 112, chambresTot: 560, chambresPulv: 550, dateDerniere: '2026-06-25' },
  { id: 10, code: 'DIA', nom: 'DIADAYA',              type: 'village', lat: 11.5300, lng: -9.1750, standsObj: 68,  structObj: 520, standsReel: 67,  structReel: 510, boites: 94,  homme: 300, femme: 320, enceinte: 37, enfant: 275, famillesTot: 105, famillesPulv: 102, chambresTot: 520, chambresPulv: 510, dateDerniere: '2026-06-26' },
  { id: 11, code: 'KLD', nom: 'KOLONDA',              type: 'village', lat: 11.4050, lng: -9.2900, standsObj: 58,  structObj: 450, standsReel: 57,  structReel: 440, boites: 81,  homme: 260, femme: 275, enceinte: 31, enfant: 240, famillesTot: 90,  famillesPulv: 87,  chambresTot: 450, chambresPulv: 440, dateDerniere: '2026-06-27' },
  { id: 12, code: 'KOU', nom: 'KOUROUNI',             type: 'village', lat: 11.3200, lng: -9.2300, standsObj: 64,  structObj: 490, standsReel: 63,  structReel: 480, boites: 89,  homme: 285, femme: 305, enceinte: 35, enfant: 260, famillesTot: 98,  famillesPulv: 95,  chambresTot: 490, chambresPulv: 480, dateDerniere: '2026-06-29' },
  { id: 13, code: 'LEN', nom: 'LENKEKORO',            type: 'village', lat: 11.4650, lng: -9.3100, standsObj: 50,  structObj: 390, standsReel: 49,  structReel: 380, boites: 70,  homme: 230, femme: 245, enceinte: 28, enfant: 212, famillesTot: 80,  famillesPulv: 78,  chambresTot: 390, chambresPulv: 380, dateDerniere: '2026-06-30' },
  { id: 14, code: 'MAN', nom: 'MANKITI',              type: 'village', lat: 11.3750, lng: -9.0500, standsObj: 48,  structObj: 369, standsReel: 47,  structReel: 360, boites: 66,  homme: 218, femme: 230, enceinte: 26, enfant: 201, famillesTot: 75,  famillesPulv: 73,  chambresTot: 369, chambresPulv: 360, dateDerniere: '2026-07-01' },
  { id: 15, code: 'SAG', nom: 'SAG OFFICES',          type: 'SAG',     lat: 11.4250, lng: -9.1700, standsObj: 45,  structObj: 350, standsReel: 44,  structReel: 340, boites: 63,  homme: 205, femme: 215, enceinte: 25, enfant: 195, famillesTot: 70,  famillesPulv: 68,  chambresTot: 350, chambresPulv: 340, dateDerniere: '2026-07-02' },
  { id: 16, code: 'STR', nom: 'STRUCTURES DES VILLAGES', type: 'Autre', lat: 11.4300, lng: -9.1650, standsObj: 35,  structObj: 230, standsReel: 34,  structReel: 224, boites: 41,  homme: 65,  femme: 70,  enceinte: 7,  enfant: 55,  famillesTot: 45,  famillesPulv: 43,  chambresTot: 230, chambresPulv: 224, dateDerniere: '2026-07-03' },
  { id: 17, code: 'AUT', nom: 'AUTRES',               type: 'Autre',   lat: 11.4400, lng: -9.1550, standsObj: 20,  structObj: 150, standsReel: 16,  structReel: 140, boites: 26,  homme: 50,  femme: 52,  enceinte: 7,  enfant: 27,  famillesTot: 30,  famillesPulv: 28,  chambresTot: 150, chambresPulv: 140, dateDerniere: '2026-07-04' }
];

export function buildInitialVillages(): Village[] {
  return RAW_VILLAGES_DATA.map(item => {
    const totalPop = item.homme + item.femme + item.enceinte + item.enfant;
    const tauxStructures = item.structObj > 0 ? Number(((item.structReel / item.structObj) * 100).toFixed(1)) : 0;
    const tauxChambres = item.chambresTot > 0 ? Number(((item.chambresPulv / item.chambresTot) * 100).toFixed(1)) : tauxStructures;
    const tauxFamilles = item.famillesTot > 0 ? Number(((item.famillesPulv / item.famillesTot) * 100).toFixed(1)) : 0;
    const ratioChambres = item.famillesTot > 0 ? Number((item.chambresTot / item.famillesTot).toFixed(2)) : 5.0;
    const completes = Math.round(item.famillesPulv * 0.94);
    const partielles = Math.max(0, item.famillesPulv - completes);
    const refusees = Math.round((item.famillesTot - item.famillesPulv) * 0.65);
    const absentes = Math.max(0, item.famillesTot - item.famillesPulv - refusees);

    return {
      id: item.id,
      code: item.code,
      nom: item.nom,
      type: item.type,
      latitude: item.lat,
      longitude: item.lng,
      population_totale: totalPop,
      nb_stands_total: item.standsObj,
      nb_structures_total: item.structObj,
      nb_familles_total: item.famillesTot,
      stands_pulverises: item.standsReel,
      structures_pulverisees: item.structReel,
      can_refills_total: item.boites,
      pop_homme: item.homme,
      pop_femme: item.femme,
      pop_femme_enceinte: item.enceinte,
      pop_enfant_0_5: item.enfant,
      pop_couverte_total: totalPop,
      derniere_intervention: item.dateDerniere,
      taux_structures_pct: tauxStructures,
      taux_chambres_pct: tauxChambres,
      taux_familles_pct: tauxFamilles,
      chambres_totales: item.chambresTot,
      chambres_pulverisees: item.chambresPulv,
      chambres_non_pulverisees: item.chambresTot - item.chambresPulv,
      familles_totales: item.famillesTot,
      familles_pulverisees: item.famillesPulv,
      familles_completes: completes,
      familles_partielles: partielles,
      familles_refusees: refusees,
      familles_absentes: absentes,
      ratio_chambres_famille: ratioChambres,
      heatmap_chambres: getHeatmapInfo(tauxChambres),
      heatmap_familles: getHeatmapInfo(tauxFamilles),
      heatmap_structures: getHeatmapInfo(tauxStructures),
      objectif_97_atteint: tauxChambres >= 97.0
    };
  });
}

// Générateur de concessions, familles et chambres réelles pour chaque village de la SAG Siguiri
const GUINEAN_HEADS = [
  { nom: 'Elhadj Oumar Camara', contact: '+224 622 11 22 33', concession: 'Concession Camarakounda' },
  { nom: 'Mamadouba Sylla', contact: '+224 621 44 55 66', concession: 'Cour Familiale Sylla' },
  { nom: 'Kaba Kourouma', contact: '+224 628 77 88 99', concession: 'Concession Kourouma & Frères' },
  { nom: 'Fatoumata Binta Barry', contact: '+224 624 33 22 11', concession: 'Concession Barry & Fils' },
  { nom: 'Lamine Magassouba', contact: '+224 620 99 88 77', concession: 'Grande Cour Magassouba' },
  { nom: 'Ibrahima Sory Kaba', contact: '+224 623 88 77 66', concession: 'Concession Kaba Bila' },
  { nom: 'Sékouba Condé', contact: '+224 625 12 34 56', concession: 'Concession Condékounda' },
  { nom: 'Ansoumane Diallo', contact: '+224 626 98 76 54', concession: 'Concession Diallo & Associés' },
  { nom: 'Mariama Ciré Traoré', contact: '+224 627 45 67 89', concession: 'Grande Concession Traoré' },
  { nom: 'Facely Keita', contact: '+224 629 33 44 55', concession: 'Concession Keitakounda' },
  { nom: 'Mory Soumah', contact: '+224 620 11 99 88', concession: 'Cour des Anciens Soumah' },
  { nom: 'Hadja Saran Cissé', contact: '+224 624 77 66 55', concession: 'Concession Cissé & Famille' }
];

const ROOM_TEMPLATES = [
  'Chambre Principale (Chef)',
  'Chambre Épouse 1',
  'Chambre Épouse 2',
  'Chambre Enfants Garçons',
  'Chambre Enfants Filles',
  'Chambre Visiteurs',
  'Magasin Vivrier / Annexe'
];

export function generateAllFamillesAndChambres(): { familles: Famille[]; chambres: Chambre[] } {
  const generatedFamilles: Famille[] = [];
  const generatedChambres: Chambre[] = [];

  let famIdCounter = 1;
  let chIdCounter = 1;

  RAW_VILLAGES_DATA.forEach((village) => {
    // 6 à 8 familles représentatives et auditables par village
    const famCount = Math.min(8, Math.max(5, Math.round(village.famillesTot / 20)));

    for (let fIdx = 0; fIdx < famCount; fIdx++) {
      const head = GUINEAN_HEADS[(fIdx + village.id * 2) % GUINEAN_HEADS.length];
      const famCode = `${village.code}-FAM-${String(fIdx + 1).padStart(3, '0')}`;
      
      // Nombre de pièces de cette concession : 4 à 6
      const roomCount = 4 + ((fIdx + village.id) % 3);
      
      // Statut de pulvérisation : la plupart des familles ont la maison entière pulvérisée
      // fIdx === 1 : Partiellement pulvérisée (2 chambres refusées ou fermées)
      // fIdx === 4 : Si le village a un refus, marquer refusée
      const isRefused = fIdx === 4 && (village.chambresPulv / village.chambresTot) < 0.98;
      const isPartial = fIdx === 1;

      let treatedRooms = roomCount;
      let famStatus: Famille['statut_famille'] = 'Pulvérisée complètement';
      let isFullHouse = true;

      if (isRefused) {
        treatedRooms = 0;
        famStatus = 'Refusée';
        isFullHouse = false;
      } else if (isPartial) {
        treatedRooms = Math.max(1, roomCount - 2);
        famStatus = 'Partiellement pulvérisée';
        isFullHouse = false;
      }

      const untreatedRooms = roomCount - treatedRooms;
      const currentFamId = famIdCounter++;

      const popH = 2 + (fIdx % 2);
      const popF = 2 + ((fIdx + 1) % 2);
      const popE = (fIdx % 3 === 0) ? 1 : 0;
      const popEnf = 1 + (fIdx % 3);

      generatedFamilles.push({
        id: currentFamId,
        village_id: village.id,
        nom_village: village.nom,
        code_famille: famCode,
        nom_concession: `${head.concession} (${village.nom})`,
        chef_famille: head.nom,
        contact: head.contact,
        nb_chambres_total: roomCount,
        chambres_pulverisees: treatedRooms,
        chambres_non_pulverisees: untreatedRooms,
        statut_famille: famStatus,
        maison_entiere_pulverisee: isFullHouse,
        taux_couverture_famille_pct: Number(((treatedRooms / roomCount) * 100).toFixed(1)),
        population_famille: {
          homme: popH,
          femme: popF,
          femme_enceinte: popE,
          enfant_0_5: popEnf,
          total: popH + popF + popE + popEnf
        },
        date_dernier_passage: village.dateDerniere
      });

      // Générer les chambres correspondantes pour cette concession
      for (let rIdx = 0; rIdx < roomCount; rIdx++) {
        const roomType = ROOM_TEMPLATES[rIdx % ROOM_TEMPLATES.length];
        const isThisRoomTreated = rIdx < treatedRooms;

        let roomStatut: ChambreStatut = 'pulvérisée';
        let roomMotif: MotifNonPulverisation = 'aucun';
        let motifDetail = '';

        if (!isThisRoomTreated) {
          if (isRefused) {
            roomStatut = 'refusée';
            roomMotif = 'refus_chef';
            motifDetail = 'Refus catégorique du chef de concession';
          } else if (rIdx === roomCount - 1) {
            roomStatut = 'non_pulvérisée';
            roomMotif = 'encombrement';
            motifDetail = 'Stockage vivres & grains sous bâche';
          } else {
            roomStatut = 'non_pulvérisée';
            roomMotif = 'porte_fermee';
            motifDetail = 'Occupant au marché / clé absente';
          }
        }

        generatedChambres.push({
          id: chIdCounter++,
          famille_id: currentFamId,
          numero_chambre: rIdx + 1,
          type: roomType,
          statut: roomStatut,
          motif_non_pulverisation: roomMotif,
          motif_detail: motifDetail,
          date_pulverisation: isThisRoomTreated ? village.dateDerniere : undefined,
          agent_id: 3,
          nom_agent: 'Mamady Keita (SAG Koron)'
        });
      }
    }
  });

  return { familles: generatedFamilles, chambres: generatedChambres };
}

const { familles: initialFamList, chambres: initialChList } = generateAllFamillesAndChambres();

export const INITIAL_FAMILLES: Famille[] = initialFamList;
export const INITIAL_CHAMBRES: Chambre[] = initialChList;

export const INITIAL_VECTEURS: VecteurRecord[] = [
  {
    id: 1,
    village_id: 1,
    nom_village: 'FIENKOLEN',
    espece: 'Anopheles gambiae',
    methode_capture: 'PSC (Pyrèthre Spray Catch)',
    date_capture: '2026-06-17',
    quantite: 24,
    agent_id: 3,
    nom_agent: 'Mamady Keita',
    test_sensibilite: 'Actellic 300cs (Pirimiphos-méthyl)',
    mortalite_pct: 98.5,
    observations: 'Sensibilité optimale à Actellic 300cs'
  },
  {
    id: 2,
    village_id: 2,
    nom_village: 'SILABADA',
    espece: 'Anopheles funestus',
    methode_capture: 'CDC Light Trap',
    date_capture: '2026-06-18',
    quantite: 15,
    agent_id: 3,
    nom_agent: 'Mamady Keita',
    test_sensibilite: 'Actellic 300cs',
    mortalite_pct: 97.0,
    observations: 'Vecteur secondaire bien maîtrisé'
  },
  {
    id: 3,
    village_id: 6,
    nom_village: 'FADAKO',
    espece: 'Anopheles gambiae',
    methode_capture: 'HLC (Human Landing Catch)',
    date_capture: '2026-06-23',
    quantite: 32,
    agent_id: 4,
    nom_agent: 'Sékou Traoré',
    test_sensibilite: 'Actellic 300cs',
    mortalite_pct: 99.0,
    observations: 'Densité agressive en zone fluviale'
  },
  {
    id: 4,
    village_id: 4,
    nom_village: 'TINTISSABANI',
    espece: 'Culex quinquefasciatus',
    methode_capture: 'Larva Dipping',
    date_capture: '2026-06-25',
    quantite: 18,
    agent_id: 4,
    nom_agent: 'Sékou Traoré',
    test_sensibilite: 'Test OMS',
    mortalite_pct: 92.0,
    observations: 'Surveillance gîtes larvaires'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    nom_utilisateur: 'Dr. Aboubacar Camara',
    matricule: 'SAG-MED-001',
    role: 'admin',
    action: 'INITIALISATION_SYSTEME',
    table_cible: 'system',
    enregistrement_id: null,
    details: 'Initialisation de l\'application IRS Malaria Note Book 2026 - Hôpital de Koron',
    ip_adresse: '192.168.1.10',
    cree_le: '2026-09-23 08:30:15'
  },
  {
    id: 2,
    user_id: 1,
    nom_utilisateur: 'Dr. Aboubacar Camara',
    matricule: 'SAG-MED-001',
    role: 'admin',
    action: 'IMPORT_EXCEL_SYNTHESE',
    table_cible: 'pulverisations_journalieres',
    enregistrement_id: null,
    details: 'Migration et calibrage du MAIN REPORT (7909 structures, 1005 stands, 14505 pop)',
    ip_adresse: '192.168.1.10',
    cree_le: '2026-09-23 08:35:42'
  },
  {
    id: 3,
    user_id: 3,
    nom_utilisateur: 'Mamady Keita',
    matricule: 'SAG-AGT-104',
    role: 'agent',
    action: 'SAISIE_JOURNEE_IRS',
    table_cible: 'pulverisations_journalieres',
    enregistrement_id: 1,
    details: 'Saisie Fienkolen Jour 1 : 95 stands, 745 structures, 138 refills',
    ip_adresse: '192.168.1.45',
    cree_le: '2026-09-23 09:12:00'
  },
  {
    id: 4,
    user_id: 2,
    nom_utilisateur: 'Dr. Mariama Diallo',
    matricule: 'SAG-SUP-012',
    role: 'superviseur',
    action: 'VALIDATION_RAPPORT',
    table_cible: 'villages',
    enregistrement_id: 1,
    details: 'Validation de l\'objectif atteint (99.3%) pour Fienkolen',
    ip_adresse: '192.168.1.14',
    cree_le: '2026-09-23 10:04:18'
  }
];

export const INITIAL_PREVENTIONS: PreventionItem[] = [
  {
    id: 'PREV-2026-001',
    codeReference: 'SAG-PREV-2026-N°741820',
    dateCreation: '2026-09-23',
    heureCreation: '09:30',
    auteur: 'Dr. Faremba Doumbouya (Admin en Chef)',
    categorie: 'refus_chef',
    titre: 'Résolution des Poches de Refus de Chefs de Famille & Concessions Partielles',
    villageCible: 'KOLENDA & BASSIN SAG',
    villageId: 3,
    ligneExcelNumero: 3,
    ligneExcelLabel: 'Feuille Terrain 03 - Concessions Ouest',
    descriptionProbleme: 'L\'Admin a constaté une résistance communautaire dans 3 concessions majeures (familles Camara et Diallo), entraînant 8 chambres refusées par crainte d\'odeur d\'insecticide et de déplacement des vivres.',
    analyseDiagnostique: {
      resume: 'Baisse locale de 3.2% de la couverture concessionnelle. Risque épidémiologique élevé de maintien d\'un réservoir vectoriel Anopheles gambiae au centre du village.',
      donneesConstatees: [
        { libelle: 'Taux Couverture Chambres', valeur: '96.2%', norme: '≥ 97.0%', ecart: '-0.8%', statutGravite: 'Majeur' },
        { libelle: 'Chambres Non Pulvérisées (Refus)', valeur: '8 chambres', norme: '0 tolérance', ecart: '+8 chambres', statutGravite: 'Critique' },
        { libelle: 'Population Exposée dans ces Concessions', valeur: '42 habitants (dont 6 enfants <5ans)', norme: '100% protégés', ecart: '42 non protégés', statutGravite: 'Critique' }
      ],
      causesRacines: [
        'Crainte infondée de toxicité sur les récoltes de maïs entreposées',
        'Absence du chef de concession lors de la pré-sensibilisation matinale',
        'Déficit d\'implication préalable du patriarche et des sages du conseil villageois'
      ],
      impactPopulation: '42 personnes directement vulnérables aux piqûres nocturnes, potentiel foyer d\'infection pour tout le village.'
    },
    moyensPreventionEtResolution: {
      actionImmediate24h: 'Médiation directe par le Dr. Faremba Doumbouya accompagné du Doyen des Sages de Kolenda avec bâche de protection fournie pour les greniers vivriers.',
      actionMoyenTerme7j: 'Repassage ciblé (Round de rattrapage) avec équipe d\'opérateurs féminines pour rassurer les ménagères.',
      resolutionStructurelle: 'Intégration d\'un protocole d\'adhésion signé par le Chef de District avant tout déploiement des équipes IRS.',
      recommandationsVille: 'Maintien d\'un dialogue communautaire permanent et installation d\'affiches en langue Malinké.',
      protocoleChimiqueEtTechnique: 'Pulvérisation à l\'Actellic 300CS sous pression contrôlée 40 PSI en veillant à l\'aération de 2h réglementaire.',
      indicateurCibleSuivi: 'Objectif : 100% de rattrapage des 8 chambres sous 48h, portant le taux de Kolenda à 98.4%.'
    },
    statut: 'Validé & Préconisé'
  },
  {
    id: 'PREV-2026-002',
    codeReference: 'SAG-PREV-2026-N°892014',
    dateCreation: '2026-09-23',
    heureCreation: '11:15',
    auteur: 'Dr. Faremba Doumbouya (Admin en Chef)',
    categorie: 'analyse_ligne_excel',
    titre: 'Analyse Chirurgicale Ligne 12 du Registre Excel : Dérive du Ratio Structures / Bidon',
    villageCible: 'FIENKOLEN (Secteur Nord)',
    villageId: 1,
    ligneExcelNumero: 12,
    ligneExcelLabel: 'Ligne 12 - Saisie Grille Excel 1→30 (Équipe Bravo)',
    descriptionProbleme: 'Auscultation de la Ligne 12 de la grille Excel : consommation excessive de 14 recharges de bidons (can refills) pour seulement 42 structures traitées, soit un ratio de 3.0 structures/bidon au lieu de la norme de 5.4.',
    analyseDiagnostique: {
      resume: 'Sur-consommation anormale d\'Actellic 300cs de +44% sur cette ligne de calcul. Risque de rupture de stock avant la fin du cycle et surdosage nocif sur les parois en banco.',
      donneesConstatees: [
        { libelle: 'Ratio Structures / Bidon', valeur: '3.00 struct./bidon', norme: '5.20 à 5.80', ecart: '-2.40 struct.', statutGravite: 'Critique' },
        { libelle: 'Consommation Insecticide Constatée', valeur: '14 bidons (140L mix)', norme: '8 bidons (80L mix)', ecart: '+6 bidons (+75%)', statutGravite: 'Critique' },
        { libelle: 'Pression Manomètre Pompe Hudson', valeur: '62 PSI (Excessif)', norme: '35 à 55 PSI', ecart: '+12 PSI', statutGravite: 'Majeur' }
      ],
      causesRacines: [
        'Buse en céramique 8002E usée ayant élargi l\'orifice de pulvérisation',
        'Vitesse de balayage mural trop lente (3.5s au lieu de 5.0s par bande de 2m)',
        'Vanne de régulation CFV (Control Flow Valve) défaillante sur le pulvérisateur N°7'
      ],
      impactPopulation: 'Dépassement budgétaire du contingent chimique minier SAG et dépôt superficiel cristallisé sur les murs.'
    },
    moyensPreventionEtResolution: {
      actionImmediate24h: 'Remplacement immédiat de la buse et calibration au débitmètre d\'eau (550 ml/min requis).',
      actionMoyenTerme7j: 'Contrôle quotidien de calibration des 30 pompes Hudson X-Pert au magasin central avant le départ de 06h30.',
      resolutionStructurelle: 'Audit hebdomadaire automatisé des ratios Excel avec blocage d\'alerte si le ratio s\'écarte de plus de 15% de la médiane.',
      recommandationsVille: 'Ajuster les fiches de dotation logistique de Fienkolen et récupérer les fûts résiduels pour triple rinçage.',
      protocoleChimiqueEtTechnique: 'Remise à niveau stricte de la dosimétrie à 1.0 g m.a./m² avec Actellic 300CS conforme OMS.',
      indicateurCibleSuivi: 'Régularisation du ratio à 5.4 ± 0.3 structures/bidon sur les lignes 13 à 30.'
    },
    statut: 'Validé & Préconisé'
  },
  {
    id: 'PREV-2026-003',
    codeReference: 'SAG-PREV-2026-N°562309',
    dateCreation: '2026-09-23',
    heureCreation: '14:40',
    auteur: 'Dr. Faremba Doumbouya (Admin en Chef)',
    categorie: 'chambres_fermees',
    titre: 'Résolution des Portes Fermées & Absences lors du Premier Passage Matinal',
    villageCible: 'SILABADA & TINTISSABANI',
    villageId: 2,
    ligneExcelNumero: 8,
    ligneExcelLabel: 'Feuille Concessions 08 - Quartier Orpaillage',
    descriptionProbleme: '12 concessions trouvées portes closes entre 07h30 et 10h00 en raison du départ précoce des chefs de ménage vers les placers d\'orpaillage artisanal.',
    analyseDiagnostique: {
      resume: 'Incompatibilité temporelle entre le passage standard des brigades de pulvérisation et les horaires économiques des communautés minières locales.',
      donneesConstatees: [
        { libelle: 'Concessions Verrouillées', valeur: '12 concessions', norme: '< 2 concessions', ecart: '+10', statutGravite: 'Majeur' },
        { libelle: 'Chambres Cibles Inaccessibles', valeur: '58 chambres', norme: '0', ecart: '+58 pièces', statutGravite: 'Critique' },
        { libelle: 'Taux Réalisé Actuel', valeur: '95.8%', norme: '≥ 97.0%', ecart: '-1.2%', statutGravite: 'Majeur' }
      ],
      causesRacines: [
        'Horaires de travail sur les sites d\'extraction d\'or débutant dès 06h30',
        'Méfiance à laisser les clés aux voisins sans consigne officielle',
        'Canal de notification radio communautaire non synchronisé sur les horaires de traitement'
      ],
      impactPopulation: 'Plus de 65 personnes non protégées au retour du travail, vecteur piquant à la tombée de la nuit.'
    },
    moyensPreventionEtResolution: {
      actionImmediate24h: 'Mise en place d\'une brigade spéciale du soir "Shift Crépusculaire" de 17h00 à 19h30 pour traiter les concessions rentrées.',
      actionMoyenTerme7j: 'Désignation d\'un référent de quartier chargé de collecter l\'autorisation d\'ouverture et de superviser le traitement.',
      resolutionStructurelle: 'Modification des feuilles de route IRS pour intégrer un double passage automatique J+1.',
      recommandationsVille: 'Annonces à la radio rurale de Siguiri et communication par le crieur public la veille au soir.',
      protocoleChimiqueEtTechnique: 'Pulvérisation rapide sécurisée, évacuation des animaux domestiques pendant 2h.',
      indicateurCibleSuivi: 'Ratissage complet des 58 chambres verrouillées avant le vendredi soir pour hisser le taux à 98.9%.'
    },
    statut: 'En cours d\'application'
  },
  {
    id: 'PREV-2026-004',
    codeReference: 'SAG-PREV-2026-N°914755',
    dateCreation: '2026-09-24',
    heureCreation: '08:20',
    auteur: 'Dr. Faremba Doumbouya (Admin en Chef)',
    categorie: 'groupes_vulnerables',
    titre: 'Bouclier de Protection Prioritaire Mère-Enfant & Femmes Enceintes non Couvertes',
    villageCible: 'FADAKO & STRUCTURES SPÉCIALES',
    villageId: 6,
    ligneExcelNumero: 18,
    ligneExcelLabel: 'Ligne 18 - Démographie Sanitaire FAD',
    descriptionProbleme: 'Recensement de 62 femmes enceintes et 455 enfants de moins de 5 ans dans des structures à forte promiscuité avec présence d\'annexes vivrières non traitées.',
    analyseDiagnostique: {
      resume: 'L\'indice de vulnérabilité épidémiologique atteint 52% de la population globale du village. La protection doit être totale et renforcée.',
      donneesConstatees: [
        { libelle: 'Femmes Enceintes Recensées', valeur: '62 femmes', norme: '100% sous abri IRS', ecart: 'Conforme', statutGravite: 'Sous Contrôle' },
        { libelle: 'Enfants 0-5 ans Recensés', valeur: '455 enfants', norme: '100% sous abri IRS', ecart: 'Conforme', statutGravite: 'Sous Contrôle' },
        { libelle: 'Taux Couverture Structures', valeur: '99.4%', norme: '≥ 97.0%', ecart: '+2.4%', statutGravite: 'Sous Contrôle' }
      ],
      causesRacines: [
        'Sensibilité physiologique accrue aux accès palustres graves et anémies fœtales',
        'Sommeil occasionnel des nourrissons sous les vérandas extérieures pendant les chaleurs de 21h'
      ],
      impactPopulation: 'Nécessité absolue de maintenir un effet barrière insecticide sans aucune faille.'
    },
    moyensPreventionEtResolution: {
      actionImmediate24h: 'Couplage systématique du traitement IRS des chambres avec la dotation gratuite de MILDA (Moustiquaires Imprégnées à Longue Durée d\'Action).',
      actionMoyenTerme7j: 'Consultations prénatales avancées au poste de santé de Fadako avec distribution de TPIg (Traitement Préventif Intermittent).',
      resolutionStructurelle: 'Suivi mensuel de la parasitémie post-campagne en collaboration avec la maternité de l\'Hôpital de Koron.',
      recommandationsVille: 'Sensibiliser les mères au couchage exclusif sous moustiquaire imprégnée dès 20h00.',
      protocoleChimiqueEtTechnique: 'Traitement soigné des sous-pentes et plafonds en banco où reposent préférentiellement les anophèles gorgés.',
      indicateurCibleSuivi: 'Zéro cas de paludisme grave chez les nourrissons de Fadako durant les 6 mois post-intervention.'
    },
    statut: 'Validé & Préconisé'
  },
  {
    id: 'PREV-2026-005',
    codeReference: 'SAG-PREV-2026-N°302187',
    dateCreation: '2026-09-24',
    heureCreation: '09:05',
    auteur: 'Dr. Faremba Doumbouya (Admin en Chef)',
    categorie: 'resistance_vectorielle',
    titre: 'Surveillance Entomologique & Maintien de la Rémanence d\'Actellic 300CS',
    villageCible: 'ZONE FLUVIALE SIGUIRI (TINGUIRINTO & FIENKOLEN)',
    villageId: 1,
    ligneExcelNumero: 22,
    ligneExcelLabel: 'Ligne 22 - Bio-Essais Cônes OMS Vecteurs',
    descriptionProbleme: 'Suivi de la rémanence après 45 jours d\'application sur les murs en banco et ciment pour anticiper toute baisse d\'abattement des Anopheles gambiae s.l.',
    analyseDiagnostique: {
      resume: 'La mortalité à 24h sur les cônes OMS reste excellente à 98.5%, mais l\'humidité saisonnière le long du fleuve Niger accélère le lessivage des surfaces extérieures.',
      donneesConstatees: [
        { libelle: 'Taux Mortalité 24h Bio-essais OMS', valeur: '98.5%', norme: '≥ 80.0%', ecart: '+18.5%', statutGravite: 'Sous Contrôle' },
        { libelle: 'Temps d\'Abattement KD50', valeur: '28 minutes', norme: '< 45 minutes', ecart: '-17 min', statutGravite: 'Sous Contrôle' },
        { libelle: 'Rémanence Efficace Estimée', valeur: '5.5 mois', norme: '5 à 6 mois', ecart: 'Conforme', statutGravite: 'Sous Contrôle' }
      ],
      causesRacines: [
        'Prolifération de gîtes larvaires temporaires dans les ornières et mares après les premières pluies de mousson',
        'Réchauffement nocturne favorisant l\'exophilie des vecteurs secondaires'
      ],
      impactPopulation: 'Risque de piqûres résiduelles en extérieur avant le coucher.'
    },
    moyensPreventionEtResolution: {
      actionImmediate24h: 'Traitement biologique antilarvaire au Bti (Bacillus thuringiensis israelensis) des gîtes identifiés par Larva Dipping.',
      actionMoyenTerme7j: 'Répétition des bio-essais sur cônes à J+60 et J+90 sur les 3 types de supports (banco brut, ciment peint, bois).',
      resolutionStructurelle: 'Planification de la rotation insecticide pour la campagne 2027 (alternance organophosphoré / néonicotinoïde).',
      recommandationsVille: 'Curage communautaire des caniveaux et élimination des récipients d\'eau stagnante aux abords des concessions.',
      protocoleChimiqueEtTechnique: 'Respect scrupuleux du dosage de 1g/m² d\'Actellic 300CS pour éviter toute sélection de pression de résistance.',
      indicateurCibleSuivi: 'Maintien de la mortalité supérieure à 85% jusqu\'au 6ème mois post-campagne.'
    },
    statut: 'Résolu'
  }
];
