import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChambreStatut, MotifNonPulverisation } from '../types';
import { MOTIF_LABELS } from '../utils/heatmap';
import { calculateSprayCoverage } from '../utils/calculations';
import { 
  CheckCircle2, XCircle, AlertCircle, 
  ArrowRight, Check, AlertTriangle, Users, Home, FileText,
  Plus, PlusCircle, Loader2, Sparkles, UserCheck, ShieldCheck, 
  Baby, HeartPulse, Search, Trash2, ListChecks, RotateCcw,
  CheckCheck, ArrowUpRight, MapPin
} from 'lucide-react';

export const RoomSprayEntry: React.FC = () => {
  const { 
    villages, 
    familles, 
    chambres, 
    addFamille, 
    addVillage,
    deleteFamille,
    recordFamilyPassage, 
    resyncAllVillages,
    currentUser, 
    isOnline, 
    openReportModal 
  } = useApp();

  // Active view mode: 'pulverisation' | 'enrolement' | 'registre'
  const [activeMode, setActiveMode] = useState<'pulverisation' | 'enrolement' | 'registre'>(
    currentUser.role === 'agent' ? 'enrolement' : 'pulverisation'
  );

  // Selected village for field intervention
  const [selectedVillageId, setSelectedVillageId] = useState<number>(
    currentUser.village_assigne_id || villages[0]?.id || 1
  );

  // Selected family for spraying
  const [selectedFamilleId, setSelectedFamilleId] = useState<number | null>(null);
  
  // Local state of rooms during inspection
  const [roomStates, setRoomStates] = useState<{
    id: number;
    numero: number;
    type: string;
    statut: ChambreStatut;
    motif: MotifNonPulverisation;
    detail: string;
  }[]>([]);

  const [observation, setObservation] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loading states for fluid UI feedback
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [isSavingSpray, setIsSavingSpray] = useState<boolean>(false);
  const [isSavingNext, setIsSavingNext] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [isResyncing, setIsResyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ---------------------------------------------------------------------------
  // NEW VILLAGE CREATION STATE (Admin Only)
  // ---------------------------------------------------------------------------
  const [showNewVillageModal, setShowNewVillageModal] = useState<boolean>(false);
  const [newVillageNom, setNewVillageNom] = useState<string>('');
  const [newVillageCode, setNewVillageCode] = useState<string>('');
  const [newVillageType, setNewVillageType] = useState<'village' | 'SAG' | 'Autre'>('village');
  const [newVillageStructures, setNewVillageStructures] = useState<number>(300);
  const [newVillageStands, setNewVillageStands] = useState<number>(85);
  const [newVillageLat, setNewVillageLat] = useState<string>('11.4325');
  const [newVillageLng, setNewVillageLng] = useState<string>('-9.1824');
  const [isCreatingVillage, setIsCreatingVillage] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // ENROLLMENT FORM STATE (Famille une à une)
  // ---------------------------------------------------------------------------
  const [chefFamille, setChefFamille] = useState<string>('');
  const [nomConcession, setNomConcession] = useState<string>('');
  const [contactTel, setContactTel] = useState<string>('+224 ');
  
  // Demographic counters
  const [nbHommes, setNbHommes] = useState<number>(2);
  const [nbFemmes, setNbFemmes] = useState<number>(2);
  const [nbEnceintes, setNbEnceintes] = useState<number>(0);
  const [nbEnfants05, setNbEnfants05] = useState<number>(1);

  // Rooms in this new family
  const [nbChambresEnrol, setNbChambresEnrol] = useState<number>(4);
  const [customRoomTypes, setCustomRoomTypes] = useState<{
    type: string;
    statutInitial: ChambreStatut;
  }[]>([
    { type: 'Chambre Principale (Chef)', statutInitial: 'non_pulvérisée' },
    { type: 'Chambre Épouse 1', statutInitial: 'non_pulvérisée' },
    { type: 'Chambre Enfants', statutInitial: 'non_pulvérisée' },
    { type: 'Chambre Annexe / Magasin', statutInitial: 'non_pulvérisée' },
  ]);

  // Adjust custom room types when room count changes
  const handleRoomCountChange = (count: number) => {
    const val = Math.max(1, Math.min(20, count));
    setNbChambresEnrol(val);

    const defaultNames = [
      'Chambre Principale (Chef)',
      'Chambre Épouse 1',
      'Chambre Épouse 2',
      'Chambre Enfants',
      'Chambre Annexe / Magasin',
      'Chambre Visiteurs',
      'Chambre Grenier Vivres',
      'Pièce Annexe'
    ];

    setCustomRoomTypes(prev => {
      if (val > prev.length) {
        const added: { type: string; statutInitial: ChambreStatut }[] = [];
        for (let i = prev.length; i < val; i++) {
          added.push({
            type: defaultNames[i % defaultNames.length] || `Chambre ${i + 1}`,
            statutInitial: 'non_pulvérisée'
          });
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, val);
      }
    });
  };

  // Village families
  const villageFamilles = familles.filter(f => f.village_id === selectedVillageId);
  const currentVillage = villages.find(v => v.id === selectedVillageId) || villages[0];
  const currentFamille = familles.find(f => f.id === selectedFamilleId) || villageFamilles[0];

  // Initialize room states when a family is selected for spray inspection
  const handleSelectFamille = (familleId: number) => {
    setSelectedFamilleId(familleId);
    const famChambres = chambres.filter(c => c.famille_id === familleId);
    
    if (famChambres.length > 0) {
      setRoomStates(famChambres.map(c => ({
        id: c.id,
        numero: c.numero_chambre,
        type: c.type,
        statut: c.statut,
        motif: c.motif_non_pulverisation,
        detail: c.motif_detail || ''
      })));
    } else {
      // Create default 4 rooms if not exist
      const generated = Array.from({ length: 4 }, (_, i) => ({
        id: Date.now() + i,
        numero: i + 1,
        type: i === 0 ? 'Chambre Principale (Chef)' : `Chambre ${i + 1}`,
        statut: 'pulvérisée' as ChambreStatut,
        motif: 'aucun' as MotifNonPulverisation,
        detail: ''
      }));
      setRoomStates(generated);
    }
  };

  // Select first family initially when village changes
  useEffect(() => {
    if (villageFamilles.length > 0) {
      if (!selectedFamilleId || !villageFamilles.some(f => f.id === selectedFamilleId)) {
        handleSelectFamille(villageFamilles[0].id);
      }
    } else {
      setSelectedFamilleId(null);
      setRoomStates([]);
    }
  }, [selectedVillageId, villageFamilles.length]);

  const handleUpdateRoomStatus = (roomId: number, newStatut: ChambreStatut) => {
    setRoomStates(prev => prev.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          statut: newStatut,
          motif: newStatut === 'pulvérisée' ? 'aucun' : (r.motif === 'aucun' ? 'refus_chef' : r.motif)
        };
      }
      return r;
    }));
  };

  const handleUpdateRoomMotif = (roomId: number, motif: MotifNonPulverisation) => {
    setRoomStates(prev => prev.map(r => r.id === roomId ? { ...r, motif } : r));
  };

  const handleUpdateRoomDetail = (roomId: number, detail: string) => {
    setRoomStates(prev => prev.map(r => r.id === roomId ? { ...r, detail } : r));
  };

  // Instant 100% spray coverage action with fluid micro-animation
  const handleAllPulverisees = () => {
    setIsMarkingAll(true);
    setTimeout(() => {
      setRoomStates(prev => prev.map(r => ({
        ...r,
        statut: 'pulvérisée',
        motif: 'aucun',
        detail: ''
      })));
      setIsMarkingAll(false);
    }, 250);
  };

  // ---------------------------------------------------------------------------
  // SUBMISSION: CREATE NEW VILLAGE (Admin Only)
  // ---------------------------------------------------------------------------
  const handleCreateVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      setErrorMessage("Seul l'Administrateur en chef est habilité à créer de nouvelles localités.");
      return;
    }

    if (!newVillageNom.trim()) {
      setErrorMessage("Veuillez renseigner le nom du village.");
      return;
    }

    setIsCreatingVillage(true);
    setErrorMessage(null);

    setTimeout(() => {
      try {
        const { village, isNew } = addVillage({
          nom: newVillageNom.trim(),
          code: newVillageCode.trim() || newVillageNom.trim().substring(0, 4).toUpperCase(),
          type: newVillageType,
          nb_structures_total: Number(newVillageStructures) || 300,
          nb_stands_total: Number(newVillageStands) || Math.round((Number(newVillageStructures) || 300) / 3.5),
          latitude: Number(newVillageLat) || 11.4325,
          longitude: Number(newVillageLng) || -9.1824
        });

        setIsCreatingVillage(false);
        setShowNewVillageModal(false);
        setNewVillageNom('');
        setNewVillageCode('');

        // Automatically select the new village
        setSelectedVillageId(village.id);

        setSavedSuccess(
          `Localité "${village.nom}" (${village.code}) créée avec succès dans tout le système SAG Koron ! Elle est désormais immédiatement visible par les Superviseurs et Agents de terrain.`
        );
        setTimeout(() => setSavedSuccess(null), 6000);
      } catch (err: any) {
        setIsCreatingVillage(false);
        setErrorMessage("Erreur lors de la création du village : " + (err.message || 'Échec'));
      }
    }, 350);
  };

  // ---------------------------------------------------------------------------
  // SUBMISSION: ENROLL NEW FAMILY
  // ---------------------------------------------------------------------------
  const handleEnrollFamily = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser.peut_saisir) {
      setErrorMessage("Erreur : Votre profil ne dispose pas du droit de saisie.");
      return;
    }

    if (!chefFamille.trim()) {
      setErrorMessage("Veuillez renseigner le nom du chef de famille.");
      return;
    }

    setErrorMessage(null);
    setIsEnrolling(true);

    // Realistic fluid feedback
    setTimeout(() => {
      try {
        const newFam = addFamille({
          village_id: selectedVillageId,
          chef_famille: chefFamille.trim(),
          nom_concession: nomConcession.trim() || `Concession ${chefFamille.trim()}`,
          contact: contactTel.trim(),
          nb_chambres: customRoomTypes.length,
          population: {
            homme: Number(nbHommes) || 0,
            femme: Number(nbFemmes) || 0,
            femme_enceinte: Number(nbEnceintes) || 0,
            enfant_0_5: Number(nbEnfants05) || 0
          },
          chambres_details: customRoomTypes.map(r => ({
            type: r.type,
            statut: r.statutInitial,
            motif: r.statutInitial === 'pulvérisée' ? 'aucun' : 'absence',
            detail: ''
          }))
        });

        setIsEnrolling(false);
        setSavedSuccess(`Famille ${newFam.chef_famille} (${newFam.code_famille}) enrôlée avec succès ! Les calculs de ${currentVillage?.nom} ont été mis à jour.`);
        setTimeout(() => setSavedSuccess(null), 5000);

        // Reset form for next enrollment
        setChefFamille('');
        setNomConcession('');
        setContactTel('+224 ');
        setNbHommes(2);
        setNbFemmes(2);
        setNbEnceintes(0);
        setNbEnfants05(1);
        handleRoomCountChange(4);

        // Option: select newly created family for inspection
        handleSelectFamille(newFam.id);
      } catch (err: any) {
        setIsEnrolling(false);
        setErrorMessage("Erreur lors de l'enrôlement : " + (err.message || 'Échec'));
      }
    }, 400);
  };

  // ---------------------------------------------------------------------------
  // SUBMISSION: RECORD ROOM SPRAY PASSAGE
  // ---------------------------------------------------------------------------
  const handleSubmitSpray = (andNext: boolean = false) => {
    if (!currentUser.peut_saisir) {
      setErrorMessage("Erreur : Votre profil ne dispose pas du droit de saisie.");
      return;
    }

    if (!currentFamille) return;

    // VALIDATION OBLIGATOIRE : motif si non pulvérisée
    for (const r of roomStates) {
      if (r.statut !== 'pulvérisée' && (r.motif === 'aucun' || !r.motif)) {
        setErrorMessage(`Chambre #${r.numero} (${r.type}) : Le motif de non-pulvérisation est obligatoire selon le protocole SAG Koron !`);
        return;
      }
    }

    setErrorMessage(null);
    if (andNext) {
      setIsSavingNext(true);
    } else {
      setIsSavingSpray(true);
    }

    setTimeout(() => {
      const success = recordFamilyPassage(
        currentFamille.id,
        roomStates.map(r => ({
          id: r.id,
          statut: r.statut,
          motif: r.motif,
          detail: r.detail
        })),
        observation
      );

      setIsSavingSpray(false);
      setIsSavingNext(false);

      if (success) {
        const pulv = roomStates.filter(r => r.statut === 'pulvérisée').length;
        const calc = calculateSprayCoverage(roomStates.length, pulv);
        
        setSavedSuccess(
          `Passage validé pour ${currentFamille.chef_famille} (${currentFamille.code_famille}) : ${calc.tagLabel} (${pulv}/${roomStates.length} chambres). Données synchronisées.`
        );
        setTimeout(() => setSavedSuccess(null), 4500);

        if (andNext) {
          const currentIndex = villageFamilles.findIndex(f => f.id === currentFamille.id);
          if (currentIndex !== -1 && currentIndex + 1 < villageFamilles.length) {
            handleSelectFamille(villageFamilles[currentIndex + 1].id);
          } else {
            alert('Félicitations ! Toutes les familles enrôlées pour ce village ont été passées en revue.');
          }
        }
      }
    }, 350);
  };

  // Global manual resync trigger with loading effect
  const handleTriggerResync = () => {
    setIsResyncing(true);
    setTimeout(() => {
      resyncAllVillages();
      setIsResyncing(false);
      setSavedSuccess("Base calculatoire de tous les villages synchronisée avec succès avec le terrain.");
      setTimeout(() => setSavedSuccess(null), 3000);
    }, 300);
  };

  // Current spray calculations for selected family
  const currentTotalChambres = roomStates.length;
  const currentPulvCount = roomStates.filter(r => r.statut === 'pulvérisée').length;
  const sprayCalc = calculateSprayCoverage(currentTotalChambres, currentPulvCount);

  // Village-wide enrolled census stats
  const totalEnrolledFamilies = villageFamilles.length;
  const totalEnrolledRooms = villageFamilles.reduce((sum, f) => sum + (f.nb_chambres_total || 0), 0);
  const totalEnrolledPop = villageFamilles.reduce((sum, f) => sum + (f.population_famille?.total || 0), 0);
  const totalEnrolledEnceintes = villageFamilles.reduce((sum, f) => sum + (f.population_famille?.femme_enceinte || 0), 0);
  const totalEnrolledEnfants = villageFamilles.reduce((sum, f) => sum + (f.population_famille?.enfant_0_5 || 0), 0);

  // Village spray coverage calculation
  const villageSprayCalc = calculateSprayCoverage(currentVillage.chambres_totales, currentVillage.chambres_pulverisees);

  // Filtered families for registry
  const filteredFamilies = villageFamilles.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.chef_famille.toLowerCase().includes(q) ||
      f.code_famille.toLowerCase().includes(q) ||
      (f.nom_concession && f.nom_concession.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-6 pb-20">
      
      {/* Editorial Header with Agent Mission & Fluid Actions */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Socle de Vérité Terrain · SAG Koron
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
              Seuil Cible 97% OMS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Module Central IRS · Enrôlement & Pulvérisation Terrain
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            Enrôlement des familles une à une avec recensement précis (chambres, hommes, femmes, femmes enceintes, enfants de 0 à 5 ans). 
            La pulvérisation calcule automatiquement <b>100%</b> si toutes les pièces sont traitées, et attribue les <b>tags 97%</b> pour alimenter l'ensemble des calculs de l'application.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerResync}
            disabled={isResyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Recalculer et synchroniser toutes les données"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResyncing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>{isResyncing ? 'Recalcul...' : 'Recalculer les Totaux'}</span>
          </button>

          <button
            type="button"
            onClick={() => openReportModal({ type: 'room_sprays', villageId: selectedVillageId })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-800" />
            Rapport Chambres IRS
          </button>

          {!isOnline && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              Mode Hors-Ligne
            </div>
          )}
        </div>
      </div>

      {/* Agent Identification & Village Status Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-white">{currentUser.nom}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                {currentUser.matricule}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3 flex-wrap">
              <span>Village d'intervention : <b className="text-emerald-400 uppercase">{currentVillage?.nom}</b> ({currentVillage?.code})</span>
              <span>·</span>
              <span>Droit de saisie : <b className={currentUser.peut_saisir ? 'text-emerald-400' : 'text-red-400'}>{currentUser.peut_saisir ? 'Actif' : 'Verrouillé'}</b></span>
              <span>·</span>
              <span>Concessions enrôlées : <b className="text-white font-mono">{totalEnrolledFamilies}</b></span>
            </p>
          </div>
        </div>

        {/* Real-time Village Calculation Badge */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center gap-4">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Taux Village {currentVillage?.nom}</div>
            <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <span>{villageSprayCalc.rate}%</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${villageSprayCalc.tagBadgeClass}`}>
                {villageSprayCalc.is100Pct ? '100% INTÉGRAL' : villageSprayCalc.is97TargetReached ? 'TAG 97% ATTEINT' : '< 97%'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {currentVillage?.chambres_pulverisees} / {currentVillage?.chambres_totales} chambres traitées
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5 font-medium shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2.5 font-medium shadow-2xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Target Village Selector & Sub-Module Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Village picker */}
        <div className="flex-1 max-w-xl flex flex-col sm:flex-row sm:items-end gap-2.5">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sélectionner la localité / village d'intervention :
            </label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden cursor-pointer"
            >
              {villages.map(v => (
                <option key={v.id} value={v.id}>
                  {v.nom} ({v.chambres_pulverisees}/{v.chambres_totales} ch. — {v.taux_chambres_pct}% pulv.) {v.objectif_97_atteint ? '★ [TAG 97%]' : ''}
                </option>
              ))}
            </select>
          </div>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowNewVillageModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
              title="Créer une nouvelle localité dans tout le système SAG Koron"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Nouveau Village (Admin)</span>
            </button>
          )}
        </div>

        {/* 3 Main Action Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-end">
          <button
            type="button"
            onClick={() => setActiveMode('enrolement')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'enrolement'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>1. Enrôler une Famille</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('pulverisation')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'pulverisation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>2. Pulvériser Chambre par Chambre</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('registre')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'registre'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>3. Registre du Village ({villageFamilles.length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MODE 1: ENRÔLEMENT CONCESSION & FAMILLE (RECENSEMENT TERRAIN)
          ===================================================================== */}
      {activeMode === 'enrolement' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          
          {/* Informational Mission Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <b className="font-bold text-emerald-900">Enrôlement Illimité des Concessions & Familles (Une à une)</b>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Renseignez pour chaque concession le nom du chef, le nombre de pièces exactes, et dénombrez la population (hommes, femmes, femmes enceintes, enfants 0-5 ans). 
                  Vous pouvez enrôler et visiter autant de familles que nécessaire par jour (moins de 30, 40, 50+ concessions selon le travail de terrain).
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-emerald-900 font-bold">{villageFamilles.length} familles</span>
              <div className="text-[10px] text-emerald-700">déjà recensées à {currentVillage?.nom}</div>
            </div>
          </div>

          <form onSubmit={handleEnrollFamily} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                Fiche d'Enrôlement Concession · {currentVillage?.nom}
              </h2>
              <span className="text-xs text-slate-400">Date : {new Date().toISOString().substring(0, 10)}</span>
            </div>

            {/* Section A: Identification Concession */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  A. Identification de la Concession Familiale
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Village actif : <b className="text-slate-900 uppercase">{currentVillage?.nom}</b></span>
                  </span>
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setShowNewVillageModal(true)}
                      className="text-purple-700 hover:text-purple-900 font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>+ Nouveau village</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom du Chef de Famille <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={chefFamille}
                    onChange={(e) => setChefFamille(e.target.value)}
                    placeholder="Ex: Karamoko Camara"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom de la Concession / Cour
                  </label>
                  <input
                    type="text"
                    value={nomConcession}
                    onChange={(e) => setNomConcession(e.target.value)}
                    placeholder={`Ex: Concession ${chefFamille ? chefFamille : 'Camarakounda'}`}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Téléphonique
                  </label>
                  <input
                    type="text"
                    value={contactTel}
                    onChange={(e) => setContactTel(e.target.value)}
                    placeholder="+224 622 ..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Dénombrement Démographique (Hommes, Femmes, Femmes enceintes, Enfants 0-5 ans) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  B. Dénombrement de la Population Vivant sous le Toit
                </h3>
                <span className="text-xs font-bold font-mono bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  Total Concession : {Number(nbHommes || 0) + Number(nbFemmes || 0) + Number(nbEnceintes || 0) + Number(nbEnfants05 || 0)} personnes
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Hommes */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Hommes</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNbHommes(Math.max(0, nbHommes - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={nbHommes}
                      onChange={(e) => setNbHommes(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-center py-1 text-sm font-bold font-mono border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setNbHommes(nbHommes + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Femmes */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Femmes</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNbFemmes(Math.max(0, nbFemmes - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={nbFemmes}
                      onChange={(e) => setNbFemmes(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-center py-1 text-sm font-bold font-mono border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setNbFemmes(nbFemmes + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Femmes Enceintes */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-900 flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-purple-700" />
                      Femmes Enceintes
                    </label>
                    <span className="text-[9px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-bold">Priorité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNbEnceintes(Math.max(0, nbEnceintes - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-purple-300 flex items-center justify-center font-bold text-purple-800 hover:bg-purple-100 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={nbEnceintes}
                      onChange={(e) => setNbEnceintes(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-center py-1 text-sm font-bold font-mono border border-purple-300 rounded-lg bg-white text-purple-950"
                    />
                    <button
                      type="button"
                      onClick={() => setNbEnceintes(nbEnceintes + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-purple-300 flex items-center justify-center font-bold text-purple-800 hover:bg-purple-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Enfants 0 à 5 ans */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Baby className="w-3.5 h-3.5 text-amber-700" />
                      Enfants 0 à 5 ans
                    </label>
                    <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-bold">Vulnérables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNbEnfants05(Math.max(0, nbEnfants05 - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-amber-300 flex items-center justify-center font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={nbEnfants05}
                      onChange={(e) => setNbEnfants05(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-center py-1 text-sm font-bold font-mono border border-amber-300 rounded-lg bg-white text-amber-950"
                    />
                    <button
                      type="button"
                      onClick={() => setNbEnfants05(nbEnfants05 + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-amber-300 flex items-center justify-center font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Chambres dans la Famille */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-emerald-700" />
                    C. Enrôlement des Chambres de la Famille
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Définissez le nombre total de pièces fermées servant au coucher et aux activités de la maison.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Nombre de chambres :</span>
                  <div className="flex items-center gap-1">
                    {[3, 4, 5, 6, 8].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleRoomCountChange(cnt)}
                        className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                          nbChambresEnrol === cnt
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* List of enrolled rooms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customRoomTypes.map((room, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={room.type}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomRoomTypes(prev => prev.map((r, i) => i === idx ? { ...r, type: val } : r));
                        }}
                        className="text-xs font-semibold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomRoomTypes(prev => prev.map((r, i) => i === idx ? {
                            ...r,
                            statutInitial: r.statutInitial === 'pulvérisée' ? 'non_pulvérisée' : 'pulvérisée'
                          } : r));
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          room.statutInitial === 'pulvérisée'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {room.statutInitial === 'pulvérisée' ? '✔ Pulvérisée' : 'En attente'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button with Fluid Loading Animation */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                L'enrôlement mettra à jour en temps réel le total des chambres et de la population pour <b>{currentVillage?.nom}</b>.
              </div>

              <button
                type="submit"
                disabled={isEnrolling}
                className="relative px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer overflow-hidden"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Enrôlement & Recalcul de l'App...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-200" />
                    <span>Valider l'Enrôlement de cette Famille</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODE 2: PULVÉRISATION CHAMBRE PAR CHAMBRE & CALCULS 97% / 100%
          ===================================================================== */}
      {activeMode === 'pulverisation' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          
          {/* Family Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Choisir la famille à traiter à {currentVillage?.nom} ({villageFamilles.length} familles enrôlées) :
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Capacité illimitée (30, 40, 50+ concessions)
                  </span>
                </div>
                {villageFamilles.length > 0 ? (
                  <select
                    value={currentFamille?.id || ''}
                    onChange={(e) => handleSelectFamille(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
                  >
                    {villageFamilles.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.code_famille} — {f.chef_famille} ({f.nb_chambres_total} chambres) [{f.statut_famille}] {f.maison_entiere_pulverisee ? '★ 100%' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span>Aucune famille encore enrôlée pour ce village.</span>
                    <button
                      type="button"
                      onClick={() => setActiveMode('enrolement')}
                      className="underline font-bold text-amber-900 cursor-pointer ml-2"
                    >
                      Enrôler la première famille →
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Switch to Enrollment */}
              <button
                type="button"
                onClick={() => setActiveMode('enrolement')}
                className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-end"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Enrôler Nouvelle Famille</span>
              </button>
            </div>

            {/* Interactive Pills Bar of All Village Families */}
            {villageFamilles.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Accès direct aux familles du village :</span>
                  <span>{villageFamilles.length} concessions enregistrées</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto py-0.5 no-scrollbar">
                  {villageFamilles.map((fam, idx) => {
                    const isSelected = currentFamille?.id === fam.id;
                    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (fam.statut_famille === 'Pulvérisée complètement' || fam.maison_entiere_pulverisee) {
                      badgeColor = 'bg-emerald-600 text-white border-emerald-700';
                    } else if (fam.statut_famille === 'Partiellement pulvérisée') {
                      badgeColor = 'bg-amber-500 text-white border-amber-600';
                    } else if (fam.statut_famille === 'Refusée') {
                      badgeColor = 'bg-rose-600 text-white border-rose-700';
                    }

                    return (
                      <button
                        key={fam.id}
                        type="button"
                        onClick={() => handleSelectFamille(fam.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 font-bold scale-105 shadow-xs ' + badgeColor
                            : 'hover:opacity-80 ' + badgeColor
                        }`}
                        title={`${fam.code_famille} - ${fam.chef_famille} (${fam.statut_famille})`}
                      >
                        <span className="font-mono font-bold">#{idx + 1}</span>
                        <span className="truncate max-w-[100px]">{fam.chef_famille}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setActiveMode('enrolement')}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Enrôler</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentFamille && (
            <>
              {/* Family Card & Official Strict Spray Calculation */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-bold shadow-2xs">
                      {currentFamille.code_famille}
                    </span>
                    <span className="text-lg font-bold text-white">{currentFamille.chef_famille}</span>
                    <span className="text-xs text-slate-300">({currentFamille.nom_concession || 'Concession'})</span>
                  </div>
                  
                  {/* Demography pill */}
                  <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 flex-wrap">
                    <span>Contact : <b className="text-white">{currentFamille.contact || 'Non renseigné'}</b></span>
                    <span>·</span>
                    <span>Population : <b className="text-emerald-400 font-mono">{currentFamille.population_famille?.total || 5} pers.</b> (
                      {currentFamille.population_famille?.homme || 0}H / {currentFamille.population_famille?.femme || 0}F / {currentFamille.population_famille?.femme_enceinte || 0}FE / {currentFamille.population_famille?.enfant_0_5 || 0}Enf
                    )</span>
                    <span>·</span>
                    <span>Statut actuel : <b className="text-white">{currentFamille.statut_famille}</b></span>
                  </div>
                </div>

                {/* Spray Coverage & 100% / 97% Tag Display */}
                <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Taux Pulvérisation Concession
                    </div>
                    <div className="text-2xl font-bold font-mono text-white flex items-center justify-end gap-2">
                      <span>{sprayCalc.rate}%</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${sprayCalc.tagBadgeClass} ${sprayCalc.is100Pct ? 'animate-tag-100' : ''}`}>
                        {sprayCalc.tagLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentPulvCount} / {currentTotalChambres} chambres pulvérisées · {sprayCalc.subText}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAllPulverisees}
                    disabled={isMarkingAll}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Marquer toutes les pièces comme traitées (100%)"
                  >
                    <span>Tout Pulvériser (100%)</span>
                  </button>
                </div>
              </div>

              {/* Room Cards Inspection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-emerald-700" />
                    <span>Inspection Chambre par Chambre ({roomStates.length} pièces recensées)</span>
                  </h2>
                  <span className="text-xs text-slate-500">
                    Opérateur : <b>{currentUser.nom}</b>
                  </span>
                </div>

                <div className="space-y-3">
                  {roomStates.map((room) => {
                    const isPulv = room.statut === 'pulvérisée';
                    return (
                      <div
                        key={room.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isPulv
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-white border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Room info */}
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-xs ${
                              isPulv ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                            }`}>
                              #{room.numero}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{room.type}</div>
                              <div className="text-[11px] text-slate-500">
                                État : <span className={`font-semibold ${isPulv ? 'text-emerald-700' : 'text-red-600'}`}>{room.statut}</span>
                              </div>
                            </div>
                          </div>

                          {/* Statut Toggle Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateRoomStatus(room.id, 'pulvérisée')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isPulv
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Pulvérisée (Traitée)
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateRoomStatus(room.id, 'non_pulvérisée')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                !isPulv
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Non Pulvérisée
                            </button>
                          </div>
                        </div>

                        {/* MANDATORY MOTIF SECTION IF NOT PULVERISEE */}
                        {!isPulv && (
                          <div className="mt-3 pt-3 border-t border-slate-200 bg-red-50/60 p-3 rounded-lg space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1 text-xs font-bold text-red-900">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>Motif Obligatoire de Non-Pulvérisation (Audit Médical SAG Koron) :</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                value={room.motif}
                                onChange={(e) => handleUpdateRoomMotif(room.id, e.target.value as MotifNonPulverisation)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-red-300 bg-white font-medium text-slate-900 focus:border-red-500 focus:outline-hidden"
                              >
                                <option value="refus_chef">{MOTIF_LABELS.refus_chef}</option>
                                <option value="absence">{MOTIF_LABELS.absence}</option>
                                <option value="porte_fermee">{MOTIF_LABELS.porte_fermee}</option>
                                <option value="chambre_verrouillee">{MOTIF_LABELS.chambre_verrouillee}</option>
                                <option value="encombrement">{MOTIF_LABELS.encombrement}</option>
                                <option value="autre">{MOTIF_LABELS.autre}</option>
                              </select>

                              <input
                                type="text"
                                placeholder="Détail ou justification (ex: clé emportée, refus pour odeur)..."
                                value={room.detail}
                                onChange={(e) => handleUpdateRoomDetail(room.id, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observations & Fast Action Buttons with Fluid Loading Spinners */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observations de terrain sur le passage (accueil, déplacement vivres, réceptivité) :
                  </label>
                  <input
                    type="text"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Remarques éventuelles de l'agent..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSavingSpray || isSavingNext}
                    onClick={() => handleSubmitSpray(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSavingSpray ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Calcul & Enregistrement...</span>
                      </>
                    ) : (
                      <span>Enregistrer cette Famille</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSavingSpray || isSavingNext}
                    onClick={() => handleSubmitSpray(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 shadow-sm transition-all cursor-pointer"
                  >
                    {isSavingNext ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Enregistrement & Suivant...</span>
                      </>
                    ) : (
                      <>
                        <span>Enregistrer & Famille Suivante</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          MODE 3: REGISTRE DU VILLAGE (BASE DES CALCULS DE L'APP)
          ===================================================================== */}
      {activeMode === 'registre' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          
          {/* Summary Banner for this Village */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-700" />
                Registre Recensé de {currentVillage?.nom} ({villageFamilles.length} Concessions)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chaque famille recensée constitue la base indivisible des calculs de couverture du village.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher chef ou code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Aggregate Demographic Counters of Enrolled Families */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Familles Enrôlées</div>
              <div className="text-lg font-bold font-mono text-slate-900">{totalEnrolledFamilies}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Chambres Totales</div>
              <div className="text-lg font-bold font-mono text-slate-900">{totalEnrolledRooms}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Population Dénombrée</div>
              <div className="text-lg font-bold font-mono text-emerald-700">{totalEnrolledPop} pers.</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-purple-700 uppercase font-semibold">Femmes Enceintes</div>
              <div className="text-lg font-bold font-mono text-purple-900">{totalEnrolledEnceintes}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-amber-700 uppercase font-semibold">Enfants 0-5 ans</div>
              <div className="text-lg font-bold font-mono text-amber-900">{totalEnrolledEnfants}</div>
            </div>
          </div>

          {/* Families Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="p-3">Code</th>
                    <th className="p-3">Chef de Famille & Concession</th>
                    <th className="p-3 text-center">Pièces (Chambres)</th>
                    <th className="p-3 text-center">Démographie (H/F/FE/Enf)</th>
                    <th className="p-3 text-center">Taux Pulvérisation</th>
                    <th className="p-3 text-center">Statut</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFamilies.map((f) => {
                    const famChambres = chambres.filter(c => c.famille_id === f.id);
                    const pulvCount = famChambres.filter(c => c.statut === 'pulvérisée').length;
                    const totChambres = f.nb_chambres_total || famChambres.length;
                    const calc = calculateSprayCoverage(totChambres, pulvCount);

                    return (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {f.code_famille}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{f.chef_famille}</div>
                          <div className="text-[11px] text-slate-500">{f.nom_concession || 'Concession'} · {f.contact}</div>
                        </td>
                        <td className="p-3 text-center font-mono font-semibold">
                          <span className="text-emerald-700">{pulvCount}</span> / {totChambres}
                        </td>
                        <td className="p-3 text-center font-mono text-[11px]">
                          {f.population_famille ? (
                            <span>
                              {f.population_famille.homme}H · {f.population_famille.femme}F · <b className="text-purple-700">{f.population_famille.femme_enceinte}FE</b> · <b className="text-amber-700">{f.population_famille.enfant_0_5}Enf</b>
                            </span>
                          ) : (
                            <span className="text-slate-400">Non renseigné</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${calc.tagBadgeClass}`}>
                            {calc.rate}% {calc.is100Pct ? '★ 100%' : calc.is97TargetReached ? 'TAG 97%' : ''}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[11px] font-medium text-slate-700">
                            {f.statut_famille}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectFamille(f.id);
                                setActiveMode('pulverisation');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Traiter
                            </button>

                            {currentUser.peut_supprimer && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Supprimer définitivement la famille ${f.chef_famille} et recalculer les totaux de ${currentVillage?.nom} ?`)) {
                                    deleteFamille(f.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Supprimer cette famille"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFamilies.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-xs text-slate-400">
                        Aucune famille ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : CRÉATION D'UN NOUVEAU VILLAGE / LOCALITÉ (ADMIN SEULEMENT)       */}
      {/* ========================================================================= */}
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
                    Privilège Administrateur · SAG Koron
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewVillageModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVillage} className="py-4 space-y-4">
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Enregistrement automatique dans tout le système :</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Dès sa validation, ce nouveau village sera immédiatement intégré au Tableau de bord, à la Cartographie, aux Rapports officiels et aux formulaires de saisie pour les <b>Superviseurs</b> et les <b>Agents de terrain</b>.
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
                    Concessions estimées
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

              {/* GPS Coordinates Siguiri Region */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Latitude (ex: 11.4325)
                  </label>
                  <input
                    type="text"
                    value={newVillageLat}
                    onChange={(e) => setNewVillageLat(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Longitude (ex: -9.1824)
                  </label>
                  <input
                    type="text"
                    value={newVillageLng}
                    onChange={(e) => setNewVillageLng(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewVillageModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingVillage || !newVillageNom.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {isCreatingVillage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Enregistrer & Activer le Village</span>
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
