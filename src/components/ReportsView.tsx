import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { exportMainReportToExcel } from "../utils/exportExcel";
import { getHeatmapInfo } from "../utils/heatmap";
import {
  Download,
  Printer,
  Filter,
  ChevronRight,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";

export const ReportsView: React.FC = () => {
  const { villages, openReportModal, currentUser } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<
    "main" | "weekly" | "mensuel" | "trimestre" | "special"
  >("main");
  const [selectedMonth, setSelectedMonth] = useState<string>("06"); // Juin 2026
  const [selectedQuarter, setSelectedQuarter] = useState<string>("T2"); // Trimestre 2
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Calculated Totals for MAIN REPORT
  const totalStands = villages.reduce((acc, v) => acc + v.stands_pulverises, 0);
  const totalStructures = villages.reduce(
    (acc, v) => acc + v.structures_pulverisees,
    0,
  );
  const totalStructuresObj = villages.reduce(
    (acc, v) => acc + v.nb_structures_total,
    0,
  );
  const totalBoites = villages.reduce((acc, v) => acc + v.can_refills_total, 0);
  const totalHomme = villages.reduce((acc, v) => acc + v.pop_homme, 0);
  const totalFemme = villages.reduce((acc, v) => acc + v.pop_femme, 0);
  const totalEnceinte = villages.reduce(
    (acc, v) => acc + v.pop_femme_enceinte,
    0,
  );
  const totalEnfant = villages.reduce((acc, v) => acc + v.pop_enfant_0_5, 0);
  const totalGeneral = villages.reduce(
    (acc, v) => acc + v.pop_couverte_total,
    0,
  );

  const globalRate =
    totalStructuresObj > 0
      ? Number(((totalStructures / totalStructuresObj) * 100).toFixed(1))
      : 0;
  const globalHeatmap = getHeatmapInfo(globalRate);

  const totauxReport = {
    stands: totalStands,
    structures: totalStructures,
    structures_objectif: totalStructuresObj,
    boites: totalBoites,
    homme: totalHomme,
    femme: totalFemme,
    femme_enceinte: totalEnceinte,
    enfant_0_5: totalEnfant,
    total_population: totalGeneral,
    taux_couverture_global: globalRate,
    heatmap_global: globalHeatmap,
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportMainReportToExcel(villages, totauxReport);
      setIsExporting(false);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  // Special sites subset
  const specialSites = villages.filter(
    (v) => v.type === "SAG" || v.type === "Autre",
  );

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Rapports Officiels de Pulvérisation (IRS 2026)
          </h1>
          <p className="text-xs text-slate-500">
            Hôpital de Koron · Programme Paludisme & Maladies Vectorielles SAG
            Siguiri · Formats conformes au classeur Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.peut_generer_rapports && (
            <button
              onClick={() => openReportModal({ type: "global_coverage" })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Générateur Avancé (Page de Garde & Carousel)
            </button>
          )}
          {currentUser.peut_telecharger ? (
            <>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Génération du Classeur Excel...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter MAIN REPORT (Excel .xlsx)</span>
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer / PDF
              </button>
            </>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs border border-slate-200 font-medium">
              Téléchargements désactivés (RBAC)
            </span>
          )}
        </div>
      </div>

      {/* Subtabs for Reports Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 no-print">
        {[
          { id: "main", label: "MAIN REPORT (Synthèse Globale)" },
          { id: "weekly", label: "WEEKLY REPORT" },
          { id: "mensuel", label: "Rapports Mensuels (Janv - Déc)" },
          { id: "trimestre", label: "Rapports Trimestriels (T1 - T4)" },
          { id: "special", label: "Sites SAG & Structures Spéciales" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
              activeReportTab === tab.id
                ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : MAIN REPORT (EXACT TABLE WITH TOTALS VERIFIED)                 */}
      {/* ========================================================================= */}
      {activeReportTab === "main" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header title inside printable sheet */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-800">
                MALARIA NOTE BOOK 2026 · HÔPITAL DE KORON
              </div>
              <h2 className="text-base font-bold text-slate-900">
                MAIN REPORT — SYNTHÈSE GÉNÉRALE DE LA PULVÉRISATION
                INTRADOMICILIAIRE (IRS)
              </h2>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Insecticide : <b>Actellic 300cs (Pirimiphos-méthyl)</b> · Seuil
                d'Efficacité Requis : <b>97.0%</b>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${globalHeatmap.badgeBg}`}
              >
                {globalRate}% Couverture ({globalHeatmap.label})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">CODE</th>
                  <th className="py-2.5 px-3">VILLAGE / LOCALITÉ</th>
                  <th className="py-2.5 px-3 text-right">STAND</th>
                  <th className="py-2.5 px-3 text-right">STRUCTURES</th>
                  <th className="py-2.5 px-3 text-right">NBRE DE BOITES</th>
                  <th className="py-2.5 px-3 text-right">HOMME</th>
                  <th className="py-2.5 px-3 text-right">FEMME</th>
                  <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-950">
                    FEMME ENCEINTE
                  </th>
                  <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-950">
                    ENFANT 0-5 ANS
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900">
                    TOTAL POPULATION
                  </th>
                  <th className="py-2.5 px-3 text-center">TAUX (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {villages.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {v.code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {v.nom}
                      {v.type !== "village" && (
                        <span className="ml-1.5 text-[9px] uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          {v.type}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                      {v.stands_pulverises}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                      {v.structures_pulverisees}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {v.can_refills_total}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {v.pop_homme}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {v.pop_femme}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-900 bg-emerald-50/30">
                      {v.pop_femme_enceinte}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-900 bg-emerald-50/30">
                      {v.pop_enfant_0_5}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {v.pop_couverte_total}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${v.heatmap_structures.badgeBg}`}
                      >
                        {v.taux_structures_pct}%
                      </span>
                    </td>
                  </tr>
                ))}

                {/* TOTAL ROW (Exact figures from user's Excel prompt) */}
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-950">
                  <td className="py-3 px-3 font-mono">TOT</td>
                  <td className="py-3 px-3 uppercase tracking-wider text-emerald-400">
                    TOTAL GÉNÉRAL
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    {totalStands}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300 text-sm">
                    {totalStructures}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    {totalBoites}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    {totalHomme}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    {totalFemme}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    {totalEnceinte}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    {totalEnfant}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300 text-sm">
                    {totalGeneral}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-400">
                    {globalRate}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
            <div>
              Émis par : <b>Hôpital de Koron (SAG Siguiri)</b> · Médecin Chef :{" "}
              <b>Dr. Aboubacar Camara</b>
            </div>
            <div>
              Audit ID :{" "}
              <span className="font-mono text-[11px]">
                SAG-IRS-2026-REP-KORON
              </span>{" "}
              · Date : {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : WEEKLY REPORT                                                  */}
      {/* ========================================================================= */}
      {activeReportTab === "weekly" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                WEEKLY REPORT — Suivi Hebdomadaire de Progression
              </h2>
              <p className="text-xs text-slate-500">
                Synthèse consolidée des semaines d'intervention de la campagne
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                semaine: "Semaine 24 (10 - 16 Juin)",
                villages: "Fienkolen, Silabada",
                struct: 1425,
                pop: 2605,
                rate: 98.9,
                status: "Vert Foncé (≥97%)",
              },
              {
                semaine: "Semaine 25 (17 - 23 Juin)",
                villages: "Kolenda, Tintissabani, Fadako",
                struct: 2130,
                pop: 3885,
                rate: 98.6,
                status: "Vert Foncé (≥97%)",
              },
              {
                semaine: "Semaine 26 (24 - 30 Juin)",
                villages: "Kamagan, Daba, Torokoro, Diadaya",
                struct: 1950,
                pop: 3550,
                rate: 97.9,
                status: "Vert Foncé (≥97%)",
              },
              {
                semaine: "Semaine 27 (01 - 07 Juil)",
                villages: "Kolonda, Kourouni, Lenkekoro, SAG",
                struct: 2404,
                pop: 4465,
                rate: 97.5,
                status: "Vert Foncé (≥97%)",
              },
            ].map((w, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
              >
                <div className="text-xs font-bold text-slate-900">
                  {w.semaine}
                </div>
                <div className="text-[11px] text-slate-500">{w.villages}</div>
                <div className="text-lg font-bold font-mono text-emerald-800">
                  {w.struct} structures
                </div>
                <div className="text-xs text-slate-600">
                  Population : <b>{w.pop}</b> personnes
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-emerald-700">
                    {w.rate}%
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : RAPPORTS MENSUELS (JANVIER À DÉCEMBRE)                          */}
      {/* ========================================================================= */}
      {activeReportTab === "mensuel" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rapports Mensuels d'Intervention
              </h2>
              <p className="text-xs text-slate-500">
                Filtrage et bilan par mois civil de l'année 2026
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                Sélectionner le mois :
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold"
              >
                <option value="01">Janvier 2026</option>
                <option value="02">Février 2026</option>
                <option value="03">Mars 2026</option>
                <option value="04">Avril 2026</option>
                <option value="05">Mai 2026</option>
                <option value="06">Juin 2026 (Plein régime)</option>
                <option value="07">Juillet 2026</option>
                <option value="08">Août 2026</option>
                <option value="09">Septembre 2026</option>
                <option value="10">Octobre 2026</option>
                <option value="11">Novembre 2026</option>
                <option value="12">Décembre 2026</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">
              Rapport Consolidé du Mois de{" "}
              {selectedMonth === "06"
                ? "Juin"
                : selectedMonth === "07"
                  ? "Juillet"
                  : `Mois ${selectedMonth}`}{" "}
              2026
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              L'activité principale de pulvérisation IRS se déroule en
              pré-hivernage (Juin - Juillet) pour briser la chaîne de
              transmission anophélienne.
            </p>
            <div className="mt-4 inline-flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 text-xs font-mono">
              <span>
                Structures : <b>{selectedMonth === "06" ? "5 505" : "2 404"}</b>
              </span>
              <span>·</span>
              <span>
                Recharges : <b>{selectedMonth === "06" ? "1 016" : "444"}</b>{" "}
                boîtes
              </span>
              <span>·</span>
              <span>
                Pop : <b>{selectedMonth === "06" ? "10 040" : "4 465"}</b> pers.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 4 : RAPPORTS TRIMESTRIELS                                          */}
      {/* ========================================================================= */}
      {activeReportTab === "trimestre" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rapports Trimestriels d'Impact Vectoriel
              </h2>
              <p className="text-xs text-slate-500">
                Synthèse pour le comité de direction de SAG et le Ministère de
                la Santé
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedQuarter("T1")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${selectedQuarter === "T1" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                1er Trimestre (T1)
              </button>
              <button
                onClick={() => setSelectedQuarter("T2")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${selectedQuarter === "T2" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                2ème Trimestre (T2)
              </button>
              <button
                onClick={() => setSelectedQuarter("T3")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${selectedQuarter === "T3" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                3ème Trimestre (T3)
              </button>
              <button
                onClick={() => setSelectedQuarter("T4")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${selectedQuarter === "T4" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                4ème Trimestre (T4)
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/40 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-sm text-emerald-950">
              Bilan Synthétique Trimestre {selectedQuarter} 2026
            </div>
            <p>
              Couverture globale des concessions minières et villages riverains
              : <b>{globalRate}%</b>. Aucune recrudescence épidémique majeure
              signalée dans le périmètre d'action de l'Hôpital de Koron.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 5 : SITES SAG & STRUCTURES SPÉCIALES                               */}
      {/* ========================================================================= */}
      {activeReportTab === "special" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              Sites Spéciaux & SAG Offices
            </h2>
            <p className="text-xs text-slate-500">
              Installations industrielles, bureaux miniers SAG et structures
              périphériques
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Site / Structure</th>
                  <th className="py-2.5 px-3 text-right">Stands</th>
                  <th className="py-2.5 px-3 text-right">Structures Pulv.</th>
                  <th className="py-2.5 px-3 text-right">Objectif</th>
                  <th className="py-2.5 px-3 text-center">Taux</th>
                  <th className="py-2.5 px-3 text-right">Boîtes</th>
                  <th className="py-2.5 px-3 text-right">Population</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {specialSites.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {s.nom}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {s.stands_pulverises}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {s.structures_pulverisees}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {s.nb_structures_total}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold ${s.heatmap_structures.badgeBg}`}
                      >
                        {s.taux_structures_pct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {s.can_refills_total}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {s.pop_couverte_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
