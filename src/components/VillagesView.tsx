import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportVillageSheetToExcel } from '../utils/exportExcel';
import { 
  Building2, Users, Flame, ArrowUpDown, 
  Search, Download, Printer, CheckCircle2, 
  XCircle, Clock, ChevronRight, FileText
} from 'lucide-react';

export const VillagesView: React.FC = () => {
  const { villages, selectedVillageId, setSelectedVillageId, familles, chambres, dailySprays, setActiveTab, openReportModal } = useApp();
  
  const [viewMode, setViewMode] = useState<'comparatif' | 'fiche'>('comparatif');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'chambres' | 'familles' | 'nom' | 'structures'>('chambres');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  const selectedVillage = villages.find(v => v.id === selectedVillageId) || villages[0];

  const handleSwitchViewMode = (mode: 'comparatif' | 'fiche') => {
    if (mode === viewMode) return;
    setIsSwitchingMode(true);
    setViewMode(mode);
    setTimeout(() => {
      setIsSwitchingMode(false);
    }, 200);
  };

  const handleExportVillage = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportVillageSheetToExcel(selectedVillage, villageFamilles);
      setIsExporting(false);
    }, 350);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 250);
  };
  const filteredVillages = villages
    .filter(v => v.nom.toLowerCase().includes(searchTerm.toLowerCase()) || v.code.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let valA: any = a.taux_chambres_pct;
      let valB: any = b.taux_chambres_pct;
      if (sortBy === 'familles') {
        valA = a.taux_familles_pct;
        valB = b.taux_familles_pct;
      } else if (sortBy === 'nom') {
        valA = a.nom;
        valB = b.nom;
      } else if (sortBy === 'structures') {
        valA = a.structures_pulverisees;
        valB = b.structures_pulverisees;
      }
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  // Village specific families and chambers
  const villageFamilles = familles.filter(f => f.village_id === selectedVillage.id);
  const villageSprays = dailySprays.filter(s => s.village_id === selectedVillage.id);

  // Reasons breakdown for this village
  const villageChambres = chambres.filter(c => {
    const fam = familles.find(f => f.id === c.famille_id);
    return fam && fam.village_id === selectedVillage.id;
  });

  const refusalStats = {
    refus_chef: villageChambres.filter(c => c.motif_non_pulverisation === 'refus_chef').length,
    absence: villageChambres.filter(c => c.motif_non_pulverisation === 'absence').length,
    porte_fermee: villageChambres.filter(c => c.motif_non_pulverisation === 'porte_fermee').length,
    chambre_verrouillee: villageChambres.filter(c => c.motif_non_pulverisation === 'chambre_verrouillee').length,
    encombrement: villageChambres.filter(c => c.motif_non_pulverisation === 'encombrement').length,
    autre: villageChambres.filter(c => c.motif_non_pulverisation === 'autre').length,
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* View Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSwitchViewMode('comparatif')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              viewMode === 'comparatif'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {isSwitchingMode && viewMode === 'comparatif' && (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <span>Rapport Comparatif Multi-Villages</span>
          </button>
          <button
            onClick={() => handleSwitchViewMode('fiche')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              viewMode === 'fiche'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {isSwitchingMode && viewMode === 'fiche' && (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <span>Fiche Village Détaillée ({selectedVillage.nom})</span>
          </button>
        </div>

        {viewMode === 'comparatif' ? (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un village..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-600"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={selectedVillage.id}
              onChange={(e) => setSelectedVillageId(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white"
            >
              {villages.map(v => (
                <option key={v.id} value={v.id}>{v.nom} ({v.taux_chambres_pct}%)</option>
              ))}
            </select>
            <button
              onClick={handleExportVillage}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Export en cours...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-all cursor-pointer active:scale-95"
            >
              {isPrinting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Impression...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / PDF</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VUE 1 : RAPPORT COMPARATIF MULTI-VILLAGES (MODULE 12.5)                  */}
      {/* ========================================================================= */}
      {viewMode === 'comparatif' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rapport Comparatif Multi-Villages (IRS 2026)</h2>
              <p className="text-xs text-slate-500">
                Suivi conjoint de la règle des 97% : indicateur principal (% Chambres) et secondaire (% Familles)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Trier par :</span>
              <button 
                onClick={() => { setSortBy('chambres'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${sortBy === 'chambres' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                % Chambres <ArrowUpDown className="w-3 h-3" />
              </button>
              <button 
                onClick={() => { setSortBy('familles'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${sortBy === 'familles' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                % Familles <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Village / Site</th>
                  <th className="py-3 px-3 text-right">Familles Tot.</th>
                  <th className="py-3 px-3 text-right">Familles Pulv.</th>
                  <th className="py-3 px-3 text-center">Taux Familles</th>
                  <th className="py-3 px-3 text-right">Chambres Tot.</th>
                  <th className="py-3 px-3 text-right">Chambres Pulv.</th>
                  <th className="py-3 px-3 text-center">Taux Chambres (IRS)</th>
                  <th className="py-3 px-3 text-right">Pop. Couverte</th>
                  <th className="py-3 px-3 text-right">Recharges</th>
                  <th className="py-3 px-3 text-center">Dernière Interv.</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVillages.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[10px] w-6">{v.code}</span>
                      <span>{v.nom}</span>
                      {v.type !== 'village' && (
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {v.type}
                        </span>
                      )}
                    </td>

                    {/* Familles */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{v.familles_totales}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-900 font-medium">{v.familles_pulverisees}</td>
                    <td className="py-3 px-3 text-center">
                      <span 
                        className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${v.heatmap_familles.badgeBg}`}
                        title={v.heatmap_familles.label}
                      >
                        {v.taux_familles_pct}%
                      </span>
                    </td>

                    {/* Chambres */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{v.chambres_totales}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-900 font-medium">{v.chambres_pulverisees}</td>
                    <td className="py-3 px-3 text-center">
                      <span 
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold shadow-2xs ${v.heatmap_chambres.badgeBg}`}
                        title={v.heatmap_chambres.label}
                      >
                        {v.taux_chambres_pct}%
                      </span>
                    </td>

                    {/* Population & Recharges */}
                    <td className="py-3 px-3 text-right font-mono text-slate-800">{v.pop_couverte_total.toLocaleString('fr-FR')}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{v.can_refills_total}</td>
                    
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {v.derniere_intervention || '-'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedVillageId(v.id);
                          setViewMode('fiche');
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 justify-center"
                      >
                        Détails <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : FICHE VILLAGE STATISTIQUES DÉTAILLÉES (MODULE 12.4)             */}
      {/* ========================================================================= */}
      {viewMode === 'fiche' && (
        <div className="space-y-6">
          
          {/* En-tête Fiche Village */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  {selectedVillage.code}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedVillage.nom}</h2>
                <span className="text-xs text-slate-500">· Hôpital de Koron SAG Siguiri</span>
              </div>
              <p className="text-xs text-slate-500">
                Coordonnées GPS : {selectedVillage.latitude}° N, {selectedVillage.longitude}° W · Type : {selectedVillage.type}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase">Statut IRS Règle des 97%</div>
                <div className="text-sm font-bold flex items-center gap-1.5 justify-end">
                  {selectedVillage.taux_chambres_pct >= 97.0 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Objectif Atteint ({selectedVillage.taux_chambres_pct}%)
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> En cours ({selectedVillage.taux_chambres_pct}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => openReportModal({ type: 'structures', villageId: selectedVillage.id })}
                  className="px-3 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  Rapport Officiel Village
                </button>

                <button
                  onClick={() => setActiveTab('saisie-irs')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  + Saisir Chambre par Chambre
                </button>
              </div>
            </div>
          </div>

          {/* Cartes KPI Village */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI Chambres */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Chambres Pulvérisées</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">{selectedVillage.chambres_pulverisees}</span>
                <span className="text-xs text-slate-400">/ {selectedVillage.chambres_totales}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                Taux Chambres : {selectedVillage.taux_chambres_pct}%
              </div>
            </div>

            {/* KPI Familles */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Familles Couvertes</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">{selectedVillage.familles_pulverisees}</span>
                <span className="text-xs text-slate-400">/ {selectedVillage.familles_totales}</span>
              </div>
              <div className="mt-1 text-xs font-bold text-emerald-700">
                Taux Familles : {selectedVillage.taux_familles_pct}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Maisons entières : <b>{selectedVillage.familles_completes || Math.round(selectedVillage.familles_pulverisees * 0.94)}</b> (100%) · Ratio : <b>{selectedVillage.ratio_chambres_famille || Number((selectedVillage.chambres_totales / selectedVillage.familles_totales).toFixed(1))}</b> ch./fam
              </div>
            </div>

            {/* KPI Population */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Population Protégée</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">{selectedVillage.pop_couverte_total}</span>
                <span className="text-xs text-slate-400">habitants</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Enceintes: {selectedVillage.pop_femme_enceinte} · 0-5 ans: {selectedVillage.pop_enfant_0_5}
              </div>
            </div>

            {/* KPI Recharges */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Recharges Insecticide</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">{selectedVillage.can_refills_total}</span>
                <span className="text-xs text-slate-400">boîtes</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Stands: {selectedVillage.stands_pulverises} concessions
              </div>
            </div>
          </div>

          {/* Jauge 97% & Motifs de Refus */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Jauge circulaire / Progression vers 97% */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Objectif 97% IRS (Chambres)</h3>
                <p className="text-xs text-slate-500">Seuil de coupure de la transmission vectorielle</p>
              </div>

              <div className="my-6 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={selectedVillage.taux_chambres_pct >= 97 ? 'text-emerald-700' : 'text-green-500'}
                      strokeDasharray={`${selectedVillage.taux_chambres_pct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      {selectedVillage.taux_chambres_pct}%
                    </span>
                    <span className="text-[10px] text-slate-400">Objectif 97%</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                {selectedVillage.taux_chambres_pct >= 97.0 ? (
                  <span className="text-emerald-700 font-semibold">
                    ✔ Objectif OMS / SAG atteint pour ce village
                  </span>
                ) : (
                  <span>
                    Il reste <b>{Math.max(0, Math.ceil(selectedVillage.chambres_totales * 0.97) - selectedVillage.chambres_pulverisees)}</b> chambres à pulvériser pour atteindre les 97%.
                  </span>
                )}
              </div>
            </div>

            {/* Répartition des Motifs de Non-Pulvérisation */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Motifs de Refus & Non-Pulvérisation</h3>
              <p className="text-xs text-slate-500 mb-4">Analyse des causes empêchant la couverture complète</p>

              <div className="space-y-2.5">
                {[
                  { label: 'Refus du chef de famille', count: refusalStats.refus_chef, color: 'bg-red-500' },
                  { label: 'Absence des occupants', count: refusalStats.absence, color: 'bg-amber-500' },
                  { label: 'Porte fermée', count: refusalStats.porte_fermee, color: 'bg-orange-500' },
                  { label: 'Chambre verrouillée', count: refusalStats.chambre_verrouillee, color: 'bg-blue-500' },
                  { label: 'Chambre trop encombrée', count: refusalStats.encombrement, color: 'bg-purple-500' },
                  { label: 'Autre motif', count: refusalStats.autre, color: 'bg-slate-400' }
                ].map((item, idx) => {
                  const totalRefus = Object.values(refusalStats).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((item.count / totalRefus) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="font-mono text-slate-900 font-medium">{item.count} cas ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Tableau des Familles du Village */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Familles & Concessions Enregistrées ({villageFamilles.length})</h3>
                <p className="text-xs text-slate-500">Détail des chambres visitées par famille</p>
              </div>
              <button
                onClick={() => setActiveTab('saisie-irs')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 no-print"
              >
                + Ajouter un passage
              </button>
            </div>

            {villageFamilles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucune fiche famille saisie pour ce village dans l'échantillon. Cliquez sur "Saisie IRS Chambres" pour en ajouter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Code Famille</th>
                      <th className="py-2.5 px-3">Chef de Famille</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3 text-center">Chambres Tot.</th>
                      <th className="py-2.5 px-3 text-center">Pulvérisées</th>
                      <th className="py-2.5 px-3 text-center">Statut IRS</th>
                      <th className="py-2.5 px-3 text-center">Dernier Passage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {villageFamilles.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{f.code_famille}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{f.chef_famille}</td>
                        <td className="py-2.5 px-3 text-slate-500">{f.contact || '-'}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{f.nb_chambres_total}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {f.chambres_pulverisees} / {f.nb_chambres_total}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            f.statut_famille === 'Pulvérisée complètement' ? 'bg-emerald-100 text-emerald-800' :
                            f.statut_famille === 'Partiellement pulvérisée' ? 'bg-amber-100 text-amber-800' :
                            f.statut_famille === 'Refusée' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {f.statut_famille}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                          {f.date_dernier_passage || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
