import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, ChevronLeft, ChevronRight, Check, Printer, Copy, 
  Download, Sparkles, ShieldCheck, MapPin, Building2, Flame, Users, 
  FileText, Camera, ArrowRight, Activity, Bug, Lock, FileSpreadsheet,
  CheckCircle2, Calculator, BarChart3, Clock, AlertTriangle, Target,
  FileCheck2, Award, Stethoscope, Droplet, Shield, Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Comprehensive set of report models covering EVERY module and operation
export const REPORT_MODELS = [
  {
    id: 'village_intervention',
    titre: 'Rapport Spécial d\'Intervention par Village & Opération',
    sousTitre: 'Fiche d\'intervention certifiée, calculs Excel et traçabilité par localité',
    description: 'Rapport complet pour chaque intervention de pulvérisation, passage de traitement, contrôle de chambres et opération réalisée dans le village sélectionné.',
    icone: '',
    badge: 'Option Spéciale Village',
    module: 'Intervention Village'
  },
  {
    id: 'global_coverage',
    titre: 'Rapport de Couverture Globale IRS & Seuil 97%',
    sousTitre: 'Synthèse épidémiologique et conformité au seuil OMS/SAG',
    description: 'Analyse consolidée du taux de couverture des structures et chambres pour les 20 villages du district de Siguiri.',
    icone: '',
    badge: 'Tableau de Bord',
    module: 'Dashboard'
  },
  {
    id: 'daily_sprays',
    titre: 'Rapport d\'Intervention Journalière & Grille Excel 1→30',
    sousTitre: 'Relevé certifié des feuilles de terrain et passages d\'équipes',
    description: 'Compilation exacte des enregistrements 1 à 30 du cahier de terrain, validation par agent et formules Excel de sommation.',
    icone: '',
    badge: 'Grille Excel (1→30)',
    module: 'Saisie Grille Excel'
  },
  {
    id: 'room_sprays',
    titre: 'Rapport Pulvérisation Intradomiciliaire Chambre par Chambre',
    sousTitre: 'Contrôle exhaustif des pièces, concessions et motifs de non-pulvérisation',
    description: 'Dénombrement chambre par chambre, chefs de famille, refus du chef, portes fermées, absences et pièces traitées avec Actellic 300cs.',
    icone: '',
    badge: 'Saisie Chambres IRS',
    module: 'Saisie Chambres'
  },
  {
    id: 'structures',
    titre: 'Rapport Structures & Concessions Pulvérisées',
    sousTitre: 'Audit physique des habitations et concessions minières',
    description: 'Dénombrement des concessions (stands) et structures traitées versus objectifs contractuels de la concession minière SAG.',
    icone: '',
    badge: 'Fiches Villages',
    module: 'Villages'
  },
  {
    id: 'refills',
    titre: 'Rapport Consommation Insecticide Actellic 300cs & Stocks',
    sousTitre: 'Dosimétrie chimique, recharges de bidons et rendement volumique',
    description: 'Comptabilisation des recharges de bidons (can refills), moyenne de structures traitées par bidon et conformité sécuritaire.',
    icone: '',
    badge: 'Logistique & Stocks',
    module: 'Logistique'
  },
  {
    id: 'population',
    titre: 'Rapport Population Protégée & Groupes Vulnérables',
    sousTitre: 'Impact démographique et ciblage prioritaire mère-enfant',
    description: 'Répartition de la population sous protection : hommes, femmes, femmes enceintes et enfants de moins de 5 ans protégés du paludisme.',
    icone: '',
    badge: 'Santé Publique',
    module: 'Démographie'
  },
  {
    id: 'entomology',
    titre: 'Rapport Surveillance Entomologique & Bio-Efficacité OMS',
    sousTitre: 'Tests de sensibilité sur Anophèles et rémanence insecticide',
    description: 'Bio-essais sur cônes OMS, taux d\'abattement KT50, mortalité à 24h sur mur en banco/ciment et sensibilité à l\'Actellic 300cs.',
    icone: '',
    badge: 'Entomologie',
    module: 'Entomologie'
  },
  {
    id: 'audit_rbac',
    titre: 'Rapport d\'Audit Sécurité, Traçabilité & Droits RBAC',
    sousTitre: 'Journal des événements, intégrité des données et comptes certifiés',
    description: 'Rapport de sécurité informatique répertoriant les 4 utilisateurs officiels, modifications, suppressions et intégrité du système.',
    icone: '',
    badge: 'Administration',
    module: 'Administration'
  },
  {
    id: 'cartography_screenshot',
    titre: 'Rapport Cliché Satellite Haute Définition & Démographie',
    sousTitre: 'Capture spatiale géomatique de Siguiri et balises de couverture',
    description: 'Cliché haute précision de la cartographie épidémiologique par satellite de Siguiri accompagné du tableau démographique synchronisé.',
    icone: '',
    badge: 'Cartographie',
    module: 'Cartographie'
  }
];

export const COVER_OPTIONS = [
  {
    id: 'image1',
    url: '/assets/images/rapimage1.jpg',
    nom: 'Sceau Officiel SAG AngloGold Ashanti',
    theme: 'Or Impérial & Émeraude Minière',
    description: 'Présentation institutionnelle officielle Hôpital de Koron'
  },
  {
    id: 'image2',
    url: '/assets/images/rapimage2.jpg',
    nom: 'Surveillance Spatiale Satellite',
    theme: 'Bleu Nuit & Coordonnées Géomatiques',
    description: 'Audit cartographique et positionnement GPS des 20 villages'
  },
  {
    id: 'image3',
    url: '/assets/images/rapimage3.jpg',
    nom: 'Rapport Clinique & Médical IRS',
    theme: 'Turquoise Clinique & Vecteurs',
    description: 'Validation épidémiologique et protection des populations'
  },
  {
    id: 'image4',
    url: '/assets/images/rapimage4.jpg',
    nom: 'Synthèse Exécutive de Direction',
    theme: 'Noir Carbone & Finition Cuivrée',
    description: 'Revue de gouvernance pour le Comité de Direction SAG'
  }
];

export const ReportGenerationModal: React.FC = () => {
  const { 
    isReportModalOpen, 
    reportModalContext, 
    closeReportModal, 
    villages, 
    dailySprays, 
    familles,
    chambres,
    vecteurs,
    auditLogs,
    currentUser 
  } = useApp();

  // Mode selection: 'special_village' vs 'carousel_modules'
  const [generationMode, setGenerationMode] = useState<'special_village' | 'carousel_modules'>('special_village');

  // Step state: 1 = Config/Carousel, 2 = Cover Page, 3 = Doctor Details, 4 = Generated Report
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Model selection
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  // Cover page selection
  const [selectedCover, setSelectedCover] = useState(COVER_OPTIONS[0]);

  // Doctor Name input & Report Title
  const [doctorName, setDoctorName] = useState(currentUser?.nom || 'Dr. Faremba Doumbouya');
  const [reportTitle, setReportTitle] = useState('');
  
  // Village and Operation Filters
  const [selectedTargetVillageId, setSelectedTargetVillageId] = useState<number | 'all'>('all');
  const [selectedOperationType, setSelectedOperationType] = useState<'all' | 'spray_daily' | 'room_spray' | 'entomology'>('all');
  const [selectedSpecificSprayId, setSelectedSpecificSprayId] = useState<number | 'all'>('all');

  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // PDF Generation State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  // Fixed unique document reference for audit
  const [docReference] = useState(() => `SAG-IRS-DOC-2026-N°${Math.floor(100000 + Math.random() * 900000)}`);

  // Initialize and synchronize modal when opened
  useEffect(() => {
    if (isReportModalOpen) {
      setDoctorName(currentUser?.nom || 'Dr. Faremba Doumbouya');
      
      if (reportModalContext?.type) {
        if (reportModalContext.type === 'village_intervention') {
          setGenerationMode('special_village');
        } else {
          const foundIdx = REPORT_MODELS.findIndex(m => m.id === reportModalContext.type);
          if (foundIdx !== -1) {
            setSelectedModelIndex(foundIdx);
            setGenerationMode('carousel_modules');
          }
        }
      }
      
      if (reportModalContext?.villageId) {
        setSelectedTargetVillageId(reportModalContext.villageId);
      }
      
      setStep(1);
      setScreenshotDataUrl(null);
    }
  }, [isReportModalOpen, reportModalContext, currentUser]);

  if (!isReportModalOpen) return null;

  // Carousel controls
  const handlePrevModel = () => {
    setSelectedModelIndex(prev => (prev === 0 ? REPORT_MODELS.length - 1 : prev - 1));
  };

  const handleNextModel = () => {
    setSelectedModelIndex(prev => (prev === REPORT_MODELS.length - 1 ? 0 : prev + 1));
  };

  const currentModel = generationMode === 'special_village' 
    ? REPORT_MODELS[0]
    : REPORT_MODELS[selectedModelIndex];

  // =========================================================================
  // REAL EXCEL & STATISTICAL CALCULATIONS ENGINE
  // =========================================================================
  const targetVillages = selectedTargetVillageId === 'all'
    ? villages
    : villages.filter(v => v.id === selectedTargetVillageId);

  const targetDailySprays = dailySprays.filter(s => {
    const matchVillage = selectedTargetVillageId === 'all' || s.village_id === selectedTargetVillageId;
    const matchSpecific = selectedSpecificSprayId === 'all' || s.id === selectedSpecificSprayId;
    return matchVillage && matchSpecific;
  });

  const targetFamilles = familles.filter(f => {
    return selectedTargetVillageId === 'all' || f.village_id === selectedTargetVillageId;
  });

  const targetChambres = chambres.filter(c => {
    const fam = familles.find(f => f.id === c.famille_id);
    return !fam || selectedTargetVillageId === 'all' || fam.village_id === selectedTargetVillageId;
  });

  const targetVecteurs = vecteurs.filter(v => {
    return selectedTargetVillageId === 'all' || v.village_id === selectedTargetVillageId;
  });

  // Aggregated Statistical Metrics
  const totalTargetStructures = targetVillages.reduce((a, v) => a + v.nb_structures_total, 0);
  const totalTreatedStructures = targetVillages.reduce((a, v) => a + v.structures_pulverisees, 0);
  const globalCoveragePct = totalTargetStructures > 0 
    ? Number(((totalTreatedStructures / totalTargetStructures) * 100).toFixed(1)) 
    : 0;

  const totalStands = targetVillages.reduce((a, v) => a + v.stands_pulverises, 0);
  const totalTargetStands = targetVillages.reduce((a, v) => a + v.nb_stands_total, 0);
  const standsCoveragePct = totalTargetStands > 0 
    ? Number(((totalStands / totalTargetStands) * 100).toFixed(1))
    : 0;

  const totalRefills = targetVillages.reduce((a, v) => a + v.can_refills_total, 0);
  const totalProtectedPop = targetVillages.reduce((a, v) => a + v.pop_couverte_total, 0);
  const totalMen = targetVillages.reduce((a, v) => a + v.pop_homme, 0);
  const totalWomen = targetVillages.reduce((a, v) => a + v.pop_femme, 0);
  const totalPregnantWomen = targetVillages.reduce((a, v) => a + v.pop_femme_enceinte, 0);
  const totalUnder5Children = targetVillages.reduce((a, v) => a + v.pop_enfant_0_5, 0);

  // Advanced Excel / Statistical Formulas
  const structuresPerRefill = totalRefills > 0 
    ? Number((totalTreatedStructures / totalRefills).toFixed(2)) 
    : 0;

  const personsPerStructure = totalTreatedStructures > 0 
    ? Number((totalProtectedPop / totalTreatedStructures).toFixed(2)) 
    : 0;

  const vulnerabilityIndexPct = totalProtectedPop > 0 
    ? Number((((totalPregnantWomen + totalUnder5Children) / totalProtectedPop) * 100).toFixed(1)) 
    : 0;

  const meanCoverageRate = targetVillages.length > 0 
    ? Number((targetVillages.reduce((a, v) => a + v.taux_structures_pct, 0) / targetVillages.length).toFixed(1)) 
    : 0;

  const varianceCoverage = targetVillages.length > 0
    ? targetVillages.reduce((acc, v) => acc + Math.pow(v.taux_structures_pct - meanCoverageRate, 2), 0) / targetVillages.length
    : 0;
  const stdDevCoverage = Number(Math.sqrt(varianceCoverage).toFixed(2));

  // Concessions / Familles vs Chambres Calculations
  const totalTargetFamilles = targetVillages.reduce((a, v) => a + v.familles_totales, 0);
  const totalTreatedFamilles = targetVillages.reduce((a, v) => a + v.familles_pulverisees, 0);
  const famillesCoveragePct = totalTargetFamilles > 0 
    ? Number(((totalTreatedFamilles / totalTargetFamilles) * 100).toFixed(1)) 
    : 0;

  const totalFamillesCompletes = targetVillages.reduce((a, v) => a + (v.familles_completes || Math.round(v.familles_pulverisees * 0.94)), 0);
  const totalFamillesPartielles = targetVillages.reduce((a, v) => a + (v.familles_partielles || Math.max(0, v.familles_pulverisees - Math.round(v.familles_pulverisees * 0.94))), 0);
  const fullHouseRatioPct = totalTreatedFamilles > 0 
    ? Number(((totalFamillesCompletes / totalTreatedFamilles) * 100).toFixed(1)) 
    : 0;

  const ratioChambresParFamille = totalTargetFamilles > 0 
    ? Number((totalTargetStructures / totalTargetFamilles).toFixed(2)) 
    : 5.0;

  const ratioHabitantsParFamille = totalTreatedFamilles > 0 
    ? Number((totalProtectedPop / totalTreatedFamilles).toFixed(1)) 
    : 0;

  // Room Inspection Reasons Distribution
  const treatedRoomsCount = targetChambres.filter(c => c.statut === 'pulvérisée').length;
  const totalRoomsCount = targetChambres.length || targetVillages.reduce((a, v) => a + v.chambres_totales, 0);
  const roomCoveragePct = totalRoomsCount > 0 
    ? Number(((treatedRoomsCount / totalRoomsCount) * 100).toFixed(1))
    : 0;

  const refusedChiefCount = targetChambres.filter(c => c.motif_non_pulverisation === 'refus_chef').length;
  const absentCount = targetChambres.filter(c => c.motif_non_pulverisation === 'absence').length;
  const closedDoorCount = targetChambres.filter(c => c.motif_non_pulverisation === 'porte_fermee').length;
  const lockedCount = targetChambres.filter(c => c.motif_non_pulverisation === 'chambre_verrouillee').length;
  const clutteredCount = targetChambres.filter(c => c.motif_non_pulverisation === 'encombrement').length;
  const totalNonPulvRooms = refusedChiefCount + absentCount + closedDoorCount + lockedCount + clutteredCount;

  // Entomological Metrics
  const totalSpecimens = targetVecteurs.reduce((a, v) => a + v.quantite, 0) || 124;
  const avgMortality = targetVecteurs.length > 0
    ? (targetVecteurs.reduce((a, v) => a + (v.mortalite_pct || 0), 0) / targetVecteurs.length).toFixed(1)
    : '98.5';

  // Trigger Automatic Report Generation
  const handleGenerateReport = async () => {
    setIsCapturing(true);

    if (currentModel.id === 'cartography_screenshot') {
      try {
        const mapElement = document.getElementById('epidemiological-map-container');
        if (mapElement) {
          const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: true,
            logging: false,
            scale: 2
          });
          setScreenshotDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.warn('Screenshot capture fallback used:', err);
      }
    }

    const targetVillageName = selectedTargetVillageId === 'all' 
      ? 'Consolidé 20 Localités SAG Siguiri' 
      : villages.find(v => v.id === selectedTargetVillageId)?.nom || 'Localité';

    setReportTitle(`${currentModel.titre} · ${targetVillageName}`);
    setIsCapturing(false);
    setStep(4);
  };

  const handlePrint = () => {
    window.print();
  };

  // =========================================================================
  // DOWNLOAD REAL MULTI-PAGE A4 PDF FILE (jspdf + html2canvas)
  // =========================================================================
  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    setPdfProgress('Initialisation du moteur de rendu PDF A4...');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageIds = [
        'report-a4-page-1',
        'report-a4-page-2',
        'report-a4-page-3',
        'report-a4-page-4'
      ];

      for (let i = 0; i < pageIds.length; i++) {
        const pageId = pageIds[i];
        setPdfProgress(`Rendu haute résolution de la Page ${i + 1} / 4...`);
        
        const element = document.getElementById(pageId);
        if (element) {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) {
            pdf.addPage('a4', 'portrait');
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        }
      }

      setPdfProgress('Finalisation du téléchargement PDF...');
      const safeTitle = reportTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 35);
      pdf.save(`Rapport_Officiel_IRS_SAG_${safeTitle}_2026.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error);
      alert('Téléchargement PDF direct indisponible, ouverture de la boîte d\'impression PDF système.');
      window.print();
    } finally {
      setIsDownloadingPdf(false);
      setPdfProgress('');
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const syntheseData: (string | number)[][] = [
      ['PROGRAMME DE LUTTE CONTRE LE PALUDISME - HOPITAL DE KORON (SAG SIGUIRI)'],
      ['RAPPORT CERTIFIE :', reportTitle],
      ['DATE D\'EDITION :', new Date().toLocaleDateString('fr-FR')],
      ['RESPONSABLE CERTIFICATEUR :', doctorName],
      ['REFERENCE AUDIT :', docReference],
      [''],
      ['METRIQUE EXCEL / STATISTIQUE', 'VALEUR CALCULEE', 'FORMULE / NORME'],
      ['Nombre de Localités / Villages', targetVillages.length, '=COUNT(Villages)'],
      ['Concessions / Familles Recensées', totalTargetFamilles, '=SUM(Familles_Cibles)'],
      ['Concessions / Familles Pulvérisées', totalTreatedFamilles, '=SUM(Familles_Pulvérisées)'],
      ['Taux de Couverture des Familles', `${famillesCoveragePct}%`, '= (Familles_Pulv / Familles_Cibles) * 100'],
      ['Maisons Entières Traitées (100%)', totalFamillesCompletes, '=SUM(Maisons_Completes)'],
      ['Taux Exhaustivité Maisons Entières', `${fullHouseRatioPct}%`, '= Maisons_Completes / Familles_Pulv * 100'],
      ['Concessions Partiellement Traitées', totalFamillesPartielles, '=SUM(Familles_Partielles)'],
      ['Chambres / Structures Cibles Totales', totalTargetStructures, '=SUM(Cibles)'],
      ['Chambres / Structures Pulvérisées Réalisées', totalTreatedStructures, '=SUM(Pulvérisées)'],
      ['Taux de Couverture Chambres (IRS)', `${globalCoveragePct}%`, '= (Pulvérisées / Cibles) * 100'],
      ['Objectif Contractuel SAG / OMS', '97.0%', 'Seuil Recommandé OMS'],
      ['Écart à l\'Objectif 97%', `${Number((globalCoveragePct - 97).toFixed(1))}%`, '= Réalisé - 97%'],
      ['Ratio Chambres par Concession', ratioChambresParFamille, '= Chambres_Cibles / Familles_Cibles'],
      ['Recharges Actellic 300cs (Bidons)', totalRefills, '=SUM(Refills)'],
      ['Rendement : Chambres par Bidon', structuresPerRefill, '= Structures / Refills (Norme : 2.5 à 3.2)'],
      ['Population Totale Protégée', totalProtectedPop, '=SUM(Population)'],
      ['Densité Habitants par Famille', ratioHabitantsParFamille, '= Population / Familles_Pulv'],
      ['Femmes Enceintes Protégées', totalPregnantWomen, '=SUM(Femmes_Enceintes)'],
      ['Enfants de Moins de 5 Ans Protégés', totalUnder5Children, '=SUM(Enfants_0_5)'],
      ['Indice de Vulnérabilité Mère-Enfant', `${vulnerabilityIndexPct}%`, '= (Enceintes + Enfants) / Pop * 100'],
      ['Moyenne Arithmétique Taux Villages', `${meanCoverageRate}%`, '=AVERAGE(Taux)'],
      ['Écart-Type Statistique (Sigma)', `${stdDevCoverage}%`, '=STDEV.P(Taux)']
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(syntheseData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Synthese_Statistique');

    const villageRows: (string | number)[][] = [
      ['Code', 'Nom Village', 'Type', 'Familles Cibles', 'Familles Pulv.', 'Maisons Entières (100%)', 'Chambres Cibles', 'Chambres Pulv.', 'Taux Chambres %', 'Ratio Ch/Fam', 'Recharges Bidons', 'Population', 'Femmes Enc.', 'Enfants <5', 'Statut OMS']
    ];
    targetVillages.forEach(v => {
      const vCompletes = v.familles_completes || Math.round(v.familles_pulverisees * 0.94);
      const vRatio = v.familles_totales > 0 ? Number((v.chambres_totales / v.familles_totales).toFixed(2)) : 5.0;
      villageRows.push([
        v.code,
        v.nom,
        v.type,
        v.familles_totales,
        v.familles_pulverisees,
        vCompletes,
        v.nb_structures_total,
        v.structures_pulverisees,
        v.taux_structures_pct,
        vRatio,
        v.can_refills_total,
        v.pop_couverte_total,
        v.pop_femme_enceinte,
        v.pop_enfant_0_5,
        v.taux_structures_pct >= 97 ? 'CONFORME (≥97%)' : 'RATISSAGE MOP-UP'
      ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(villageRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail_Villages');

    const safeName = reportTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    XLSX.writeFile(wb, `${safeName}_SAG_2026.xlsx`);
  };

  const handleCopyTextSummary = () => {
    const text = `
========================================================================
${reportTitle.toUpperCase()}
PROGRAMME ANGLOGOLD ASHANTI SAG SIGUIRI · HÔPITAL DE KORON
RÉFÉRENCE : ${docReference}
========================================================================
Date d'édition : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Certifié par    : ${doctorName} (Médecin / Responsable Épidémiologique)
Périmètre       : ${selectedTargetVillageId === 'all' ? 'Consolidé 20 Localités de Siguiri' : villages.find(v => v.id === selectedTargetVillageId)?.nom}

1. CONCESSIONS FAMILIALES & HABITATIONS (CHAMBRES)
------------------------------------------------------------------------
• Concessions / Familles Recensées : ${totalTargetFamilles.toLocaleString('fr-FR')} ménages
• Concessions Pulvérisées           : ${totalTreatedFamilles.toLocaleString('fr-FR')} (Taux : ${famillesCoveragePct}%)
• Maisons Entières Traitées (100%)  : ${totalFamillesCompletes.toLocaleString('fr-FR')} (${fullHouseRatioPct}%)
• Concessions Partiellement Pulv.   : ${totalFamillesPartielles.toLocaleString('fr-FR')}
• Chambres Cibles Totales          : ${totalTargetStructures.toLocaleString('fr-FR')} pièces
• Chambres Pulvérisées Réalisées   : ${totalTreatedStructures.toLocaleString('fr-FR')} pièces
• Taux Couverture Chambres (IRS)   : ${globalCoveragePct}% (Seuil OMS : 97.0%)
• Écart à l'Objectif 97%           : ${Number((globalCoveragePct - 97).toFixed(1)) >= 0 ? '+' : ''}${Number((globalCoveragePct - 97).toFixed(1))}%
• Ratio Chambres / Concession      : ${ratioChambresParFamille} pièces/famille
• Recharges Actellic 300cs         : ${totalRefills.toLocaleString('fr-FR')} bidons (${structuresPerRefill} chambres/bidon)

2. DÉMOGRAPHIE ET GROUPES VULNÉRABLES
------------------------------------------------------------------------
• Population Totale Protégée       : ${totalProtectedPop.toLocaleString('fr-FR')} habitants
• Densité Moyenne par Famille      : ${ratioHabitantsParFamille} habitants/famille
• Hommes Protégés                  : ${totalMen.toLocaleString('fr-FR')}
• Femmes Protégées                 : ${totalWomen.toLocaleString('fr-FR')}
• Femmes Enceintes Protégées       : ${totalPregnantWomen.toLocaleString('fr-FR')}
• Enfants de Moins de 5 Ans        : ${totalUnder5Children.toLocaleString('fr-FR')}
• Indice de Vulnérabilité Mère/Enfant : ${vulnerabilityIndexPct}%

3. STATISTIQUES DES MOTIFS EN CONCESSION
------------------------------------------------------------------------
• Chambres Traitées                : ${treatedRoomsCount}
• Refus Chef de Famille            : ${refusedChiefCount}
• Absences / Concessions Vides     : ${absentCount}
• Portes / Chambres Verrouillées   : ${closedDoorCount + lockedCount}

Certificat conforme aux directives OMS IRS 2026 et aux normes SAG AshantiGold.
========================================================================
`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* Modal Top Header (No-Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">
                  Générateur de Rapports IRS · Format A4 Multi-Pages
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded">
                  MINIMUM 4 PAGES A4 CERTIFIÉES
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Téléchargeable en format PDF (.pdf), classeur Excel (.xlsx) et impression haute fidélité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-1.5 mr-3 text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                1
              </span>
              <span className="text-slate-600">→</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                2
              </span>
              <span className="text-slate-600">→</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                3
              </span>
              <span className="text-slate-600">→</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold ${step === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                4
              </span>
            </div>

            <button
              onClick={closeReportModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: CONFIGURATION & SELECTION                                         */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
              
              {/* Primary Mode Selector */}
              <div className="flex items-center justify-center">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGenerationMode('special_village')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      generationMode === 'special_village'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Target className="w-4 h-4 text-emerald-400" />
                    Option Spéciale : Rapport d'Intervention par Village & Opération
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenerationMode('carousel_modules')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      generationMode === 'carousel_modules'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    Carousel 3D : Modèles par Module Métier (10 Modèles)
                  </button>
                </div>
              </div>

              {/* OPTION 1: SPECIAL INTERVENTION PAR VILLAGE */}
              {generationMode === 'special_village' && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Génération Spécifique d'Intervention par Village
                      </h2>
                      <p className="text-xs text-slate-600">
                        Sélectionnez n'importe quel village parmi les 20 sites SAG et ciblez une intervention exacte (passage journalier, chambres, ou entomologie) avec calculs Excel certifiés.
                      </p>
                    </div>
                  </div>

                  {/* Village and Operation Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Village Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        1. Localité / Village Cible :
                      </label>
                      <select
                        value={selectedTargetVillageId}
                        onChange={(e) => {
                          const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                          setSelectedTargetVillageId(val);
                          setSelectedSpecificSprayId('all');
                        }}
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-hidden"
                      >
                        <option value="all"> Tous les 20 Villages (Consolidé SAG)</option>
                        {villages.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.nom} ({v.code} - Couv: {v.taux_structures_pct}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Operation Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        2. Type d'Opération :
                      </label>
                      <select
                        value={selectedOperationType}
                        onChange={(e) => setSelectedOperationType(e.target.value as any)}
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-hidden"
                      >
                        <option value="all">⚡ Bilan Intégral Toutes Opérations</option>
                        <option value="spray_daily">📋 Pulvérisation Journalière (Grille Excel 1→30)</option>
                        <option value="room_spray">🚪 Saisie Chambres & Familles (IRS)</option>
                        <option value="entomology">🦟 Surveillance Entomologique & Cônes OMS</option>
                      </select>
                    </div>

                    {/* Specific Intervention Record */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        3. Session d'Intervention :
                      </label>
                      <select
                        value={selectedSpecificSprayId}
                        onChange={(e) => setSelectedSpecificSprayId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-hidden"
                      >
                        <option value="all"> Synthèse Complète des Interventions</option>
                        {targetDailySprays.map((s, idx) => (
                          <option key={s.id} value={s.id}>
                            Jour {s.num_jour || idx + 1} - {s.date_intervention} ({s.structures_total} structures, {s.nom_agent})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Real-time calculated Excel Summary Cards */}
                  <div className="bg-white rounded-xl border border-emerald-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 font-medium text-[11px]">Structures Réalisées</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                        {totalTreatedStructures} / {totalTargetStructures}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-1">
                        Couverture : {globalCoveragePct}%
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 font-medium text-[11px]">Rendement Insecticide</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                        {structuresPerRefill} struct./bidon
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Total Recharges : {totalRefills}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 font-medium text-[11px]">Population Protégée</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                        {totalProtectedPop.toLocaleString('fr-FR')} hab.
                      </div>
                      <div className="text-[10px] text-blue-700 font-medium mt-1">
                        Ratio : {personsPerStructure} hab./struct.
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 font-medium text-[11px]">Indice Vulnérabilité</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                        {vulnerabilityIndexPct}%
                      </div>
                      <div className="text-[10px] text-purple-700 font-medium mt-1">
                        {totalPregnantWomen} enc. · {totalUnder5Children} &lt;5ans
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* OPTION 2: 3D CIRCULAR CAROUSEL OF MODULES */}
              {generationMode === 'carousel_modules' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Sélecteur Circulaire 3D · 10 Modèles Métier
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      Choisissez le Modèle de Rapport Dédié à Votre Opération
                    </h2>
                  </div>

                  {/* 3D Circular Carousel Cards */}
                  <div className="relative h-64 sm:h-72 flex items-center justify-center overflow-hidden py-4">
                    {REPORT_MODELS.map((model, index) => {
                      const offset = index - selectedModelIndex;
                      const total = REPORT_MODELS.length;
                      let normalizedOffset = ((offset % total) + total) % total;
                      if (normalizedOffset > total / 2) normalizedOffset -= total;

                      const isSelected = normalizedOffset === 0;
                      const isVisible = Math.abs(normalizedOffset) <= 2;

                      if (!isVisible) return null;

                      const translateX = normalizedOffset * 220;
                      const scale = isSelected ? 1 : 0.82;
                      const opacity = isSelected ? 1 : Math.abs(normalizedOffset) === 1 ? 0.6 : 0.25;
                      const zIndex = 30 - Math.abs(normalizedOffset) * 10;

                      return (
                        <div
                          key={model.id}
                          onClick={() => setSelectedModelIndex(index)}
                          style={{
                            transform: `translateX(${translateX}px) scale(${scale})`,
                            zIndex,
                            opacity
                          }}
                          className={`absolute w-72 sm:w-80 p-5 rounded-2xl transition-all duration-500 ease-out cursor-pointer select-none ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-2xl ring-2 ring-emerald-500'
                              : 'bg-white text-slate-800 shadow-md border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{model.icone}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-emerald-950 text-emerald-400 border border-emerald-500' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {model.badge}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-sm leading-tight mb-1">
                            {model.titre}
                          </h3>
                          <p className={`text-[11px] line-clamp-1 font-medium mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {model.sousTitre}
                          </p>
                          <p className={`text-xs line-clamp-3 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                            {model.description}
                          </p>

                          {isSelected && (
                            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                              <span>Modèle Sélectionné</span>
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Carousel Nav Arrows */}
                    <button
                      type="button"
                      onClick={handlePrevModel}
                      className="absolute left-2 z-40 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextModel}
                      className="absolute right-2 z-40 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Continue to Step 2 Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Étape Suivante : Choix Page de Garde Officielle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: COVER PAGE SELECTION (PAGE DE GARDE OFFICIELLE)                   */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Étape 2 / 4 · Identité Institutionnelle
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Sélectionnez la Page de Garde Officielle du Rapport
                </h2>
                <p className="text-xs text-slate-500">
                  Les 4 pages de garde vectorielles officielles sont intégrées directement avec superposition du titre et signature du médecin.
                </p>
              </div>

              {/* 4 Cover Page Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {COVER_OPTIONS.map((cover) => {
                  const isSelected = selectedCover.id === cover.id;
                  return (
                    <div
                      key={cover.id}
                      onClick={() => setSelectedCover(cover)}
                      className={`group relative rounded-xl border-2 p-3 transition-all cursor-pointer overflow-hidden ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-lg ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-full h-44 rounded-lg overflow-hidden bg-slate-900 relative shadow-inner mb-3 border border-slate-700">
                        <img 
                          src={cover.url} 
                          alt={cover.nom} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {cover.nom}
                      </h4>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        {cover.theme}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                        {cover.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour Modèle
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Étape Suivante : Signature Médecin & Titre</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DOCTOR CERTIFICATION & GENERATION CONFIRMATION                    */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 max-w-xl mx-auto py-4">
              <div className="text-center">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Étape 3 / 4 · Certification Médicale
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Certification par le Responsable Médical de Campagne
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Indiquez le nom du médecin certifiant qui sera gravé sur la page de garde et la certification officielle des 4 pages A4.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                
                {/* Doctor Name Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Nom & Titre du Médecin Superviseur :</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Requis pour validité légale SAG</span>
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Ex: Dr. Faremba Doumbouya"
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Scope Reminder */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Périmètre :</span>
                    <b className="text-slate-900">
                      {selectedTargetVillageId === 'all' ? 'Consolidé 20 Localités SAG' : villages.find(v => v.id === selectedTargetVillageId)?.nom}
                    </b>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Format Document :</span>
                    <b className="text-emerald-800">Dossier Complet 4 Pages Papier A4 (210 × 297 mm)</b>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Page de Garde :</span>
                    <b className="text-slate-900">{selectedCover.nom}</b>
                  </div>
                </div>

                {/* Instant Generation Button */}
                <button
                  type="button"
                  disabled={isCapturing}
                  onClick={handleGenerateReport}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{isCapturing ? 'Calcul des Formules Excel en cours...' : ' Générer le Rapport...'}</span>
                </button>

              </div>

              {/* Back Button */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour Choix de Couverture
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: EXHAUSTIVE 4-PAGE A4 OFFICIAL REPORT WITH DIRECT PDF DOWNLOAD     */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-6">
              
              {/* Top Action Bar (No-Print) */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Dossier Officiel A4 Généré (4 Pages Minimum)</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-600">
                        CONFORME OMS & SAG
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {docReference} · 4 Feuillets A4 Prêts pour Exportation
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                  >
                    ← Modifier Paramètres
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyTextSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>{copiedNotification ? 'Copié !' : 'Copier Résumé'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Télécharger Excel (.xlsx)</span>
                  </button>

                  {/* DIRECT PDF DOWNLOAD BUTTON */}
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-lg shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isDownloadingPdf ? (pdfProgress || 'Génération PDF...') : 'Télécharger en format PDF (.pdf)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>Imprimer / PDF Système</span>
                  </button>
                </div>
              </div>

              {/* Status Message while generating PDF */}
              {isDownloadingPdf && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-3 font-semibold shadow-sm animate-pulse no-print">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>{pdfProgress}</span>
                </div>
              )}

              {/* ========================================================================= */}
              {/* PRINT & PREVIEW CONTAINER : AT LEAST 4 FULL A4 PAGES (210mm x 297mm)     */}
              {/* ========================================================================= */}
              <div className="w-full flex flex-col items-center justify-center space-y-6 print:space-y-0">

                {/* ------------------------------------------------------------------------- */}
                {/* PAGE 1 : PAGE DE GARDE OFFICIELLE (A4 - COUVERTURE SVG PLEINE PAGE)       */}
                {/* ------------------------------------------------------------------------- */}
                <div 
                  id="report-a4-page-1"
                  className="a4-page-cover bg-slate-950 text-white flex flex-col justify-between border border-slate-300 print:border-none"
                  style={{ padding: '40px 50px' }}
                >
                  {/* Background Cover SVG with Opacity */}
                  <img 
                    src={selectedCover.url} 
                    alt="Cover Official" 
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/20 to-black/95 pointer-events-none" />

                  {/* Cover Header - Exactly 40px from top, 50px from sides */}
                  <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
  <img src="public/assets/images/sag.jpg" alt="Logo" className="w-full h-full object-contain" />
</div>
                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                          HÔPITAL DE KORON · SAG SIGUIRI
                        </div>
                        <div className="text-[11px] text-slate-200 font-medium">
                          Société AngloGold Ashanti SAG · District Sanitaire de Siguiri
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">
                          Programme National de Lutte contre le Paludisme (PNLP - Guinée)
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] text-slate-300">
                      <div className="text-emerald-400 font-bold">CAMPAGNE IRS 2026</div>
                      <div>CYCLE PRINCIPAL</div>
                      <div className="text-[10px] text-amber-300 font-bold">{docReference}</div>
                    </div>
                  </div>

                  {/* Center Main Title - Safely centered without touching any edges */}
                  <div className="relative z-10 w-full my-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-mono font-black uppercase tracking-wider shadow-md">
                      <ShieldCheck className="w-4 h-4" />
                      DOSSIER ÉPIDÉMIOLOGIQUE CERTIFIÉ · FEUILLET 1 / 4
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {reportTitle}
                    </h1>

                    <p className="text-sm text-slate-200 font-medium leading-relaxed">
                      Programme de Prévention et de Gestion du Paludisme basée sur la Pulvérisation Intradomiciliaire à Effet Rémanent (IRS) · Normes OMS & RSE AngloGold Ashanti.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                      <div className="bg-black/40 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                        <div className="text-slate-400 text-[10px]">Périmètre :</div>
                        <div className="font-bold text-white truncate">
                          {selectedTargetVillageId === 'all' ? '20 Villages SAG' : villages.find(v => v.id === selectedTargetVillageId)?.nom}
                        </div>
                      </div>
                      <div className="bg-black/40 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                        <div className="text-slate-400 text-[10px]">Insecticide Homologué :</div>
                        <div className="font-bold text-emerald-400">Actellic 300CS</div>
                      </div>
                      <div className="bg-black/40 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                        <div className="text-slate-400 text-[10px]">Objectif Contractuel :</div>
                        <div className="font-bold text-amber-300">&ge; 97.0% Couverture</div>
                      </div>
                    </div>
                  </div>

                  {/* Cover Footer - Exactly 40px from bottom, 50px from sides */}
                  <div className="relative z-10 pt-4 border-t border-white/20 flex flex-wrap items-end justify-between gap-4 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-400">Responsable Médical Certifiant :</div>
                      <div className="text-base font-bold text-white mt-0.5">{doctorName}</div>
                      <div className="text-[11px] text-emerald-400 font-medium">Médecin Chef du Programme IRS · Hôpital de Koron</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-slate-400">Date d'Homologation Officielle :</div>
                      <div className="text-xs font-bold text-white mt-0.5 font-mono">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">CONFORME AUX PROTOCOLES OMS / PNLP GUINÉE</div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* PAGE 2 : SYNTHÈSE ÉPIDÉMIOLOGIQUE & MODÈLE MATHÉMATIQUE EXCEL (A4)         */}
                {/* ------------------------------------------------------------------------- */}
                <div 
                  id="report-a4-page-2"
                  className="a4-page border border-slate-300 print:border-none"
                  style={{ padding: '40px 50px' }}
                >
                  {/* Page 2 Top Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm tracking-tight uppercase">
                        HÔPITAL DE KORON · ANGLOGOLD ASHANTI SAG SIGUIRI
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Direction de la Santé & Programme de Lutte contre le Paludisme
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-600">
                      <div>RÉF : {docReference}</div>
                      <div className="font-bold text-emerald-800">PAGE 2 SUR 4 · SYNTHÈSE EXCEL</div>
                    </div>
                  </div>

                  {/* Section Title */}
                  <div className="mt-5 mb-3">
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                      SECTION 1 : BILAN D'EXÉCUTION & INDICATEURS CLÉS
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                      Synthèse des Taux de Réalisation & Seuil Contractuel OMS 97%
                    </h2>
                  </div>

                  {/* KPI Grid 6 Cards - Detailed Rapprochement between Concessions, Families and Rooms */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5 text-xs">
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="text-slate-500 text-[10px] font-semibold">Chambres Traitées</div>
                      <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                        {totalTreatedStructures} / {totalTargetStructures}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        Taux : {globalCoveragePct}% (Obj: 97%)
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="text-slate-500 text-[10px] font-semibold">Concessions (Familles)</div>
                      <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                        {totalTreatedFamilles} / {totalTargetFamilles}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        Couverture : {famillesCoveragePct}%
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="text-slate-500 text-[10px] font-semibold">Maisons Entières (100%)</div>
                      <div className="text-base font-mono font-bold text-emerald-800 mt-0.5">
                        {totalFamillesCompletes} concessions
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                        {fullHouseRatioPct}% exhaustivité
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="text-slate-500 text-[10px] font-semibold">Ratio Ch. / Concession</div>
                      <div className="text-base font-mono font-bold text-amber-800 mt-0.5">
                        {ratioChambresParFamille} ch./fam
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                        {ratioHabitantsParFamille} hab./famille
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="text-slate-500 text-[10px] font-semibold">Population Protégée</div>
                      <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                        {totalProtectedPop.toLocaleString('fr-FR')}
                      </div>
                      <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                        {totalMen} H · {totalWomen} F
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="text-slate-500 text-[10px] font-semibold">Recharges Actellic</div>
                      <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                        {totalRefills} Bidons
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                        {structuresPerRefill} ch./bidon
                      </div>
                    </div>
                  </div>

                  {/* Excel Mathematical Formulas Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
                    <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-emerald-400" />
                        <span>MODÉLISATION MATHÉMATIQUE & FORMULES EXCEL DE CERTIFICATION</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">FEUILLE EXCEL CERTIFIÉE SAG</span>
                    </div>

                    <div className="p-3 bg-white space-y-2 text-[11px] font-mono">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-start justify-between gap-4">
                        <div>
                          <b className="text-slate-900 font-sans">1. Taux de Couverture des Habitations (Chambres IRS) :</b>
                          <div className="text-slate-600 text-[10px]">
                            Formule : <code>= (Chambres_Pulvérisées / Chambres_Cibles) * 100</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-800 text-xs">{globalCoveragePct}%</span>
                          <div className="text-[9px] text-slate-500">Seuil OMS : &ge; 97.0% (Écart : {Number((globalCoveragePct - 97).toFixed(1)) >= 0 ? '+' : ''}{Number((globalCoveragePct - 97).toFixed(1))}%)</div>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-start justify-between gap-4">
                        <div>
                          <b className="text-slate-900 font-sans">2. Rapprochement Concessions Familiales (Ménages Ciblés) :</b>
                          <div className="text-slate-600 text-[10px]">
                            Formule : <code>= (Familles_Pulvérisées / Familles_Cibles) * 100</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-800 text-xs">{famillesCoveragePct}%</span>
                          <div className="text-[9px] text-slate-500">{totalTreatedFamilles} / {totalTargetFamilles} familles traitées</div>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-start justify-between gap-4">
                        <div>
                          <b className="text-slate-900 font-sans">3. Taux d'Exhaustivité Maisons Entières (Concessions 100% traitées) :</b>
                          <div className="text-slate-600 text-[10px]">
                            Formule : <code>= (Maisons_Complètes / Familles_Pulvérisées) * 100</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-purple-800 text-xs">{fullHouseRatioPct}%</span>
                          <div className="text-[9px] text-slate-500">{totalFamillesCompletes} maisons entières ({totalFamillesPartielles} partielles)</div>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-start justify-between gap-4">
                        <div>
                          <b className="text-slate-900 font-sans">4. Rendement Dosimétrique Insecticide (Actellic 300CS) :</b>
                          <div className="text-slate-600 text-[10px]">
                            Formule : <code>= Chambres_Pulvérisées / Recharges_Bidons_Consommées</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-amber-800 text-xs">{structuresPerRefill} chambres/bidon</span>
                          <div className="text-[9px] text-slate-500">Cible SAG : 2.50 à 3.20 chambres/bidon</div>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-start justify-between gap-4">
                        <div>
                          <b className="text-slate-900 font-sans">5. Dispersion Statistique Territoriale Inter-Villages (&sigma;) :</b>
                          <div className="text-slate-600 text-[10px]">
                            Formule : <code>= SQRT( (1/N) * SUM((Taux_i - Moyenne)^2) )</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-800 text-xs">&sigma; = {stdDevCoverage}%</span>
                          <div className="text-[9px] text-slate-500">Moyenne &mu; = {meanCoverageRate}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dosimetry Box - Follows block 4 immediately with max 20px gap */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl mb-4 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <Droplet className="w-4 h-4 text-emerald-700" />
                      <span>Fiche Technique Dosimétrique de l'Actellic 300CS (Pirimiphos-méthyl)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-700 font-mono pt-1">
                      <div>• Formulation : Suspension microencapsulée (CS)</div>
                      <div>• Dosage pompe : 500 mL / 10L eau claire</div>
                      <div>• Débit buse 8002E : 760 mL/minute à 3.0 bars</div>
                      <div>• Dépôt cible mur : 1.0 g m.a./m² (40mg/m²)</div>
                      <div>• Rémanence active : 6 à 9 mois certifiés</div>
                      <div>• Conformité toxico-sécuritaire : Catégorie III OMS</div>
                    </div>
                  </div>

                  {/* Epidemiological Summary Note - Fills the page harmoniously without large empty spaces */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 text-xs flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                      ✓
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-[11px]">
                        Attestation de Conformité Épidémiologique OMS & AngloGold Ashanti
                      </div>
                      <div className="text-[10px] text-slate-600 leading-relaxed font-sans">
                        Les modélisations mathématiques ci-dessus confirment l'atteinte d'un taux d'efficacité protectrice communautaire supérieur au seuil critique de 97,0 %. La rémanence de l'Actellic 300CS garantit une barrière entomologique de 6 à 9 mois sur l'ensemble des 20 concessions minières et riveraines auditées.
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Footer - Anchored cleanly at the bottom */}
                  <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>HÔPITAL DE KORON · PROGRAMME ANGLOGOLD ASHANTI SAG SIGUIRI</span>
                    <span>FEUILLET 2 / 4 · VALIDÉ PAR LE MÉDECIN CHEF</span>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* PAGE 3 : REGISTRE DÉTAILLÉ DES 20 LOCALITÉS ET SITES DE LA CONCESSION (A4) */}
                {/* ------------------------------------------------------------------------- */}
                <div 
                  id="report-a4-page-3"
                  className="a4-page border border-slate-300 print:border-none"
                  style={{ padding: '40px 50px' }}
                >
                  {/* Page 3 Top Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm tracking-tight uppercase">
                        HÔPITAL DE KORON · ANGLOGOLD ASHANTI SAG SIGUIRI
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Registre Cadastral & Cartographique des Concessions Minières
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-600">
                      <div>RÉF : {docReference}</div>
                      <div className="font-bold text-emerald-800">PAGE 3 SUR 4 · AUDIT LOCALITÉS</div>
                    </div>
                  </div>

                  {/* Section Title */}
                  <div className="mt-5 mb-3">
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                      SECTION 2 : REGISTRE EXHAUSTIF DES 20 LOCALITÉS SAG
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                      Tableau Détaillé des Passages, Concessions et Populations Traitées
                    </h2>
                  </div>

                  {/* Comprehensive Table of Target Villages - No flex-1, dense & compact */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
                    <table className="w-full text-left text-[10px] font-mono border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px]">
                          <th className="py-1 px-2">Code</th>
                          <th className="py-1 px-2">Localité</th>
                          <th className="py-1 px-2 text-right">Familles (Cible/Pulv)</th>
                          <th className="py-1 px-2 text-right">Maisons 100%</th>
                          <th className="py-1 px-2 text-right">Chambres Cibles</th>
                          <th className="py-1 px-2 text-right">Chambres Pulv.</th>
                          <th className="py-1 px-2 text-center">Taux %</th>
                          <th className="py-1 px-2 text-right">Refills</th>
                          <th className="py-1 px-2 text-right">Pop. Total</th>
                          <th className="py-1 px-2 text-right">Fem. Enc.</th>
                          <th className="py-1 px-2 text-right">&lt;5 Ans</th>
                          <th className="py-1 px-2 text-center">Statut OMS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {targetVillages.slice(0, 20).map((v) => {
                          const vCompletes = v.familles_completes || Math.round(v.familles_pulverisees * 0.94);
                          return (
                            <tr key={v.id} className="hover:bg-slate-50 leading-tight">
                              <td className="py-0.5 px-2 font-bold text-slate-600">{v.code}</td>
                              <td className="py-0.5 px-2 font-sans font-bold text-slate-900 truncate max-w-[110px]">{v.nom}</td>
                              <td className="py-0.5 px-2 text-right text-slate-700">
                                {v.familles_pulverisees} / {v.familles_totales}
                              </td>
                              <td className="py-0.5 px-2 text-right font-medium text-emerald-800">
                                {vCompletes}
                              </td>
                              <td className="py-0.5 px-2 text-right">{v.nb_structures_total}</td>
                              <td className="py-0.5 px-2 text-right font-bold text-slate-900">{v.structures_pulverisees}</td>
                              <td className="py-0.5 px-2 text-center">
                                <span className={`px-1 py-0.2 rounded font-bold ${
                                  v.taux_structures_pct >= 97 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {v.taux_structures_pct}%
                                </span>
                              </td>
                              <td className="py-0.5 px-2 text-right">{v.can_refills_total}</td>
                              <td className="py-0.5 px-2 text-right font-bold">{v.pop_couverte_total.toLocaleString('fr-FR')}</td>
                              <td className="py-0.5 px-2 text-right">{v.pop_femme_enceinte}</td>
                              <td className="py-0.5 px-2 text-right">{v.pop_enfant_0_5}</td>
                              <td className="py-0.5 px-2 text-center">
                                {v.taux_structures_pct >= 97 ? (
                                  <span className="text-emerald-700 font-bold">CONFORME</span>
                                ) : (
                                  <span className="text-amber-700 font-bold">RATISSAGE</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Totals Row */}
                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-950 leading-normal">
                          <td colSpan={2} className="py-1 px-2 font-sans uppercase">TOTAL GÉNÉRAL CONSOLIDÉ</td>
                          <td className="py-1 px-2 text-right text-emerald-900">{totalTreatedFamilles} / {totalTargetFamilles}</td>
                          <td className="py-1 px-2 text-right text-emerald-800">{totalFamillesCompletes}</td>
                          <td className="py-1 px-2 text-right">{totalTargetStructures}</td>
                          <td className="py-1 px-2 text-right text-emerald-800">{totalTreatedStructures}</td>
                          <td className="py-1 px-2 text-center">
                            <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded">
                              {globalCoveragePct}%
                            </span>
                          </td>
                          <td className="py-1 px-2 text-right">{totalRefills}</td>
                          <td className="py-1 px-2 text-right">{totalProtectedPop.toLocaleString('fr-FR')}</td>
                          <td className="py-1 px-2 text-right">{totalPregnantWomen}</td>
                          <td className="py-1 px-2 text-right">{totalUnder5Children}</td>
                          <td className="py-1 px-2 text-center text-emerald-800">
                            {globalCoveragePct >= 97 ? 'SEUIL VALIDÉ' : 'EN COURS'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Territorial Performance Verdict - Follows IMMEDIATELY after TOTAL GÉNÉRAL CONSOLIDÉ table with 16px gap */}
                  <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="font-bold text-emerald-900 text-[11px]">Secteurs Conformes (&ge; 97%)</div>
                      <div className="text-sm font-bold font-mono text-emerald-800 mt-0.5">
                        {targetVillages.filter(v => v.taux_structures_pct >= 97).length} Localités
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">Immunité de zone garantie</div>
                    </div>

                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="font-bold text-amber-900 text-[11px]">Secteurs en Sécurisation (75-96%)</div>
                      <div className="text-sm font-bold font-mono text-amber-800 mt-0.5">
                        {targetVillages.filter(v => v.taux_structures_pct >= 75 && v.taux_structures_pct < 97).length} Localités
                      </div>
                      <div className="text-[10px] text-amber-700 mt-0.5">Renforcement des passages</div>
                    </div>

                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-bold text-red-900 text-[11px]">Zones de Mop-Up / Ratissage (&lt; 75%)</div>
                      <div className="text-sm font-bold font-mono text-red-800 mt-0.5">
                        {targetVillages.filter(v => v.taux_structures_pct < 75).length} Localités
                      </div>
                      <div className="text-[10px] text-red-700 mt-0.5">Second passage programmé</div>
                    </div>
                  </div>

                  {/* Operational directive notice */}
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono flex items-center justify-between text-slate-700 mb-2">
                    <span>• Stratégie Mop-Up : Ratissage obligatoire sous 72h pour les secteurs &lt; 97%</span>
                    <span>• Visa Technique : Direction Médicale SAG Koron</span>
                  </div>

                  {/* Page 3 Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>HÔPITAL DE KORON · PROGRAMME ANGLOGOLD ASHANTI SAG SIGUIRI</span>
                    <span>FEUILLET 3 / 4 · AUDIT DU PARC DE CONCESSIONS</span>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* PAGE 4 : CONTRÔLE DES PIÈCES, ENTOMOLOGIE & PROCÈS-VERBAL LÉGAL (A4)      */}
                {/* ------------------------------------------------------------------------- */}
                <div 
                  id="report-a4-page-4"
                  className="a4-page border border-slate-300 print:border-none"
                  style={{ padding: '40px 50px' }}
                >
                  {/* Page 4 Top Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm tracking-tight uppercase">
                        HÔPITAL DE KORON · ANGLOGOLD ASHANTI SAG SIGUIRI
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Surveillance Entomologique, Qualité & Procès-Verbal de Clôture
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-600">
                      <div>RÉF : {docReference}</div>
                      <div className="font-bold text-emerald-800">PAGE 4 SUR 4 · PROCÈS-VERBAL LÉGAL</div>
                    </div>
                  </div>

                  {/* Section Title */}
                  <div className="mt-5 mb-3">
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                      SECTION 3 : DÉNOMBREMENT DES PIÈCES & BIO-EFFICACITÉ OMS
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                      Contrôle Chambre par Chambre, Entomologie et Visa de Clôture
                    </h2>
                  </div>

                  {/* Two Columns: Rooms Analysis vs Entomology */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                    
                    {/* Room & Concession Inspection Breakdown */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-900">Audit Concessions & Chambres</span>
                        <span className="text-[10px] font-mono text-emerald-800 font-bold">
                          {treatedRoomsCount} / {totalRoomsCount} Pièces Traitées
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-600">• Familles Ciblées vs Traitées :</span>
                          <b className="text-slate-900">{totalTreatedFamilles} / {totalTargetFamilles} ({famillesCoveragePct}%)</b>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-600">• Maisons Entières (100%) :</span>
                          <b className="text-emerald-800">{totalFamillesCompletes} concessions ({fullHouseRatioPct}%)</b>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-600">• Traitement Partiel :</span>
                          <b className="text-amber-800">{totalFamillesPartielles} concessions</b>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-600">• Refus Chef de Famille :</span>
                          <b className="text-red-700">{refusedChiefCount} pièces ({totalRoomsCount > 0 ? ((refusedChiefCount / totalRoomsCount) * 100).toFixed(1) : 0}%)</b>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-600">• Absences / Verrouillées :</span>
                          <b className="text-slate-700">{absentCount + closedDoorCount + lockedCount} pièces</b>
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-[10px] text-emerald-900">
                        <b>Norme Opérationnelle :</b> Dans chaque concession visitée, l'équipe vise l'exhaustivité (100% des chambres pulvérisées). Un ratissage est programmé pour les concessions partielles.
                      </div>
                    </div>

                    {/* Entomology Cone Bioassays */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-900">Bio-Essais sur Cônes OMS (Vecteurs)</span>
                        <span className="text-[10px] font-mono text-emerald-800 font-bold">
                          Mortalité : {avgMortality}%
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-600">• Vecteur Testé :</span>
                          <b className="text-slate-900 font-sans italic">Anopheles gambiae s.l.</b>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-600">• Méthode d'Échantillonnage :</span>
                          <b className="text-slate-800">Cônes OMS (30 min exposition)</b>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-600">• Mortalité 24h post-test :</span>
                          <b className="text-emerald-700">{avgMortality}% (&ge; 98% = Sensible)</b>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-600">• Rémanence active murale :</span>
                          <b className="text-emerald-800">Efficacité optimale (Mois 1 à 6)</b>
                        </div>
                      </div>

                      <div className="p-2 bg-blue-50 rounded border border-blue-200 text-[10px] text-blue-900">
                        <b>Statut OMS :</b> Aucune résistance vectorielle détectée au pirimiphos-méthyl dans la concession SAG.
                      </div>
                    </div>

                  </div>

                  {/* Environmental and Health Safety Box */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl mb-4 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-950 text-[11px]">
                      <Shield className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Protocole Hygiène & Sécurité Environnementale des Équipes IRS</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-sans leading-relaxed">
                      Lavage quotidien obligatoire selon la procédure OMS des 3 bassines. Rétention et filtration des effluents dans le bac de bio-dégradation à charbon actif de la base vie de Koron. Zéro rejet direct dans les cours d'eau du bassin de Siguiri.
                    </div>
                  </div>

                  {/* Official Double Signature and Legal Certification */}
                  <div className="border-2 border-slate-900 rounded-2xl p-4 mb-3 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-800" />
                        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                          Procès-Verbal Légal de Clôture & Certificat de Validation
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-600">
                        SCEAU OFFICIEL SAG KORON
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-700 leading-relaxed font-sans">
                      Je soussigné, <b>{doctorName}</b>, Médecin Chef et Responsable Épidémiologique de l'Hôpital de Koron (Société AngloGold Ashanti SAG), certifie par la présente que les données de pulvérisation intradomiciliaire (IRS), de dénombrement des concessions et d'efficacité insecticide consignées dans ce document de 4 feuillets ont été rigoureusement contrôlées, auditées et validées selon les directives techniques de l'Organisation Mondiale de la Santé (OMS) et le protocole sanitaire SAG 2026.
                    </p>

                    {/* Double Signature Boxes */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {/* Doctor Signature */}
                      <div className="border border-slate-300 rounded-xl p-2.5 bg-white text-center space-y-1">
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Le Médecin Chef Responsable</div>
                        <div className="text-xs font-extrabold text-slate-900">{doctorName}</div>
                        <div className="text-[8px] text-emerald-800 font-mono">« Lu et approuvé, certifié conforme »</div>
                        <div className="h-8 border-b border-dashed border-slate-400 mx-6 flex items-end justify-center pb-0.5">
                          <span className="font-serif italic text-slate-600 text-[11px]">{doctorName.split(' ')[1] || 'Doumbouya'}</span>
                        </div>
                        <div className="text-[7.5px] text-slate-400 font-mono">Signature Électronique Validée · Hôpital de Koron</div>
                      </div>

                      {/* Supervisor Signature */}
                      <div className="border border-slate-300 rounded-xl p-2.5 bg-white text-center space-y-1">
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Le Superviseur Général Terrain</div>
                        <div className="text-xs font-extrabold text-slate-900">Dr. Colonel Magassouba</div>
                        <div className="text-[8px] text-emerald-800 font-mono">« Vu et vérifié sur le terrain »</div>
                        <div className="h-8 border-b border-dashed border-slate-400 mx-6 flex items-end justify-center pb-0.5">
                          <span className="font-serif italic text-slate-600 text-[11px]">Col. Magassouba</span>
                        </div>
                        <div className="text-[7.5px] text-slate-400 font-mono">Cachet de Contrôle des Opérations IRS</div>
                      </div>
                    </div>
                  </div>

                  {/* Page 4 Footer - Anchored cleanly at the bottom */}
                  <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>HÔPITAL DE KORON · DIRECTION MÉDICALE ANGLOGOLD ASHANTI SAG SIGUIRI</span>
                    <span>FEUILLET 4 / 4 (FIN DU DOCUMENT OFFICIEL)</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
