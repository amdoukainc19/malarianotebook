import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { PlusCircle, CheckCircle2, FileText } from "lucide-react";

export const EntomologyView: React.FC = () => {
  const { vecteurs, villages, addVecteur, currentUser, openReportModal } =
    useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [villageId, setVillageId] = useState<number>(villages[0]?.id || 1);
  const [espece, setEspece] = useState<
    | "Anopheles gambiae"
    | "Anopheles funestus"
    | "Aedes aegypti"
    | "Culex quinquefasciatus"
    | "Autre"
  >("Anopheles gambiae");
  const [methode, setMethode] = useState<
    | "PSC (Pyrèthre Spray Catch)"
    | "HLC (Human Landing Catch)"
    | "CDC Light Trap"
    | "Larva Dipping"
  >("PSC (Pyrèthre Spray Catch)");
  const [dateCapture, setDateCapture] = useState<string>(
    new Date().toISOString().substring(0, 10),
  );
  const [quantite, setQuantite] = useState<number>(20);
  const [testSensibilite, setTestSensibilite] = useState<string>(
    "Actellic 300cs (Pirimiphos-méthyl)",
  );
  const [mortalitePct, setMortalitePct] = useState<number>(98.0);
  const [observations, setObservations] = useState<string>("");

  const totalAnopheles = vecteurs
    .filter((v) => v.espece.includes("Anopheles"))
    .reduce((a, b) => a + b.quantite, 0);

  const avgMortality =
    vecteurs.filter((v) => v.mortalite_pct !== undefined).length > 0
      ? (
          vecteurs.reduce((a, b) => a + (b.mortalite_pct || 0), 0) /
          vecteurs.filter((v) => v.mortalite_pct !== undefined).length
        ).toFixed(1)
      : "98.0";

  const handleSaveVecteur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.peut_saisir) {
      alert("Votre compte n'a pas le droit de saisie.");
      return;
    }

    const vNom = villages.find((v) => v.id === villageId)?.nom || "Inconnu";

    addVecteur({
      village_id: villageId,
      nom_village: vNom,
      espece,
      methode_capture: methode,
      date_capture: dateCapture,
      quantite,
      test_sensibilite: testSensibilite,
      mortalite_pct: mortalitePct,
      observations,
    });

    setShowAddModal(false);
    setObservations("");
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Surveillance Entomologique & Résistance Vectorielle
          </h1>
          <p className="text-xs text-slate-500">
            Suivi des vecteurs du paludisme (Anophèles) et bio-essais de
            sensibilité à l'Actellic 300cs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openReportModal({ type: "entomology" })}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-800" />
            Générer Rapport Bio-Efficacité
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={!currentUser.peut_saisir}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
              currentUser.peut_saisir
                ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Relevé Entomologique
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Total Spécimens Anophèles Capturés
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalAnopheles}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            An. gambiae s.l. et An. funestus (vecteurs majeurs)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Mortalité Moyenne Bio-Essais OMS
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {avgMortality}%
          </div>
          <p className="text-[11px] text-emerald-800 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sensibilité totale à
            Actellic 300cs (Pirimiphos)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Méthodes de Surveillance
          </div>
          <div className="text-xs font-medium text-slate-800 mt-2 space-y-1">
            <div>• PSC (Pyrèthre Spray Catch) - Concessions</div>
            <div>• HLC (Human Landing Catch) - Agressivité nocturne</div>
            <div>• Pièges lumineux CDC & Gîtes larvaires</div>
          </div>
        </div>
      </div>

      {/* Table of Entomology records */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Registre des Captures & Tests Entomologiques
          </h2>
          <p className="text-xs text-slate-500">
            Données collectées par l'équipe d'entomologie de l'Hôpital de Koron
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Village / Site</th>
                <th className="py-2.5 px-3">Espèce Identifiée</th>
                <th className="py-2.5 px-3">Méthode</th>
                <th className="py-2.5 px-3 text-right">Quantité</th>
                <th className="py-2.5 px-3 text-center">Test Sensibilité</th>
                <th className="py-2.5 px-3 text-center">Mortalité (%)</th>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-4">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vecteurs.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    {v.date_capture}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {v.nom_village}
                  </td>
                  <td className="py-2.5 px-3 italic font-serif font-medium text-slate-800">
                    {v.espece}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {v.methode_capture}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {v.quantite}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-700">
                    {v.test_sensibilite}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {v.mortalite_pct !== undefined ? (
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          v.mortalite_pct >= 98
                            ? "bg-emerald-100 text-emerald-800"
                            : v.mortalite_pct >= 90
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {v.mortalite_pct}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{v.nom_agent}</td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {v.observations || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Record */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Nouveau Relevé Entomologique
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Saisie des captures et tests de susceptibilité
            </p>

            <form onSubmit={handleSaveVecteur} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Village
                </label>
                <select
                  value={villageId}
                  onChange={(e) => setVillageId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Espèce
                  </label>
                  <select
                    value={espece}
                    onChange={(e) => setEspece(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-serif italic"
                  >
                    <option value="Anopheles gambiae">Anopheles gambiae</option>
                    <option value="Anopheles funestus">
                      Anopheles funestus
                    </option>
                    <option value="Aedes aegypti">Aedes aegypti</option>
                    <option value="Culex quinquefasciatus">
                      Culex quinquefasciatus
                    </option>
                    <option value="Autre">Autre espèce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Méthode de Capture
                  </label>
                  <select
                    value={methode}
                    onChange={(e) => setMethode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  >
                    <option value="PSC (Pyrèthre Spray Catch)">
                      PSC (Pyrèthre Spray Catch)
                    </option>
                    <option value="HLC (Human Landing Catch)">
                      HLC (Human Landing Catch)
                    </option>
                    <option value="CDC Light Trap">CDC Light Trap</option>
                    <option value="Larva Dipping">Larva Dipping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={dateCapture}
                    onChange={(e) => setDateCapture(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantité (spécimens)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantite}
                    onChange={(e) => setQuantite(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mortalité (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={mortalitePct}
                    onChange={(e) => setMortalitePct(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test de Sensibilité / Insecticide
                </label>
                <input
                  type="text"
                  value={testSensibilite}
                  onChange={(e) => setTestSensibilite(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarques
                </label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Élevage larves, stade gonadotrope..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Sauvegarder le Relevé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
