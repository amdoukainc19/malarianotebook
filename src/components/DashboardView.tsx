import React from "react";
import { useApp } from "../context/AppContext";
import { LeafletMap } from "./LeafletMap";
import {
  Building2,
  Users,
  Flame,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  PlusCircle,
  FileSpreadsheet,
  Activity,
  Layers,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Camera,
  Eye,
  Lock,
  UserCheck,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const {
    villages,
    setActiveTab,
    setSelectedVillageId,
    openReportModal,
    currentUser,
  } = useApp();

  const isObservateur = currentUser.role === "observateur";

  // Aggregate Totals
  const totalStands = villages.reduce((acc, v) => acc + v.stands_pulverises, 0);
  const totalStructures = villages.reduce(
    (acc, v) => acc + v.structures_pulverisees,
    0,
  );
  const totalStructuresObj = villages.reduce(
    (acc, v) => acc + v.nb_structures_total,
    0,
  );
  const totalRefills = villages.reduce(
    (acc, v) => acc + v.can_refills_total,
    0,
  );
  const totalHomme = villages.reduce((acc, v) => acc + v.pop_homme, 0);
  const totalFemme = villages.reduce((acc, v) => acc + v.pop_femme, 0);
  const totalEnceinte = villages.reduce(
    (acc, v) => acc + v.pop_femme_enceinte,
    0,
  );
  const totalEnfant = villages.reduce((acc, v) => acc + v.pop_enfant_0_5, 0);
  const totalPopulation = villages.reduce(
    (acc, v) => acc + v.pop_couverte_total,
    0,
  );

  // Concessions (Familles) & Chambres/Maisons Aggregations
  const totalFamillesTot = villages.reduce(
    (acc, v) => acc + v.familles_totales,
    0,
  );
  const totalFamillesPulv = villages.reduce(
    (acc, v) => acc + v.familles_pulverisees,
    0,
  );
  const globalFamillesRate =
    totalFamillesTot > 0
      ? Number(((totalFamillesPulv / totalFamillesTot) * 100).toFixed(1))
      : 0;

  const totalFamillesCompletes = villages.reduce(
    (acc, v) =>
      acc + (v.familles_completes || Math.round(v.familles_pulverisees * 0.94)),
    0,
  );
  const totalFamillesPartielles = villages.reduce(
    (acc, v) =>
      acc +
      (v.familles_partielles ||
        Math.max(
          0,
          v.familles_pulverisees - Math.round(v.familles_pulverisees * 0.94),
        )),
    0,
  );
  const fullHousePct =
    totalFamillesPulv > 0
      ? Number(((totalFamillesCompletes / totalFamillesPulv) * 100).toFixed(1))
      : 0;

  const totalChambresTot = villages.reduce(
    (acc, v) => acc + v.chambres_totales,
    0,
  );
  const totalChambresPulv = villages.reduce(
    (acc, v) => acc + v.chambres_pulverisees,
    0,
  );
  const globalChambresRate =
    totalChambresTot > 0
      ? Number(((totalChambresPulv / totalChambresTot) * 100).toFixed(1))
      : 0;

  const ratioChambresFamille =
    totalFamillesTot > 0
      ? Number((totalChambresTot / totalFamillesTot).toFixed(2))
      : 5.0;

  const ratioHabitantsFamille =
    totalFamillesPulv > 0
      ? Number((totalPopulation / totalFamillesPulv).toFixed(1))
      : 0;

  const globalRate =
    totalStructuresObj > 0
      ? Number(((totalStructures / totalStructuresObj) * 100).toFixed(1))
      : 0;

  const villagesAtteints = villages.filter((v) => v.objectif_97_atteint).length;
  const villagesEnCours = villages.filter(
    (v) => v.taux_structures_pct >= 75 && v.taux_structures_pct < 97,
  ).length;
  const villagesSousAlerte = villages.filter((v) => v.taux_structures_pct < 75);
  const [openingVillageId, setOpeningVillageId] = React.useState<number | null>(null);

  const handleOpenVillage = (id: number) => {
    setOpeningVillageId(id);
    setSelectedVillageId(id);
    setActiveTab("villages");
    setTimeout(() => {
      setOpeningVillageId(null);
    }, 350);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Editorial Title Section - Full Width */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Supervision Épidémiologique IRS
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-600">
              Saison Active 2026
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Tableau de Bord Exécutif · Hôpital de Koron
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Société minière AngloGold Ashanti SAG Siguiri (Guinée) · Suivi
            intradomiciliaire chambre par chambre · Insecticide :{" "}
            <span className="font-semibold text-slate-700">Actellic 300cs</span>
          </p>
        </div>

        {/* Quick Action Buttons or Observateur Banner */}
        {isObservateur ? (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs shadow-2xs">
            <Eye className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <b>Espace Observateur :</b> Consultation seule du tableau de bord
              exécutif. Téléchargements et modifications désactivés.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser.peut_generer_rapports && (
              <button
                onClick={() => openReportModal({ type: "global_coverage" })}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                Générer un Rapport Officiel
              </button>
            )}

            {currentUser.peut_saisir && (
              <>
                <button
                  onClick={() => setActiveTab("saisie-irs")}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Enrôlement & Pulvérisation IRS
                </button>

                <button
                  onClick={() => setActiveTab("saisie-excel")}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Grille Excel (1→30)
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab("rapports")}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              MAIN REPORT
            </button>
          </div>
        )}
      </div>

      {/* Agent de Terrain Active Mission Callout */}
      {currentUser.role === "agent" && (
        <div className="w-full bg-linear-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-xl shadow-xs border border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Espace de Travail · Agent de Terrain ({currentUser.nom})
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Enrôlez les familles concession par concession avec leur démographie précise (Hommes, Femmes, Enceintes, 0-5 ans) et pulvérisez chambre par chambre pour alimenter les calculs au seuil cible de 97%.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("saisie-irs")}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer shrink-0"
          >
            Accéder à l'Enrôlement & Pulvérisation →
          </button>
        </div>
      )}

      {/* Primary KPI Grid (4 columns across full viewport width) */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Taux Global vs Objectif 97% */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Couverture Globale (IRS)
            </span>
            {!isObservateur && currentUser.peut_generer_rapports && (
              <button
                onClick={() => openReportModal({ type: "global_coverage" })}
                className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Générer Rapport Couverture Globale"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-bold font-mono text-slate-900">
              {globalRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / Obj. 97.0%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, globalRate)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between items-center">
            <span>
              {villagesAtteints} / {villages.length} villages ≥ 97%
            </span>
            {!isObservateur && currentUser.peut_generer_rapports ? (
              <button
                onClick={() => openReportModal({ type: "global_coverage" })}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Rapport Couverture →
              </button>
            ) : (
              <span className="text-slate-400">Objectif Koron</span>
            )}
          </div>
        </div>

        {/* Card 2: Structures & Concessions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs transition-all hover:border-slate-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Structures Pulvérisées
            </span>
            {!isObservateur && currentUser.peut_generer_rapports && (
              <button
                onClick={() => openReportModal({ type: "structures" })}
                className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Générer Rapport Structures"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-bold font-mono text-slate-900">
              {totalStructures.toLocaleString("fr-FR")}
            </span>
            <span className="text-xs text-slate-400">
              sur {totalStructuresObj.toLocaleString("fr-FR")}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Concessions / Stands :</span>
            <b className="text-slate-800 font-mono">
              {totalStands.toLocaleString("fr-FR")}
            </b>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium flex justify-between items-center">
            <span>
              {totalStructuresObj > 0
                ? ((totalStructures / totalStructuresObj) * 100).toFixed(1)
                : "0"}
              % validé
            </span>
            {!isObservateur && currentUser.peut_generer_rapports ? (
              <button
                onClick={() => openReportModal({ type: "structures" })}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Rapport Structures →
              </button>
            ) : (
              <span className="text-slate-400">Suivi structures</span>
            )}
          </div>
        </div>

        {/* Card 3: Can Refills (Recharges d'insecticide) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs transition-all hover:border-slate-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Recharges Insecticide
            </span>
            {!isObservateur && currentUser.peut_generer_rapports && (
              <button
                onClick={() => openReportModal({ type: "refills" })}
                className="p-1 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                title="Générer Rapport Recharges Insecticide"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-bold font-mono text-slate-900">
              {totalRefills.toLocaleString("fr-FR")}
            </span>
            <span className="text-xs text-slate-500">bidons (boîtes)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Formulation :</span>
            <span className="font-semibold text-slate-700">Actellic 300cs</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex justify-between items-center">
            <span>
              {totalStructures > 0
                ? (totalRefills / totalStructures).toFixed(2)
                : "0"}{" "}
              bidon / struct.
            </span>
            {!isObservateur && currentUser.peut_generer_rapports ? (
              <button
                onClick={() => openReportModal({ type: "refills" })}
                className="text-amber-700 font-semibold hover:underline cursor-pointer"
              >
                Rapport Stock →
              </button>
            ) : (
              <span className="text-slate-400">Stock Actellic</span>
            )}
          </div>
        </div>

        {/* Card 4: Population Protégée */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs transition-all hover:border-slate-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Population Protégée
            </span>
            {!isObservateur && currentUser.peut_generer_rapports && (
              <button
                onClick={() => openReportModal({ type: "population" })}
                className="p-1 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Générer Rapport Population Protégée"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl lg:text-4xl font-bold font-mono text-slate-900">
              {totalPopulation.toLocaleString("fr-FR")}
            </span>
            <span className="text-xs text-slate-500">habitants</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>
              Femmes enc. :{" "}
              <b className="text-slate-800 font-mono">{totalEnceinte}</b>
            </span>
            <span>
              0 – 5 ans :{" "}
              <b className="text-slate-800 font-mono">{totalEnfant}</b>
            </span>
          </div>
        </div>
      </div>

      {/* RAPPROCHEMENT STATISTIQUE & MATHÉMATIQUE : CONCESSIONS (FAMILLES) & CHAMBRES PULVÉRISÉES */}
      <div className="w-full bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-md border border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Analyse Croisée Concessions · Familles · Chambres
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-slate-300 font-mono">
                Cohérence Mathématique Terrain SAG
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Rapprochement Précis : Concessions Familiales Recensées & Chambres
              Pulvérisées (Seuil OMS 97%)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Dans chaque village d'intervention, les équipes pulvérisent les
              chambres (ou la concession entière) des familles recensées avec
              l'insecticide homologué Actellic 300cs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => openReportModal({ type: "structures" })}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              Rapport Concessions & Chambres
            </button>
          </div>
        </div>

        {/* 5 Analytical Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          {/* Col 1: Concessions / Familles */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Concessions (Familles)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono font-bold">
                {globalFamillesRate}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {totalFamillesPulv.toLocaleString("fr-FR")}
              </span>
              <span className="text-xs text-slate-400">
                / {totalFamillesTot.toLocaleString("fr-FR")} recensées
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>Taux Couverture :</span>
              <span className="text-emerald-400 font-bold">
                {globalFamillesRate}%
              </span>
            </div>
          </div>

          {/* Col 2: Maisons Entières (100% traitées) */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Maisons Entières (100%)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono font-bold">
                {fullHousePct}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {totalFamillesCompletes.toLocaleString("fr-FR")}
              </span>
              <span className="text-xs text-slate-400">concessions</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>Partiellement pulv. :</span>
              <span className="text-amber-400 font-bold">
                {totalFamillesPartielles} familles
              </span>
            </div>
          </div>

          {/* Col 3: Chambres / Pièces Totales */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Chambres Traitées (IRS)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono font-bold">
                {globalChambresRate}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {totalChambresPulv.toLocaleString("fr-FR")}
              </span>
              <span className="text-xs text-slate-400">
                / {totalChambresTot.toLocaleString("fr-FR")} cibles
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>Non traitées (refus/abs) :</span>
              <span className="text-rose-400 font-bold">
                {(totalChambresTot - totalChambresPulv).toLocaleString("fr-FR")}{" "}
                ch.
              </span>
            </div>
          </div>

          {/* Col 4: Ratio Pièces par Concession */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Ratio Ch. / Concession
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-300">
                {ratioChambresFamille}
              </span>
              <span className="text-xs text-slate-400">chambres / famille</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>Habitants / Concession :</span>
              <span className="text-cyan-300 font-bold">
                {ratioHabitantsFamille} hab/fam
              </span>
            </div>
          </div>

          {/* Col 5: Formules & Certifications */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Certification des Formules
              </div>
              <div className="mt-2 space-y-1 text-[10px] font-mono text-slate-300">
                <div className="truncate">
                  Tx Chambres ={" "}
                  <span className="text-emerald-400 font-bold">
                    {globalChambresRate}%
                  </span>{" "}
                  (≥ 97%)
                </div>
                <div className="truncate">
                  Tx Familles ={" "}
                  <span className="text-emerald-400 font-bold">
                    {globalFamillesRate}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1.5">
              Formules synchronisées avec la grille Excel (1→30) et fiches
              villages.
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH MAP SECTION (Cartographie Épidémiologique des Villages de Siguiri) */}
      <div
        id="epidemiological-map-container"
        className="w-full bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Cartographie Épidémiologique des Villages de Siguiri
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {villages.length} Localités
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Localisation spatiale en temps réel, niveaux de couverture IRS,
              satellite par défaut avec balises pulsantes et simulation live
              orbite
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                openReportModal({
                  type: "cartography_screenshot",
                  captureTargetId: "epidemiological-map-container",
                })
              }
              className="text-xs font-bold text-slate-900 hover:text-white bg-slate-100 hover:bg-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              Cliché & Rapport Spatial
            </button>

            <button
              onClick={() => setActiveTab("villages")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              Fiches villages <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Full Width Map */}
        <LeafletMap
          villages={villages}
          selectedVillageId={1}
          onSelectVillage={handleOpenVillage}
          onOpenVillageDetail={handleOpenVillage}
        />
      </div>

      {/* FULL-WIDTH SECTION BELOW THE MAP: Statut des Objectifs IRS & Avancement par Localité */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (4/12): Statut des Objectifs IRS (Seuil 97%) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Statut des Objectifs IRS
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Seuil cible 97.0%
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Category 1: Objectif >= 97% */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Objectif ≥ 97% atteint
                  </span>
                  <span className="font-bold font-mono text-base text-emerald-800">
                    {villagesAtteints}{" "}
                    <span className="text-xs font-normal">
                      / {villages.length}
                    </span>
                  </span>
                </div>
                <div className="mt-2 w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{
                      width: `${(villagesAtteints / villages.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-emerald-700 flex justify-between">
                  <span>Protection maximale validée</span>
                  <span>
                    {((villagesAtteints / villages.length) * 100).toFixed(0)}%
                    du territoire
                  </span>
                </div>
              </div>

              {/* Category 2: En cours (75% to 96.9%) */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    En cours (75% à 96.9%)
                  </span>
                  <span className="font-bold font-mono text-base text-amber-800">
                    {villagesEnCours}{" "}
                    <span className="text-xs font-normal">
                      / {villages.length}
                    </span>
                  </span>
                </div>
                <div className="mt-2 w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{
                      width: `${(villagesEnCours / villages.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-amber-700 flex justify-between">
                  <span>Pulvérisation active en cours</span>
                  <span>
                    {((villagesEnCours / villages.length) * 100).toFixed(0)}% du
                    territoire
                  </span>
                </div>
              </div>

              {/* Category 3: Sous vigilance (< 75%) */}
              <div className="p-3 rounded-xl bg-red-50 border border-red-200/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-red-900">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Sous vigilance (&lt; 75%)
                  </span>
                  <span className="font-bold font-mono text-base text-red-800">
                    {villagesSousAlerte.length}{" "}
                    <span className="text-xs font-normal">
                      / {villages.length}
                    </span>
                  </span>
                </div>
                <div className="mt-2 w-full bg-red-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{
                      width: `${(villagesSousAlerte.length / villages.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-red-700 flex justify-between">
                  <span>Priorité d'intervention</span>
                  <span>
                    {(
                      (villagesSousAlerte.length / villages.length) *
                      100
                    ).toFixed(0)}
                    % du territoire
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Protocole OMS / SAG Siguiri</span>
            <span className="font-semibold text-slate-700">Règle des 97%</span>
          </div>
        </div>

        {/* Right (8/12): Avancement par Localité (Multi-Column Detailed Grid of all villages) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  Avancement Détaillé par Localité
                </h3>
                <span className="text-[11px] text-slate-400">
                  Vue panoramique des 17 sites · Pastille verte/jaune/rouge
                  conforme Heatmap
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> %
                  Chambres
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> %
                  Familles
                </span>
              </div>
            </div>

            {/* Dense 2-column or 3-column list across 1920px */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-95 overflow-y-auto pr-1">
              {villages.map((v) => {
                if (isObservateur) {
                  return (
                    <div
                      key={v.id}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-2xs"
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {v.nom}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{v.code}</span>
                          <span>·</span>
                          <span>
                            {v.structures_pulverisees}/{v.nb_structures_total}{" "}
                            struct.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Pastille Chambres */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${v.heatmap_chambres.badgeBg}`}
                          title={`Taux Chambres: ${v.taux_chambres_pct}%`}
                        >
                          {v.taux_chambres_pct}%
                        </span>
                        {/* Pastille Familles */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${v.heatmap_familles.badgeBg}`}
                          title={`Taux Familles: ${v.taux_familles_pct}%`}
                        >
                          {v.taux_familles_pct}%
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={v.id}
                    disabled={openingVillageId !== null}
                    onClick={() => handleOpenVillage(v.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-2xs active:scale-98 ${
                      openingVillageId === v.id
                        ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                        : "border-slate-200/80 hover:border-emerald-600 hover:bg-emerald-50/30"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 truncate flex items-center gap-1.5">
                        <span>{v.nom}</span>
                        {openingVillageId === v.id && (
                          <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{v.code}</span>
                        <span>·</span>
                        <span>
                          {v.structures_pulverisees}/{v.nb_structures_total}{" "}
                          struct.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Pastille Chambres */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${v.heatmap_chambres.badgeBg}`}
                        title={`Taux Chambres: ${v.taux_chambres_pct}%`}
                      >
                        {v.taux_chambres_pct}%
                      </span>
                      {/* Pastille Familles */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${v.heatmap_familles.badgeBg}`}
                        title={`Taux Familles: ${v.taux_familles_pct}%`}
                      >
                        {v.taux_familles_pct}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Total localités répertoriées : <b>{villages.length}</b>
            </span>
            {!isObservateur ? (
              <button
                onClick={() => setActiveTab("villages")}
                className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ouvrir le tableau comparatif exhaustif →
              </button>
            ) : (
              <span className="text-slate-400 italic">
                Vue observateur · Consultation unique
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Demographic Breakdown Banner - Full Width */}
      <div className="w-full bg-slate-900 text-white p-5 rounded-xl shadow-xs">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                Couverture Démographique Consolidée
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                17 Villages Siguiri
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Agrégation conforme au classeur MALARIA NOTE BOOK 2026 de
              l'Hôpital de Koron (Hommes, Femmes, Enceintes, Enfants 0-5 ans)
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="border-r border-slate-800 pr-3">
              <div className="text-xl lg:text-2xl font-bold font-mono text-white">
                {totalHomme.toLocaleString("fr-FR")}
              </div>
              <div className="text-[11px] text-slate-400 uppercase">Hommes</div>
            </div>
            <div className="border-r border-slate-800 pr-3">
              <div className="text-xl lg:text-2xl font-bold font-mono text-white">
                {totalFemme.toLocaleString("fr-FR")}
              </div>
              <div className="text-[11px] text-slate-400 uppercase">Femmes</div>
            </div>
            <div className="border-r border-slate-800 pr-3">
              <div className="text-xl lg:text-2xl font-bold font-mono text-emerald-400">
                {totalEnceinte.toLocaleString("fr-FR")}
              </div>
              <div className="text-[11px] text-slate-400 uppercase">
                Enceintes
              </div>
            </div>
            <div className="border-r border-slate-800 pr-3">
              <div className="text-xl lg:text-2xl font-bold font-mono text-emerald-400">
                {totalEnfant.toLocaleString("fr-FR")}
              </div>
              <div className="text-[11px] text-slate-400 uppercase">
                0 – 5 Ans
              </div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-bold font-mono text-emerald-300">
                {totalPopulation.toLocaleString("fr-FR")}
              </div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Total Général
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
