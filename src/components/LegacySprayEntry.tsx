import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileSpreadsheet, Edit3, Eye, CheckCircle2, AlertTriangle, 
  HelpCircle, ChevronDown, ChevronUp, Download, Printer, 
  ArrowRight, ArrowLeft, RotateCcw, Save, Shield, ShieldCheck, Lock, 
  Info, Check, X, UserCheck, Calendar, MapPin, 
  Share2, Trash2, BedDouble, Droplets, Home, Clock, Plus, PlusCircle
} from 'lucide-react';
import { getHeatmapInfo } from '../utils/heatmap';
import { DailySprayRecord, Village, Famille, Chambre, MotifNonPulverisation, ChambreStatut } from '../types';
import * as XLSX from 'xlsx';

// Guinean Heads of Concessions for realistic default slots
const GUINEAN_HEADS_FALLBACK = [
  { nom: 'Elhadj Oumar Camara', concession: 'Concession Camarakounda' },
  { nom: 'Mamadouba Sylla', concession: 'Cour Familiale Sylla' },
  { nom: 'Kaba Kourouma', concession: 'Concession Kourouma & Frères' },
  { nom: 'Fatoumata Binta Barry', concession: 'Concession Barry & Fils' },
  { nom: 'Lamine Magassouba', concession: 'Grande Cour Magassouba' },
  { nom: 'Ibrahima Sory Kaba', concession: 'Concession Kaba Bila' },
  { nom: 'Sékouba Condé', concession: 'Concession Condékounda' },
  { nom: 'Ansoumane Diallo', concession: 'Concession Diallo & Associés' },
  { nom: 'Mariama Ciré Traoré', concession: 'Grande Concession Traoré' },
  { nom: 'Facely Keita', concession: 'Concession Keitakounda' },
  { nom: 'Mory Soumah', concession: 'Cour des Anciens Soumah' },
  { nom: 'Hadja Saran Cissé', concession: 'Concession Cissé & Famille' },
  { nom: 'Naby Youssouf Camara', concession: 'Concession Youssoufkounda' },
  { nom: 'Aminata Touré', concession: 'Cour Touré & Sœurs' },
  { nom: 'Fodé Bangoura', concession: 'Concession Bangourakounda' },
  { nom: 'Kadiatou Diallo', concession: 'Cour Familiale Diallo' },
  { nom: 'Aboubacar Sidiki Diakité', concession: 'Grande Cour Diakité' },
  { nom: 'Ousmane Fofana', concession: 'Concession Fofanakounda' },
  { nom: 'Bountouraby Soumah', concession: 'Concession Soumahkounda' },
  { nom: 'Mohamed Lamine Mara', concession: 'Concession Marakounda' },
  { nom: 'Salematou Baldé', concession: 'Cour Baldé & Frères' },
  { nom: 'Bakary Dansoko', concession: 'Concession Dansokokounda' },
  { nom: 'Aissatou Cherif', concession: 'Grande Cour Chérif' },
  { nom: 'Morlaye Cissé', concession: 'Concession Cissékounda' },
  { nom: 'Doussou Kouyaté', concession: 'Cour des Griots Kouyaté' },
  { nom: 'Djiba Camara', concession: 'Concession Djibakounda' },
  { nom: 'Mamady Kallo', concession: 'Cour Kallo & Fils' },
  { nom: 'Tiguidanké Keita', concession: 'Concession Tiguidanké' },
  { nom: 'Alseny Sylla', concession: 'Concession Syllakounda Sud' },
  { nom: 'Balla Moussa Condé', concession: 'Grande Cour Condékounda Est' }
];

export interface ConcessionSlot {
  numero: number; // 1 to 30
  code: string; // F-1 to F-30
  familleId: number | null; // Database ID if exists
  chef_famille: string;
  nom_concession: string;
  nb_chambres_total: number;
  chambres_pulverisees: number;
  visitee: boolean;
  recharges_actellic: number;
  statut: 'Entière' | 'Partielle' | 'Refusée' | 'Absente' | 'Non visitée';
  observation?: string;
  chambresDetails: {
    numero: number;
    statut: ChambreStatut;
    motif: MotifNonPulverisation;
    detail?: string;
  }[];
  passages?: {
    date: string;
    resultat: string;
    agent: string;
  }[];
  population?: {
    homme: number;
    femme: number;
    femme_enceinte: number;
    enfant_0_5: number;
    total: number;
  };
}

export const LegacySprayEntry: React.FC = () => {
  const { 
    villages, 
    currentUser, 
    dailySprays,
    familles,
    chambres,
    addDailySpray,
    addFamille,
    addVillage,
    recordFamilyPassage,
    deleteDailySpray,
    setActiveTab,
    setSelectedVillageId,
    allowAgentsEditLines
  } = useApp();

  // Admin New Village Modal state
  const [showNewVillageModal, setShowNewVillageModal] = useState<boolean>(false);
  const [newVillageNom, setNewVillageNom] = useState<string>('');
  const [newVillageCode, setNewVillageCode] = useState<string>('');
  const [newVillageType, setNewVillageType] = useState<'village' | 'SAG' | 'Autre'>('village');
  const [newVillageStructures, setNewVillageStructures] = useState<number>(300);
  const [newVillageStands, setNewVillageStands] = useState<number>(85);
  const [isCreatingVillage, setIsCreatingVillage] = useState<boolean>(false);

  // 1. RBAC Guard: Observateur MUST NOT have ANY access to this page
  if (currentUser.role === 'observateur') {
    return (
      <div className="w-full bg-white p-8 sm:p-12 rounded-2xl border border-red-200 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Accès Restreint — Espace Saisie IRS</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          En tant qu'observateur, vous disposez uniquement d'un droit de consultation du Tableau de bord. Les opérations de saisie de la grille IRS sont réservées à l'équipe opérationnelle.
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          Retourner au Tableau de bord
        </button>
      </div>
    );
  }

  // 2. All authorized users (Admin, Superviseur, Field Agent) can see all registered villages
  const availableVillages = useMemo(() => {
    return villages;
  }, [villages]);

  const [selectedVillageIdLocal, setSelectedVillageIdLocal] = useState<number>(() => {
    return (currentUser.role === 'agent' && currentUser.village_assigne_id)
      ? currentUser.village_assigne_id
      : (availableVillages[0]?.id || villages[0]?.id || 1);
  });

  const selectedVillage = useMemo(() => {
    return villages.find(v => v.id === selectedVillageIdLocal) || availableVillages[0] || villages[0];
  }, [villages, availableVillages, selectedVillageIdLocal]);

  // Main UI Tabs
  const [activeTabSub, setActiveTabSub] = useState<'grille' | 'saisie_rapide' | 'detail' | 'historique'>('grille');

  // Permanent definitions banner state
  const [showDefinitions, setShowDefinitions] = useState<boolean>(true);

  // Saisie Rapide Wizard Steps: 1 = Selection, 2 = Famille par famille, 3 = Validation de journée
  const [saisieStep, setSaisieStep] = useState<1 | 2 | 3>(1);
  const [currentFamilyIndex, setCurrentFamilyIndex] = useState<number>(0);

  // Dynamic target concession count (flexible: < 30 or > 40 families depending on day)
  const [targetSlotCount, setTargetSlotCount] = useState<number>(40);

  // Tour selection state (Étape 1)
  const [tourDate, setTourDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [tourInsecticide, setTourInsecticide] = useState<string>('Actellic 300cs (Pirimiphos-méthyl)');
  const [tourCampagne, setTourCampagne] = useState<string>('IRS 2026');
  const [tourNumJour, setTourNumJour] = useState<number>(1);

  // Detail Tab Selected Family Slot
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number>(1);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Dynamic Concession Slots State (synchronised with database and local edits)
  const [concessionSlots, setConcessionSlots] = useState<ConcessionSlot[]>([]);

  // Build dynamic concession slots from database whenever village, familles, or targetSlotCount change
  useEffect(() => {
    const vFamilles = familles.filter(f => f.village_id === selectedVillage.id);
    const slots: ConcessionSlot[] = [];
    const totalCount = Math.max(targetSlotCount, vFamilles.length, 1);

    for (let i = 0; i < totalCount; i++) {
      const num = i + 1;
      const code = `F-${num}`;
      const existingFam = vFamilles[i];

      if (existingFam) {
        const famRooms = chambres.filter(c => c.famille_id === existingFam.id);
        const totRooms = existingFam.nb_chambres_total || famRooms.length || 6;
        const pulvRooms = existingFam.chambres_pulverisees;

        let slotStatut: ConcessionSlot['statut'] = 'Non visitée';
        if (existingFam.statut_famille === 'Pulvérisée complètement' || pulvRooms === totRooms) {
          slotStatut = 'Entière';
        } else if (pulvRooms > 0) {
          slotStatut = 'Partielle';
        } else if (existingFam.statut_famille === 'Refusée') {
          slotStatut = 'Refusée';
        } else if (existingFam.statut_famille === 'Absente') {
          slotStatut = 'Absente';
        } else if (existingFam.statut_famille === 'Non visitée') {
          slotStatut = 'Non visitée';
        } else {
          slotStatut = pulvRooms > 0 ? 'Partielle' : 'Refusée';
        }

        const roomDetails = famRooms.map(r => ({
          numero: r.numero_chambre,
          statut: r.statut,
          motif: r.motif_non_pulverisation || (r.statut === 'pulvérisée' ? 'aucun' : 'porte_fermee'),
          detail: r.motif_detail || ''
        }));

        // Fallback room items if none generated
        if (roomDetails.length === 0) {
          for (let r = 1; r <= totRooms; r++) {
            const isPulv = r <= pulvRooms;
            roomDetails.push({
              numero: r,
              statut: isPulv ? 'pulvérisée' : (slotStatut === 'Refusée' ? 'refusée' : 'non_pulvérisée'),
              motif: isPulv ? 'aucun' : (slotStatut === 'Refusée' ? 'refus_chef' : 'porte_fermee'),
              detail: isPulv ? '' : 'Absence de clé au passage'
            });
          }
        }

        slots.push({
          numero: num,
          code,
          familleId: existingFam.id,
          chef_famille: existingFam.chef_famille,
          nom_concession: existingFam.nom_concession || `Concession ${existingFam.chef_famille}`,
          nb_chambres_total: totRooms,
          chambres_pulverisees: pulvRooms,
          visitee: slotStatut !== 'Non visitée',
          recharges_actellic: pulvRooms > 0 ? Math.max(1, Math.round(pulvRooms / 6)) : 0,
          statut: slotStatut,
          chambresDetails: roomDetails,
          passages: [
            { date: existingFam.date_dernier_passage || tourDate, resultat: `${pulvRooms}/${totRooms} traitées`, agent: currentUser.nom }
          ],
          population: existingFam.population_famille || {
            homme: 2, femme: 2, femme_enceinte: (i % 4 === 0 ? 1 : 0), enfant_0_5: 2, total: 6 + (i % 4 === 0 ? 1 : 0)
          }
        });
      } else {
        // Provisional slot to ensure columns F-1 à F-N are available
        const fallbackHead = GUINEAN_HEADS_FALLBACK[i % GUINEAN_HEADS_FALLBACK.length];
        const totRooms = 5 + (i % 3);
        const roomDetails = [];
        for (let r = 1; r <= totRooms; r++) {
          roomDetails.push({
            numero: r,
            statut: 'non_pulvérisée' as ChambreStatut,
            motif: 'porte_fermee' as MotifNonPulverisation,
            detail: 'Concession en attente de visite'
          });
        }

        slots.push({
          numero: num,
          code,
          familleId: null,
          chef_famille: fallbackHead.nom,
          nom_concession: `${fallbackHead.concession} (${selectedVillage.nom})`,
          nb_chambres_total: totRooms,
          chambres_pulverisees: 0,
          visitee: false,
          recharges_actellic: 0,
          statut: 'Non visitée',
          chambresDetails: roomDetails,
          passages: [],
          population: {
            homme: 2, femme: 2, femme_enceinte: (i % 5 === 0 ? 1 : 0), enfant_0_5: 1 + (i % 3), total: 5 + (i % 3)
          }
        });
      }
    }

    setConcessionSlots(slots);
  }, [familles, chambres, selectedVillage.id, selectedVillage.nom, currentUser.nom, tourDate, targetSlotCount]);

  // Concession management handlers
  const handleAddConcessionSlot = () => {
    setTargetSlotCount(prev => Math.max(prev, concessionSlots.length) + 1);
    const nextNum = concessionSlots.length + 1;
    showToast(`Nouvelle concession F-${nextNum} ajoutée à la tournée !`, 'success');
  };

  const handleSetTargetCount = (count: number) => {
    const clean = Math.max(1, Math.min(100, count));
    setTargetSlotCount(clean);
    showToast(`Nombre de concessions configuré à ${clean}.`, 'info');
  };

  const handleTrimToVisited = () => {
    const visitedCount = concessionSlots.filter(s => s.visitee).length;
    if (visitedCount === 0) {
      showToast("Aucune concession n'a encore été marquée comme visitée.", 'info');
      return;
    }
    setTargetSlotCount(visitedCount);
    showToast(`Grille ajustée aux ${visitedCount} concessions visitées.`, 'success');
  };

  // Village creation handler for Admin in LegacySprayEntry
  const handleCreateVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      showToast("Seul l'Administrateur en chef est habilité à créer de nouvelles localités.", 'error');
      return;
    }
    if (!newVillageNom.trim()) {
      showToast("Veuillez renseigner le nom du village.", 'error');
      return;
    }

    setIsCreatingVillage(true);
    setTimeout(() => {
      try {
        const { village } = addVillage({
          nom: newVillageNom.trim(),
          code: newVillageCode.trim() || newVillageNom.trim().substring(0, 4).toUpperCase(),
          type: newVillageType,
          nb_structures_total: Number(newVillageStructures) || 300,
          nb_stands_total: Number(newVillageStands) || Math.round((Number(newVillageStructures) || 300) / 3.5),
          latitude: 11.4325,
          longitude: -9.1824
        });

        setIsCreatingVillage(false);
        setShowNewVillageModal(false);
        setNewVillageNom('');
        setNewVillageCode('');

        setSelectedVillageIdLocal(village.id);
        setSelectedVillageId(village.id);

        showToast(`Village "${village.nom}" (${village.code}) créé avec succès et enregistré dans tout le système ! Visible par les Superviseurs et Agents.`, 'success');
      } catch (err: any) {
        setIsCreatingVillage(false);
        showToast("Erreur lors de la création du village : " + (err.message || 'Échec'), 'error');
      }
    }, 300);
  };

  // Overall statistics of the 30 columns in real time
  const statsGrille = useMemo(() => {
    const totalConcessions = concessionSlots.length || 30;
    const visitees = concessionSlots.filter(s => s.visitee).length;
    const chambresTotales = concessionSlots.reduce((acc, s) => acc + s.nb_chambres_total, 0);
    const chambresPulverisees = concessionSlots.reduce((acc, s) => acc + s.chambres_pulverisees, 0);
    const rechargesTotales = concessionSlots.reduce((acc, s) => acc + s.recharges_actellic, 0);
    const tauxCouverture = chambresTotales > 0 ? Number(((chambresPulverisees / chambresTotales) * 100).toFixed(1)) : 0;
    
    // Status counts
    const countEntieres = concessionSlots.filter(s => s.statut === 'Entière').length;
    const countPartielles = concessionSlots.filter(s => s.statut === 'Partielle').length;
    const countRefusees = concessionSlots.filter(s => s.statut === 'Refusée' || s.statut === 'Absente').length;
    const countNonVisitees = concessionSlots.filter(s => s.statut === 'Non visitée').length;

    // Population
    const popH = concessionSlots.reduce((acc, s) => acc + (s.visitee ? (s.population?.homme || 0) : 0), 0);
    const popF = concessionSlots.reduce((acc, s) => acc + (s.visitee ? (s.population?.femme || 0) : 0), 0);
    const popFE = concessionSlots.reduce((acc, s) => acc + (s.visitee ? (s.population?.femme_enceinte || 0) : 0), 0);
    const popEnf = concessionSlots.reduce((acc, s) => acc + (s.visitee ? (s.population?.enfant_0_5 || 0) : 0), 0);
    const popTot = popH + popF + popFE + popEnf;

    return {
      totalConcessions,
      visitees,
      chambresTotales,
      chambresPulverisees,
      rechargesTotales,
      tauxCouverture,
      countEntieres,
      countPartielles,
      countRefusees,
      countNonVisitees,
      popH, popF, popFE, popEnf, popTot
    };
  }, [concessionSlots]);

  // Saisie Rapide Current Form State (Étape 2)
  const currentSlot = concessionSlots[currentFamilyIndex] || concessionSlots[0];
  const [formChef, setFormChef] = useState<string>('');
  const [formTotChambres, setFormTotChambres] = useState<number>(6);
  const [formVisitee, setFormVisitee] = useState<boolean>(true);
  const [formPulvChambres, setFormPulvChambres] = useState<number>(6);
  const [formRecharges, setFormRecharges] = useState<number>(1);
  const [formObservation, setFormObservation] = useState<string>('');
  const [formMotifs, setFormMotifs] = useState<{ [chambreNum: number]: MotifNonPulverisation }>({});
  const [formMotifAutreDetail, setFormMotifAutreDetail] = useState<{ [chambreNum: number]: string }>({});

  // Sync form when moving between families in Saisie Rapide
  useEffect(() => {
    if (currentSlot) {
      setFormChef(currentSlot.chef_famille);
      setFormTotChambres(currentSlot.nb_chambres_total);
      setFormVisitee(currentSlot.visitee);
      setFormPulvChambres(currentSlot.chambres_pulverisees);
      setFormRecharges(currentSlot.recharges_actellic || (currentSlot.chambres_pulverisees > 0 ? 1 : 0));
      setFormObservation(currentSlot.observation || '');

      const initialMotifs: { [chambreNum: number]: MotifNonPulverisation } = {};
      const initialDetails: { [chambreNum: number]: string } = {};

      currentSlot.chambresDetails.forEach(cd => {
        if (cd.statut !== 'pulvérisée') {
          initialMotifs[cd.numero] = cd.motif || 'porte_fermee';
          if (cd.detail) initialDetails[cd.numero] = cd.detail;
        }
      });
      setFormMotifs(initialMotifs);
      setFormMotifAutreDetail(initialDetails);
    }
  }, [currentFamilyIndex, currentSlot]);

  // Summary validation inputs (Étape 3)
  const [valPopHomme, setValPopHomme] = useState<number>(0);
  const [valPopFemme, setValPopFemme] = useState<number>(0);
  const [valPopEnceinte, setValPopEnceinte] = useState<number>(0);
  const [valPopEnfant, setValPopEnfant] = useState<number>(0);

  useEffect(() => {
    if (saisieStep === 3) {
      setValPopHomme(statsGrille.popH || 65);
      setValPopFemme(statsGrille.popF || 72);
      setValPopEnceinte(statsGrille.popFE || 12);
      setValPopEnfant(statsGrille.popEnf || 54);
    }
  }, [saisieStep, statsGrille]);

  // Save current family in Saisie Rapide and proceed
  const handleSaveCurrentFamily = (andNext: boolean = true) => {
    const updatedSlotList = [...concessionSlots];
    const target = updatedSlotList[currentFamilyIndex];
    if (!target) return;

    let computedStatut: ConcessionSlot['statut'] = 'Non visitée';
    if (!formVisitee) {
      computedStatut = 'Non visitée';
    } else if (formPulvChambres >= formTotChambres && formTotChambres > 0) {
      computedStatut = 'Entière';
    } else if (formPulvChambres > 0) {
      computedStatut = 'Partielle';
    } else {
      const hasRefus = Object.values(formMotifs).some(m => m === 'refus_chef');
      computedStatut = hasRefus ? 'Refusée' : 'Absente';
    }

    const newChambreDetails = [];
    for (let r = 1; r <= formTotChambres; r++) {
      const isPulv = r <= formPulvChambres;
      newChambreDetails.push({
        numero: r,
        statut: (isPulv ? 'pulvérisée' : (computedStatut === 'Refusée' ? 'refusée' : 'non_pulvérisée')) as ChambreStatut,
        motif: (isPulv ? 'aucun' : (formMotifs[r] || 'porte_fermee')) as MotifNonPulverisation,
        detail: formMotifAutreDetail[r] || ''
      });
    }

    const updatedSlot: ConcessionSlot = {
      ...target,
      chef_famille: formChef,
      nb_chambres_total: formTotChambres,
      visitee: formVisitee,
      chambres_pulverisees: formVisitee ? formPulvChambres : 0,
      recharges_actellic: formVisitee ? formRecharges : 0,
      statut: computedStatut,
      observation: formObservation,
      chambresDetails: newChambreDetails,
      population: {
        homme: 2, femme: 2, femme_enceinte: (currentFamilyIndex % 4 === 0 ? 1 : 0), enfant_0_5: 2, total: 6 + (currentFamilyIndex % 4 === 0 ? 1 : 0)
      }
    };

    updatedSlotList[currentFamilyIndex] = updatedSlot;
    setConcessionSlots(updatedSlotList);

    // If this family exists in database or needs creation in AppContext
    if (target.familleId) {
      recordFamilyPassage(
        target.familleId,
        newChambreDetails.map(cd => ({
          id: target.familleId! * 10 + cd.numero,
          statut: cd.statut,
          motif: cd.motif,
          detail: cd.detail
        })),
        formObservation
      );
    } else if (formVisitee) {
      // Create new registered family in context
      const created = addFamille({
        village_id: selectedVillage.id,
        chef_famille: formChef,
        nom_concession: target.nom_concession,
        nb_chambres: formTotChambres,
        chambres_details: newChambreDetails.map(cd => ({
          type: `Chambre ${cd.numero}`,
          statut: cd.statut,
          motif: cd.motif,
          detail: cd.detail
        }))
      });
      updatedSlot.familleId = created.id;
      updatedSlotList[currentFamilyIndex] = updatedSlot;
      setConcessionSlots([...updatedSlotList]);
    }

    showToast(`Concession F-${currentFamilyIndex + 1} (${formChef}) enregistrée`, 'success');

    if (andNext) {
      if (currentFamilyIndex < concessionSlots.length - 1) {
        setCurrentFamilyIndex(prev => prev + 1);
      } else {
        // Last family reached: move to validation step
        setSaisieStep(3);
      }
    }
  };

  // Keyboard Shortcuts for Saisie Rapide
  useEffect(() => {
    if (activeTabSub !== 'saisie_rapide' || saisieStep !== 2) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input or textarea
      const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
      
      // Ctrl+S: Save current without moving
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveCurrentFamily(false);
        return;
      }

      // Escape: Cancel and return to Grid
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveTabSub('grille');
        return;
      }

      // Enter in an input field (except textarea): Validate and go next
      if (e.key === 'Enter' && targetTag !== 'textarea') {
        e.preventDefault();
        handleSaveCurrentFamily(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabSub, saisieStep, currentFamilyIndex, formChef, formTotChambres, formVisitee, formPulvChambres, formRecharges, formObservation, formMotifs, formMotifAutreDetail]);

  // Final Validation of Tour Day (Étape 3)
  const handleValidateDay = () => {
    // Generate arrays of 30 columns for daily spray record
    const standsArray = concessionSlots.map(s => s.visitee ? 1 : 0);
    const structuresArray = concessionSlots.map(s => s.chambres_pulverisees);
    const refillsArray = concessionSlots.map(s => s.recharges_actellic);

    const totalPopJour = valPopHomme + valPopFemme + valPopEnceinte + valPopEnfant;

    addDailySpray({
      villageId: selectedVillage.id,
      date: tourDate,
      numJour: tourNumJour,
      insecticide: tourInsecticide,
      stands: standsArray,
      structures: structuresArray,
      canRefills: refillsArray,
      population: {
        homme: valPopHomme,
        femme: valPopFemme,
        femme_enceinte: valPopEnceinte,
        enfant_0_5: valPopEnfant
      },
      observation: `Tournée J-${tourNumJour} IRS clôturée par ${currentUser.nom}. ${statsGrille.visitees}/30 concessions visitées. Taux: ${statsGrille.tauxCouverture}% (${statsGrille.chambresPulverisees}/${statsGrille.chambresTotales} pièces).`
    });

    showToast(`Journée IRS validée avec succès ! Taux de couverture : ${statsGrille.tauxCouverture}%`, 'success');
    
    // Switch to Grid view
    setActiveTabSub('grille');
    setSaisieStep(1);
  };

  // Open Family Detail
  const handleOpenDetail = (slotNum: number) => {
    setSelectedSlotNumber(slotNum);
    setActiveTabSub('detail');
  };

  // Switch from Detail to Saisie Rapide
  const handleEditFamilyFromDetail = (slotNum: number) => {
    setCurrentFamilyIndex(slotNum - 1);
    setSaisieStep(2);
    setActiveTabSub('saisie_rapide');
  };

  // Export Grille to Excel (.xlsx)
  const handleExportGrilleExcel = () => {
    const headers = ['LIGNE', 'INDICATEUR IRS', ...concessionSlots.map(s => `F-${s.numero}`), 'TOTAL GÉNÉRAL'];
    
    const row1 = ['L-1', ' FAMILLE VISITÉE (1=OUI, 0=NON)', ...concessionSlots.map(s => s.visitee ? 1 : 0), statsGrille.visitees];
    const row2 = ['L-2', ' CHAMBRES PULVÉRISÉES', ...concessionSlots.map(s => s.chambres_pulverisees), statsGrille.chambresPulverisees];
    const row3 = ['L-3', ' CHAMBRES TOTALES (RECENSEMENT)', ...concessionSlots.map(s => s.nb_chambres_total), statsGrille.chambresTotales];
    const row4 = ['L-4', ' RECHARGES ACTELLIC 300CS', ...concessionSlots.map(s => s.recharges_actellic), statsGrille.rechargesTotales];
    const row5 = ['L-5', ' STATUT AUTO DE LA CONCESSION', ...concessionSlots.map(s => s.statut), `${statsGrille.tauxCouverture}% (${statsGrille.countEntieres} Entières)`];
    const row6 = ['L-6', 'CHEF DE CONCESSION', ...concessionSlots.map(s => s.chef_famille), '30 CONCESSIONS'];

    const aoa = [
      [`SAG SIGUIRI — CLASSEUR IRS NOTE BOOK 2026 (GRILLE EXCEL 1 À 30)`],
      [`Village : ${selectedVillage.nom} | Date : ${tourDate} | Opérateur : ${currentUser.nom}`],
      [],
      headers,
      row1,
      row2,
      row3,
      row4,
      row5,
      row6
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grille_1_30_IRS');
    XLSX.writeFile(wb, `MALARIA_NOTEBOOK_GRILLE_30_${selectedVillage.code}_${tourDate}.xlsx`);
    showToast('Grille Excel exportée avec succès !', 'success');
  };

  // Detail slot selected
  const detailSlot = concessionSlots.find(s => s.numero === selectedSlotNumber) || concessionSlots[0];

  return (
    <div className="w-full space-y-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 ${
          toastMessage.type === 'success' ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-200' :
          toastMessage.type === 'error' ? 'bg-rose-950 border border-rose-500/50 text-rose-200' :
          'bg-slate-900 border border-slate-700 text-slate-200'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header bar with Role Identification & Village Selector */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Grille Excel 1 → 30
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-700">
              Classeur MALARIA NOTE BOOK 2026
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Saisie & Contrôle des Concessions IRS (F-1 à F-{concessionSlots.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interface simplifiée pour agents de terrain, superviseurs et administrateurs. F-1 à F-{concessionSlots.length} = Concessions recensées (capacité ajustable selon les jours).
          </p>
        </div>

        {/* Village Selection & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Village Actif</div>
              <select
                value={selectedVillage.id}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedVillageIdLocal(id);
                  setSelectedVillageId(id);
                }}
                className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer pr-2"
              >
                {availableVillages.map(v => (
                  <option key={v.id} value={v.id}>{v.nom} ({v.code})</option>
                ))}
              </select>
            </div>
            {currentUser.role === 'agent' && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 font-semibold rounded">
                {currentUser.village_assigne_id === selectedVillage.id ? 'Assigné' : 'Consulté'}
              </span>
            )}
          </div>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowNewVillageModal(true)}
              className="px-3 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
              title="Créer une nouvelle localité dans tout le système SAG Koron"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Nouveau Village (Admin)</span>
            </button>
          )}

          {/* Export Grille Button */}
          <button
            onClick={handleExportGrilleExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
            title={`Exporter la grille des ${concessionSlots.length} colonnes en Excel .xlsx`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel 1→{concessionSlots.length}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. BANDEAU DE DÉFINITIONS PERMANENT (REPLIABLE EN UN CLIC)    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full bg-linear-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all">
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-emerald-100 bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <span className="text-sm"></span>
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Définitions Métier IRS — Classeur MALARIA NOTE BOOK 2026
            </span>
          </div>
          <button
            onClick={() => setShowDefinitions(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>{showDefinitions ? "Masquer les définitions" : "Afficher les définitions"}</span>
            {showDefinitions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showDefinitions && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs text-slate-700 animate-in fade-in duration-200">
            <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>Concession / Famille</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <b>Unité IRS</b> principale. Chaque famille recensée correspond exactement à <b>1 colonne F-x</b> (F-1 à F-30).
              </p>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chambre</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <b>Pièce à pulvériser</b>. Unité de mesure IRS officielle pour le calcul du taux au seuil cible de <b>97%</b>.
              </p>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="text-xs">🏛️</span>
                <span>Structure</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <b>Bâtiment de la concession</b> pouvant regrouper plusieurs pièces ou chambres d'habitation.
              </p>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="text-xs">🏷️</span>
                <span>Stand</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <b>Synonyme historique</b> de concession dans l'ancien classeur Excel (1 stand = 1 concession visitée).
              </p>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                <span>Can Refill</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <b>Recharge d'insecticide</b> Actellic 300cs (bidon/cuve) consommée lors de la tournée par l'opérateur.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. NAVIGATION ENTRE LES 3 ONGLETS INTERNES                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTabSub('grille')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTabSub === 'grille'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span> VUE GRILLE (1→30)</span>
          </button>

          <button
            onClick={() => setActiveTabSub('saisie_rapide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTabSub === 'saisie_rapide'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4 text-emerald-300" />
            <span> SAISIE RAPIDE</span>
          </button>

          <button
            onClick={() => setActiveTabSub('detail')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTabSub === 'detail'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span> DÉTAIL FAMILLE (F-{selectedSlotNumber})</span>
          </button>

          <button
            onClick={() => setActiveTabSub('historique')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTabSub === 'historique'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span> Historique ({dailySprays.length})</span>
          </button>
        </div>

        {/* Real-time Counter Badge */}
        <div className="hidden lg:flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">Avancement F-1 à F-{concessionSlots.length} :</span>
          <span className="font-bold text-slate-900">
            {statsGrille.visitees} / {concessionSlots.length} visitées
          </span>
          <span className="text-slate-300">·</span>
          <span className="font-mono font-bold text-emerald-700">
            {statsGrille.chambresPulverisees} / {statsGrille.chambresTotales} pièces
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
            statsGrille.tauxCouverture >= 97 ? 'bg-emerald-100 text-emerald-800' :
            statsGrille.tauxCouverture >= 75 ? 'bg-amber-100 text-amber-800' :
            'bg-rose-100 text-rose-800'
          }`}>
            {statsGrille.tauxCouverture}%
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🔹 ONGLET 1 — VUE GRILLE (LECTURE SEULE + CLIC POUR ÉDITER)    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTabSub === 'grille' && (
        <div className="space-y-4">
          {/* Help box for the grid */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Reproduction Fidèle du Classeur MALARIA NOTE BOOK 2026 (Lecture Seule)
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  Chaque colonne = 1 famille/concession recensée (F-1 à F-{concessionSlots.length}). Cliquez sur une colonne ou sur <b>"Ouvrir"</b> pour consulter ou modifier la fiche détaillée de la famille.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSaisieStep(2);
                setActiveTabSub('saisie_rapide');
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Démarrer la Saisie Rapide →</span>
            </button>
          </div>

          {/* Dynamic Concessions F-x Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span></span>
                <span>Nombre de Concessions F-x pour cette tournée :</span>
              </span>
              <div className="flex items-center gap-1">
                {[15, 20, 25, 30, 35, 40, 45, 50, 60, 75].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleSetTargetCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      concessionSlots.length === cnt
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSetTargetCount(Math.max(1, concessionSlots.length - 1))}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  title="Retirer une concession"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={150}
                  value={concessionSlots.length}
                  onChange={(e) => handleSetTargetCount(Number(e.target.value))}
                  className="w-14 text-center py-1 font-mono font-bold border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddConcessionSlot}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  title="Ajouter une concession F-x"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddConcessionSlot}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ajouter Concession F-{concessionSlots.length + 1}</span>
              </button>

              <button
                type="button"
                onClick={handleTrimToVisited}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                title="Ajuster la grille exactement au nombre de concessions visitées"
              >
                <span>Ajuster aux {statsGrille.visitees} visitées</span>
              </button>
            </div>
          </div>

          {/* Live Real-time Counter Banner above the grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Concessions Visitées</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {statsGrille.visitees} <span className="text-xs font-normal text-slate-400">/ {concessionSlots.length}</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Chambres Traitées</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {statsGrille.chambresPulverisees} <span className="text-xs font-normal text-slate-400">/ {statsGrille.chambresTotales}</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Taux de Couverture</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-slate-900">{statsGrille.tauxCouverture}%</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  statsGrille.tauxCouverture >= 97 ? 'bg-emerald-100 text-emerald-800' :
                  statsGrille.tauxCouverture >= 75 ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {statsGrille.tauxCouverture >= 97 ? 'Objectif 97% ✔' : 'En cours'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Recharges Actellic</div>
              <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                {statsGrille.rechargesTotales} <span className="text-xs font-normal text-slate-400">bidons</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Statuts Décomposés</div>
              <div className="text-xs font-mono font-semibold text-slate-700 mt-1.5 flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">{statsGrille.countEntieres} 🟢</span>
                <span className="text-amber-600 font-bold">{statsGrille.countPartielles} 🟡</span>
                <span className="text-rose-600 font-bold">{statsGrille.countRefusees} 🔴</span>
                <span className="text-slate-400">{statsGrille.countNonVisitees} ⚪</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Fiche / Tournée</div>
              <div className="text-xs font-bold text-slate-800 truncate">
                Jour {tourNumJour} · {tourDate}
              </div>
              <div className="text-[10px] text-slate-400">
                Agent: {currentUser.nom}
              </div>
            </div>
          </div>

          {/* Official 30-Column Spreadsheet Grid Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Grille F-1 à F-30 :</span>
                <span className="text-slate-500">Cliquez sur une colonne ou sur "Ouvrir" pour afficher la fiche.</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 100% Traitée
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Partielle
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Refusée/Absente
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Non visitée
                </span>
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[1600px]">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    {/* Fixed Header Label */}
                    <th className="py-3 px-3 w-56 sticky left-0 z-20 bg-slate-900 border-r border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      Concessions (F-1 à F-{concessionSlots.length})
                    </th>
                    {/* Columns F-1 to F-N */}
                    {concessionSlots.map((slot) => (
                      <th
                        key={slot.numero}
                        onClick={() => handleOpenDetail(slot.numero)}
                        className="py-2 px-2 text-center border-r border-slate-800 w-24 hover:bg-slate-800 cursor-pointer transition-colors"
                        title={`Cliquez pour ouvrir la fiche de la concession F-${slot.numero} (${slot.chef_famille})`}
                      >
                        <div className="font-mono font-bold text-emerald-400 text-xs">
                          {slot.code}
                        </div>
                        <div className="text-[10px] text-slate-300 truncate max-w-21.25 font-normal mx-auto" title={slot.chef_famille}>
                          {slot.chef_famille.split(' ')[0]}
                        </div>
                      </th>
                    ))}
                    {/* Column Button: Add Concession */}
                    <th className="py-2 px-2 text-center bg-slate-800 border-r border-slate-700 w-24">
                      <button
                        type="button"
                        onClick={handleAddConcessionSlot}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
                        title="Ajouter une concession supplémentaire à la tournée"
                      >
                        + F-{concessionSlots.length + 1}
                      </button>
                    </th>
                    {/* Total Summary Column */}
                    <th className="py-3 px-3 w-28 bg-emerald-950 text-emerald-300 text-center font-bold font-mono">
                      TOTAL
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-mono">
                  {/* LIGNE 1: FAMILLE VISITÉE */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-white border-r border-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span> </span>
                        <span>FAMILLE VISITÉE</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">1 / 0</span>
                    </td>
                    {concessionSlots.map((slot) => (
                      <td
                        key={slot.numero}
                        onClick={() => handleOpenDetail(slot.numero)}
                        className={`py-2 px-2 text-center border-r border-slate-100 cursor-pointer ${
                          slot.visitee ? 'bg-emerald-50/40 text-emerald-900 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {slot.visitee ? '1' : '0'}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center border-r border-slate-100 text-slate-300">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-l border-emerald-200">
                      {statsGrille.visitees} / {concessionSlots.length}
                    </td>
                  </tr>

                  {/* LIGNE 2: CHAMBRES PULVÉRISÉES */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-slate-50 border-r border-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span> </span>
                        <span>CHAMBRES PULVÉRISÉES</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">IRS</span>
                    </td>
                    {concessionSlots.map((slot) => (
                      <td
                        key={slot.numero}
                        onClick={() => handleOpenDetail(slot.numero)}
                        className={`py-2 px-2 text-center border-r border-slate-100 cursor-pointer ${
                          slot.chambres_pulverisees > 0 ? 'text-emerald-800 font-bold bg-emerald-50/60' : 'text-slate-400'
                        }`}
                      >
                        {slot.chambres_pulverisees}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center border-r border-slate-100 text-slate-300">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-center bg-emerald-100/50 text-emerald-950 font-bold border-l border-emerald-200">
                      {statsGrille.chambresPulverisees}
                    </td>
                  </tr>

                  {/* LIGNE 3: CHAMBRES TOTALES */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-white border-r border-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span> </span>
                        <span>CHAMBRES TOTALES</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Cible</span>
                    </td>
                    {concessionSlots.map((slot) => (
                      <td
                        key={slot.numero}
                        onClick={() => handleOpenDetail(slot.numero)}
                        className="py-2 px-2 text-center text-slate-700 border-r border-slate-100 cursor-pointer"
                      >
                        {slot.nb_chambres_total}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center border-r border-slate-100 text-slate-300">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-center bg-slate-100 text-slate-900 font-bold border-l border-slate-200">
                      {statsGrille.chambresTotales}
                    </td>
                  </tr>

                  {/* LIGNE 4: RECHARGES ACTELLIC */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-slate-50 border-r border-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span> </span>
                        <span>RECHARGES ACTELLIC</span>
                      </span>
                      <span className="text-[10px] text-blue-700 font-bold">Bidons</span>
                    </td>
                    {concessionSlots.map((slot) => (
                      <td
                        key={slot.numero}
                        onClick={() => handleOpenDetail(slot.numero)}
                        className={`py-2 px-2 text-center border-r border-slate-100 cursor-pointer ${
                          slot.recharges_actellic > 0 ? 'text-blue-700 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {slot.recharges_actellic}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center border-r border-slate-100 text-slate-300">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-center bg-blue-50 text-blue-950 font-bold border-l border-blue-200">
                      {statsGrille.rechargesTotales}
                    </td>
                  </tr>

                  {/* LIGNE 5: STATUT AUTO */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-white border-r border-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>🟢</span>
                        <span>STATUT AUTO</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Calculé</span>
                    </td>
                    {concessionSlots.map((slot) => {
                      let badgeClass = 'bg-slate-100 text-slate-500';
                      if (slot.statut === 'Entière') badgeClass = 'bg-emerald-100 text-emerald-800 font-bold';
                      else if (slot.statut === 'Partielle') badgeClass = 'bg-amber-100 text-amber-800 font-bold';
                      else if (slot.statut === 'Refusée' || slot.statut === 'Absente') badgeClass = 'bg-rose-100 text-rose-800 font-bold';

                      return (
                        <td
                          key={slot.numero}
                          onClick={() => handleOpenDetail(slot.numero)}
                          className="py-2 px-1 text-center border-r border-slate-100 cursor-pointer"
                        >
                          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded text-center truncate max-w-21.25 ${badgeClass}`}>
                            {slot.statut}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-center border-r border-slate-100 text-slate-300">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-l border-emerald-200">
                      {statsGrille.tauxCouverture}%
                    </td>
                  </tr>

                  {/* LIGNE 6: ACTION */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-slate-50 border-r border-slate-200">
                       ACTION
                    </td>
                    {concessionSlots.map((slot) => (
                      <td key={slot.numero} className="py-2 px-2 text-center border-r border-slate-100">
                        <button
                          onClick={() => handleOpenDetail(slot.numero)}
                          className="px-2 py-1 bg-white hover:bg-slate-900 hover:text-white text-slate-700 border border-slate-200 hover:border-slate-900 rounded-md text-[10px] font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          Ouvrir
                        </button>
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center border-r border-slate-100">
                      <button
                        type="button"
                        onClick={handleAddConcessionSlot}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        + Concession
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center bg-slate-900 text-white text-[10px] font-bold">
                      F-1 à F-{concessionSlots.length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🔹 ONGLET 2 — SAISIE RAPIDE (PARCOURS EN 3 ÉTAPES)            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTabSub === 'saisie_rapide' && (
        <div className="space-y-4">
          {/* Step Indicator Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Parcours de Saisie Terrain :</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`px-2.5 py-1 rounded-lg ${saisieStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  1. Sélection
                </span>
                <span className="text-slate-300">→</span>
                <span className={`px-2.5 py-1 rounded-lg ${saisieStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  2. Concession par Concession
                </span>
                <span className="text-slate-300">→</span>
                <span className={`px-2.5 py-1 rounded-lg ${saisieStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  3. Validation Fin de Tournée
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTabSub('grille')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Retour Grille (Échap)
              </button>
            </div>
          </div>

          {/* ────── ÉTAPE 1 : SÉLECTION DE LA TOURNÉE ────── */}
          {saisieStep === 1 && (
            <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span> </span>
                  <span>Étape 1 — Paramètres de la Tournée IRS</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sélectionnez le village, la date et la campagne avant de commencer la saisie concession par concession.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Village d'intervention :</label>
                  <select
                    value={selectedVillage.id}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedVillageIdLocal(id);
                      setSelectedVillageId(id);
                    }}
                    disabled={currentUser.role === 'agent' && availableVillages.length === 1}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {availableVillages.map(v => (
                      <option key={v.id} value={v.id}>{v.nom} ({v.code}) — {v.chambres_totales} chambres cibles</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date d'intervention :</label>
                    <input
                      type="date"
                      value={tourDate}
                      onChange={(e) => setTourDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Numéro de Jour :</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={tourNumJour}
                      onChange={(e) => setTourNumJour(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Insecticide Homologué :</label>
                    <input
                      type="text"
                      value={tourInsecticide}
                      onChange={(e) => setTourInsecticide(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Campagne :</label>
                    <input
                      type="text"
                      value={tourCampagne}
                      onChange={(e) => setTourCampagne(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
                      readOnly
                    />
                  </div>
                </div>

                {/* Dynamic Concessions Target Selector for today's tour */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span></span>
                      <span>Nombre de concessions / familles prévues aujourd'hui :</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      F-1 à F-{concessionSlots.length} ({concessionSlots.length} familles)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ajustez librement selon votre journée : vous pouvez visiter ou enrôler plus de 40 familles ou moins de 30 familles par jour selon le terrain.
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[15, 20, 25, 30, 35, 40, 45, 50, 60].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleSetTargetCount(cnt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          concessionSlots.length === cnt
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                    <div className="flex items-center gap-1 pl-2">
                      <button
                        type="button"
                        onClick={() => handleSetTargetCount(Math.max(1, concessionSlots.length - 1))}
                        className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        title="Retirer une famille"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={150}
                        value={concessionSlots.length}
                        onChange={(e) => handleSetTargetCount(Number(e.target.value))}
                        className="w-14 text-center py-1 font-mono font-bold border border-slate-200 bg-white rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddConcessionSlot}
                        className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        title="Ajouter une famille F-x"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>Opérateur en mission : {currentUser.nom}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Vous allez renseigner les {concessionSlots.length} concessions (F-1 à F-{concessionSlots.length}) une par une. Les totaux et indicateurs seront mis à jour instantanément.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSaisieStep(2)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>... Démarrer la saisie concession par concession</span>
                </button>
              </div>
            </div>
          )}

          {/* ────── ÉTAPE 2 : FORMULAIRE FAMILLE PAR FAMILLE ────── */}
          {saisieStep === 2 && (
            <div className="space-y-4">
              {/* Top Concessions Pills Navigation Bar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Sélection rapide de la concession (F-1 à F-{concessionSlots.length}) :
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {concessionSlots.length} familles
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Raccourcis : <b>Entrée</b> = Suivant · <b>Ctrl+S</b> = Enregistrer · <b>Échap</b> = Annuler
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 py-1 max-h-36 overflow-y-auto no-scrollbar">
                  {concessionSlots.map((slot, idx) => {
                    const isCurrent = idx === currentFamilyIndex;
                    let dotColor = 'bg-slate-200 text-slate-600';
                    if (slot.statut === 'Entière') dotColor = 'bg-emerald-600 text-white';
                    else if (slot.statut === 'Partielle') dotColor = 'bg-amber-500 text-white';
                    else if (slot.statut === 'Refusée' || slot.statut === 'Absente') dotColor = 'bg-rose-500 text-white';

                    return (
                      <button
                        key={slot.numero}
                        onClick={() => {
                          handleSaveCurrentFamily(false);
                          setCurrentFamilyIndex(idx);
                        }}
                        className={`py-1 px-2 rounded-lg text-[10px] font-mono font-bold transition-all text-center cursor-pointer ${
                          isCurrent
                            ? 'ring-2 ring-emerald-500 scale-105 shadow-sm font-extrabold ' + dotColor
                            : 'hover:opacity-80 ' + dotColor
                        }`}
                        title={`F-${slot.numero} : ${slot.chef_famille} (${slot.statut})`}
                      >
                        {slot.numero}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      handleSaveCurrentFamily(false);
                      handleAddConcessionSlot();
                      setCurrentFamilyIndex(concessionSlots.length);
                    }}
                    className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0"
                    title="Ajouter une concession supplémentaire à la tournée"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Concession F-{concessionSlots.length + 1}</span>
                  </button>
                </div>
              </div>

              {/* Main Family Card Form */}
              <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Form Header */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono font-bold text-xs">
                        F-{currentFamilyIndex + 1}
                      </span>
                      <span className="text-xs text-slate-400">sur {concessionSlots.length} concessions</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                      Famille F-{currentFamilyIndex + 1} ({formChef || currentSlot.chef_famille})
                    </h3>
                    <div className="text-xs text-slate-300">
                      Village : <b className="text-emerald-400">{selectedVillage.nom}</b> · Concession : {currentSlot.nom_concession}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Statut actuel</div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      currentSlot.statut === 'Entière' ? 'bg-emerald-500/20 text-emerald-300' :
                      currentSlot.statut === 'Partielle' ? 'bg-amber-500/20 text-amber-300' :
                      currentSlot.statut === 'Refusée' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {currentSlot.statut}
                    </span>
                  </div>
                </div>

                {/* Form Body */}
                <div className="p-5 sm:p-6 space-y-5 text-xs">
                  {/* Chef de famille & Total Chambres */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chef de Famille / Concession :</label>
                      <input
                        type="text"
                        value={formChef}
                        onChange={(e) => setFormChef(e.target.value)}
                        placeholder="Ex: Diallo Mamadou"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chambres recensées (Total pièces) :</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormTotChambres(prev => Math.max(1, prev - 1))}
                          className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={formTotChambres}
                          onChange={(e) => setFormTotChambres(Math.max(1, Number(e.target.value) || 1))}
                          className="flex-1 p-2 rounded-xl border border-slate-200 text-center font-mono font-bold text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFormTotChambres(prev => prev + 1)}
                          className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Question: Famille visitée ? */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-800">Famille visitée ce jour ?</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormVisitee(true);
                          if (formPulvChambres === 0) setFormPulvChambres(formTotChambres);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          formVisitee ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>(•) Oui, concession visitée</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormVisitee(false);
                          setFormPulvChambres(0);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          !formVisitee ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>( ) Non visitée (en attente)</span>
                      </button>
                    </div>
                  </div>

                  {formVisitee && (
                    <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                      {/* Chambres pulvérisées */}
                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4 text-emerald-700" />
                            <span>Chambres pulvérisées :</span>
                          </label>
                          <span className="text-xs font-bold font-mono text-emerald-900">
                            {formPulvChambres} / {formTotChambres} chambres ({formTotChambres > 0 ? Math.round((formPulvChambres / formTotChambres) * 100) : 0}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={formTotChambres}
                            value={formPulvChambres}
                            onChange={(e) => setFormPulvChambres(Number(e.target.value))}
                            className="flex-1 accent-emerald-600 cursor-pointer"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setFormPulvChambres(prev => Math.max(0, prev - 1))}
                              className="w-8 h-8 rounded-lg bg-white border border-emerald-300 font-bold hover:bg-emerald-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-mono font-bold text-sm text-emerald-950">
                              {formPulvChambres}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormPulvChambres(prev => Math.min(formTotChambres, prev + 1))}
                              className="w-8 h-8 rounded-lg bg-white border border-emerald-300 font-bold hover:bg-emerald-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Quick 100% Button */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setFormPulvChambres(formTotChambres)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Tout pulvériser (100% maison entière)
                          </button>
                        </div>
                      </div>

                      {/* Chambres non pulvérisées et motifs obligatoires */}
                      {formPulvChambres < formTotChambres && (
                        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span className="font-bold text-amber-950">
                              Chambres non pulvérisées ({formTotChambres - formPulvChambres}) et Motifs obligatoires :
                            </span>
                          </div>

                          <div className="space-y-2">
                            {Array.from({ length: formTotChambres - formPulvChambres }).map((_, idx) => {
                              const chNum = formPulvChambres + idx + 1;
                              const currentMotif = formMotifs[chNum] || 'porte_fermee';

                              return (
                                <div key={chNum} className="p-2.5 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold flex items-center justify-center">
                                      {chNum}
                                    </span>
                                    <span>Chambre {chNum} non traitée :</span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-1 sm:justify-end">
                                    <select
                                      value={currentMotif}
                                      onChange={(e) => {
                                        const val = e.target.value as MotifNonPulverisation;
                                        setFormMotifs(prev => ({ ...prev, [chNum]: val }));
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 cursor-pointer max-w-55"
                                    >
                                      <option value="porte_fermee">Porte fermée</option>
                                      <option value="refus_chef">Refus du chef de famille</option>
                                      <option value="absence">Absence</option>
                                      <option value="chambre_verrouillee">Chambre verrouillée</option>
                                      <option value="encombrement">Encombrée</option>
                                      <option value="autre">Autre (préciser ci-dessous)</option>
                                    </select>
                                  </div>

                                  {currentMotif === 'autre' && (
                                    <div className="w-full sm:w-auto">
                                      <input
                                        type="text"
                                        placeholder="Préciser le motif..."
                                        value={formMotifAutreDetail[chNum] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setFormMotifAutreDetail(prev => ({ ...prev, [chNum]: val }));
                                        }}
                                        className="w-full p-1 rounded border border-slate-200 text-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Recharges Actellic & Observation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Recharges Actellic utilisées (Bidons) :
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={formRecharges}
                            onChange={(e) => setFormRecharges(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Observation de terrain :</label>
                          <input
                            type="text"
                            value={formObservation}
                            onChange={(e) => setFormObservation(e.target.value)}
                            placeholder="Remarques éventuelles sur la concession..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 font-normal text-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Action Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentFamilyIndex === 0}
                      onClick={() => {
                        handleSaveCurrentFamily(false);
                        setCurrentFamilyIndex(prev => Math.max(0, prev - 1));
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>◀ Précédent (F-{currentFamilyIndex})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveCurrentFamily(false);
                        handleAddConcessionSlot();
                        setCurrentFamilyIndex(concessionSlots.length);
                      }}
                      className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Créer une nouvelle concession F-x dans cette tournée"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Concession F-{concessionSlots.length + 1}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCurrentFamily(false)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer (Ctrl+S)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCurrentFamily(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                      <span>Enregistrer & Suivant ▶</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Finish Tour Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSaveCurrentFamily(false);
                    setSaisieStep(3);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <span>Passer à la vérification finale de la journée (Étape 3) →</span>
                </button>
              </div>
            </div>
          )}

          {/* ────── ÉTAPE 3 : VALIDATION FINALE DE LA JOURNÉE ────── */}
          {saisieStep === 3 && (
            <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span> </span>
                  <span>Fin de tournée — Vérification & Clôture</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Vérifiez la synthèse consolidée de la tournée pour {selectedVillage.nom} et complétez la démographie protégée.
                </p>
              </div>

              {/* Metric Review Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Familles visitées :</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {statsGrille.visitees} / {concessionSlots.length}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Chambres pulvérisées :</div>
                  <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                    {statsGrille.chambresPulverisees} / {statsGrille.chambresTotales}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Taux de couverture :</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-bold font-mono text-slate-900">{statsGrille.tauxCouverture}%</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      statsGrille.tauxCouverture >= 97 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {statsGrille.tauxCouverture >= 97 ? '🟢 Seuil 97% atteint' : '🟡 Seuil en cours'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Recharges utilisées :</div>
                  <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
                    {statsGrille.rechargesTotales} bidons Actellic
                  </div>
                </div>
              </div>

              {/* Population Protégée Input */}
              <div className="space-y-3 pt-1">
                <div className="font-bold text-slate-800 text-xs">
                  Population protégée recensée du jour :
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hommes :</label>
                    <input
                      type="number"
                      min={0}
                      value={valPopHomme}
                      onChange={(e) => setValPopHomme(Number(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-center font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Femmes :</label>
                    <input
                      type="number"
                      min={0}
                      value={valPopFemme}
                      onChange={(e) => setValPopFemme(Number(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-center font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Femmes Enceintes :</label>
                    <input
                      type="number"
                      min={0}
                      value={valPopEnceinte}
                      onChange={(e) => setValPopEnceinte(Number(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-emerald-300 bg-emerald-50/50 text-center font-mono font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Enfants 0-5 ans :</label>
                    <input
                      type="number"
                      min={0}
                      value={valPopEnfant}
                      onChange={(e) => setValPopEnfant(Number(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-emerald-300 bg-emerald-50/50 text-center font-mono font-bold text-emerald-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Total Population Protégée :</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {(valPopHomme + valPopFemme + valPopEnceinte + valPopEnfant).toLocaleString('fr-FR')} habitants
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSaisieStep(2)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span> Reprendre la tournée</span>
                </button>

                <button
                  type="button"
                  onClick={handleValidateDay}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span> Valider la journée IRS & Mettre à jour</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🔹 ONGLET 3 — DÉTAIL FAMILLE (FICHE FAMILLE)                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTabSub === 'detail' && (
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Quick Slot Selector & Navigation Header for Onglet 3 */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span> </span>
                <span>Naviguer entre les fiches concessions (F-1 à F-{concessionSlots.length}) :</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedSlotNumber <= 1}
                  onClick={() => setSelectedSlotNumber(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold rounded-lg flex items-center gap-1 cursor-pointer text-xs"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Précédent</span>
                </button>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  F-{selectedSlotNumber} / {concessionSlots.length}
                </span>
                <button
                  type="button"
                  disabled={selectedSlotNumber >= concessionSlots.length}
                  onClick={() => setSelectedSlotNumber(prev => Math.min(concessionSlots.length, prev + 1))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold rounded-lg flex items-center gap-1 cursor-pointer text-xs"
                >
                  <span>Suivant</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 py-1 max-h-32 overflow-y-auto no-scrollbar">
              {concessionSlots.map((slot) => {
                const isSelected = slot.numero === selectedSlotNumber;
                let dotColor = 'bg-slate-200 text-slate-700';
                if (slot.statut === 'Entière') dotColor = 'bg-emerald-600 text-white';
                else if (slot.statut === 'Partielle') dotColor = 'bg-amber-500 text-white';
                else if (slot.statut === 'Refusée' || slot.statut === 'Absente') dotColor = 'bg-rose-500 text-white';

                return (
                  <button
                    key={slot.numero}
                    onClick={() => setSelectedSlotNumber(slot.numero)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-mono font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 scale-105 shadow-sm font-extrabold ' + dotColor
                        : 'hover:opacity-80 ' + dotColor
                    }`}
                    title={`F-${slot.numero} : ${slot.chef_famille} (${slot.statut})`}
                  >
                    {slot.numero}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  handleAddConcessionSlot();
                  setSelectedSlotNumber(concessionSlots.length + 1);
                }}
                className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0"
                title="Ajouter une concession supplémentaire à la tournée"
              >
                <Plus className="w-3 h-3" />
                <span>+ Concession F-{concessionSlots.length + 1}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Top Header Card */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono font-bold text-xs">
                    {detailSlot.code}
                  </span>
                  <span className="text-xs text-slate-400">· {selectedVillage.nom}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {detailSlot.chef_famille}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Concession : {detailSlot.nom_concession}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                  detailSlot.statut === 'Entière' ? 'bg-emerald-500 text-slate-950' :
                  detailSlot.statut === 'Partielle' ? 'bg-amber-400 text-slate-950' :
                  detailSlot.statut === 'Refusée' ? 'bg-rose-500 text-white' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {detailSlot.statut} ({detailSlot.chambres_pulverisees}/{detailSlot.nb_chambres_total})
                </span>
              </div>
            </div>

            {/* Quick Metrics of the Family */}
            <div className="p-4 sm:p-5 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/50">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Chambres Totales</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{detailSlot.nb_chambres_total} pièces</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Chambres Traitées</div>
                <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">{detailSlot.chambres_pulverisees} traitées</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Taux Concession</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {detailSlot.nb_chambres_total > 0 ? Math.round((detailSlot.chambres_pulverisees / detailSlot.nb_chambres_total) * 100) : 0}%
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Population Habitant</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{detailSlot.population?.total || 6} pers.</div>
              </div>
            </div>

            {/* Room by Room Status List */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-emerald-700" />
                  <span>Détail Chambre par Chambre ({detailSlot.chambresDetails.length} pièces) :</span>
                </h4>
                <span className="text-[11px] text-slate-400">Agent : {currentUser.nom}</span>
              </div>

              <div className="space-y-2">
                {detailSlot.chambresDetails.map((ch) => {
                  const isPulv = ch.statut === 'pulvérisée';
                  return (
                    <div
                      key={ch.numero}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isPulv
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/50 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-lg font-mono font-bold text-[11px] flex items-center justify-center ${
                          isPulv ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {ch.numero}
                        </span>
                        <div>
                          <div className="font-bold">Chambre {ch.numero}</div>
                          <div className="text-[11px] text-slate-500">Pièce d'habitation concession familiale</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isPulv ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✔ Pulvérisée · {tourDate}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-rose-700 font-bold">
                              <X className="w-4 h-4" />
                              <span>✘ Non traitée</span>
                            </div>
                            <div className="text-[10px] text-rose-600 font-medium">
                              Motif : <b>{ch.motif === 'refus_chef' ? 'Refus du chef' : ch.motif === 'absence' ? 'Absence' : ch.motif === 'porte_fermee' ? 'Porte fermée' : ch.motif}</b>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* History of Passages */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Historique des Passages IRS :</span>
                </h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600 font-mono">
                  <div className="flex items-center justify-between">
                    <span>• {tourDate} — {detailSlot.chambres_pulverisees}/{detailSlot.nb_chambres_total} pièces</span>
                    <span className="text-slate-400 font-sans">{currentUser.nom}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 2026-05-18 — 0/{detailSlot.nb_chambres_total} pièces (Enrôlement initial)</span>
                    <span className="text-slate-400 font-sans">Équipe Recensement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTabSub('grille')}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>◀ Retour à la grille</span>
              </button>

              <button
                type="button"
                onClick={() => handleEditFamilyFromDetail(detailSlot.numero)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span> Modifier cette famille en Saisie Rapide</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🔹 ONGLET 4 — HISTORIQUE DES TOURNÉES ARCHIVÉES               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTabSub === 'historique' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Historique des Lignes de Pulvérisation Journalière
              </h3>
              <p className="text-xs text-slate-500">
                Toutes les tournées enregistrées pour {selectedVillage.nom} et la campagne 2026.
              </p>
            </div>

            <button
              onClick={handleExportGrilleExcel}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter Historique (.xlsx)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Date & Jour</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-2 text-right">Pièces Pulv.</th>
                  <th className="py-2.5 px-2 text-right">Stands</th>
                  <th className="py-2.5 px-2 text-right">Recharges</th>
                  <th className="py-2.5 px-2 text-right">Pop. Protégée</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailySprays.length > 0 ? (
                  dailySprays.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono">
                        <span className="font-bold text-slate-900">J-{line.num_jour}</span>
                        <span className="text-[10px] text-slate-400 block">{line.date_intervention}</span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {line.nom_village}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">
                        {line.structures_total}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">
                        {line.stand_total}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-blue-700">
                        {line.can_refills_total}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-800">
                        {line.population.total}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {line.nom_agent}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              showToast(`Tournée J-${line.num_jour} chargée`, 'info');
                              setActiveTabSub('grille');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Voir la grille de cette journée"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {(currentUser.role === 'admin' || allowAgentsEditLines) && (
                            <button
                              onClick={() => {
                                if (confirm('Supprimer cette intervention historique ?')) {
                                  deleteDailySpray(line.id);
                                  showToast('Ligne supprimée', 'info');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      Aucune intervention enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Server-side Security Note (PHP / RBAC Audit) */}
      <div className="p-3 bg-slate-100 rounded-xl text-slate-500 text-[11px] flex items-center justify-between no-print border border-slate-200">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-600" />
          <span>Contrôle RBAC actif : <b>{currentUser.role.toUpperCase()}</b> ({currentUser.nom}) · Saisie autorisée : {currentUser.peut_saisir ? 'OUI' : 'NON'}</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          API SAG Koron: in_array(role, ['ADMIN', 'SUPERVISEUR', 'AGENT'])
        </div>
      </div>

      {/* Admin New Village Modal */}
      {showNewVillageModal && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Créer une Nouvelle Localité / Village
                  </h3>
                  <p className="text-xs text-purple-700 font-semibold">
                    Privilège Administrateur en Chef · SAG Koron
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewVillageModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                
              </button>
            </div>

            <form onSubmit={handleCreateVillage} className="py-4 space-y-4">
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Enregistrement automatique dans tout le système :</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Dès sa validation, ce nouveau village sera immédiatement intégré au Tableau de bord, à la Cartographie, aux Rapports officiels et accessible aux <b>Superviseurs</b> et <b>Agents de terrain</b>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom du Village / Localité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVillageNom}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewVillageNom(val);
                      if (!newVillageCode || newVillageCode.length <= 4) {
                        setNewVillageCode(val.trim().substring(0, 4).toUpperCase());
                      }
                    }}
                    placeholder="Ex: KOUROUKORO"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code Identifiant (3 à 5 lettres)
                  </label>
                  <input
                    type="text"
                    value={newVillageCode}
                    onChange={(e) => setNewVillageCode(e.target.value.toUpperCase())}
                    placeholder="Ex: KROU"
                    maxLength={6}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type de zone
                  </label>
                  <select
                    value={newVillageType}
                    onChange={(e) => setNewVillageType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  >
                    <option value="village">Village Rural</option>
                    <option value="SAG">Site / Base SAG</option>
                    <option value="Autre">Autre Localité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Structures cibles
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={2500}
                    value={newVillageStructures}
                    onChange={(e) => setNewVillageStructures(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stands estimés
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1000}
                    value={newVillageStands}
                    onChange={(e) => setNewVillageStands(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewVillageModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingVillage}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreatingVillage ? (
                    <span>Enregistrement...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Créer et Enregistrer dans tout le système</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
