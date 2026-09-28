import React from "react";
import { Header } from "../Header";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, ShieldAlert, Eye, UserCheck, Check, X, Shield, Lock } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  onOpenLogin: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onOpenLogin,
}) => {
  const { currentUser, setActiveTab, activeTab, isModuleLoading } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 w-full overflow-x-hidden relative">
      {/* Top Loading Progress Bar on Module & Tab Switch */}
      {isModuleLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-emerald-950/20">
          <div className="h-full bg-linear-to-r from-emerald-500 via-teal-300 to-emerald-600 animate-pulse w-full shadow-sm" />
        </div>
      )}

      {/* Floating Module Loading Indicator */}
      {isModuleLoading && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Chargement du module en cours...</span>
        </div>
      )}

      {/* Top Header - Full Width */}
      <Header onOpenLogin={onOpenLogin} />

      {/* Role-Specific Workspace Banner */}
      <div className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-2 no-print shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {/* Left: Role identification */}
          <div className="flex items-center gap-2.5">
            {currentUser.role === "admin" && (
              <div className="flex items-center gap-2 text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Espace Administrateur en Chef · Droits Intégraux & Module Préventions</span>
              </div>
            )}

            {currentUser.role === "superviseur" && (
              <div className="flex items-center gap-2 text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md font-semibold">
                <Shield className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Espace Superviseur · Actions sous l'autorité de l'Admin (Admin & Vecteurs verrouillés)</span>
              </div>
            )}

            {currentUser.role === "observateur" && (
              <div className="flex items-center gap-2 text-slate-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md font-bold">
                <Eye className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Espace Observateur · Visiteur Simple · Consultation exclusive du Tableau de Bord</span>
              </div>
            )}

            {currentUser.role === "agent" && (
              <div className="flex items-center gap-2 text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Espace Agent de Terrain · Enrôlement des Familles & Pulvérisation IRS (Socle des Calculs)</span>
              </div>
            )}

            <span className="text-slate-400 hidden md:inline">|</span>
            <span className="text-slate-600 hidden md:inline text-[11px]">
              Session : <b className="text-slate-800">{currentUser.nom}</b> ({currentUser.matricule})
            </span>
          </div>

          {/* Right: Granular privilege status pills */}
          <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mr-1 hidden lg:inline">
              Privilèges accordés :
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                currentUser.peut_saisir
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 line-through"
              }`}
            >
              {currentUser.peut_saisir ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              Saisie
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                currentUser.peut_generer_rapports
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 line-through"
              }`}
            >
              {currentUser.peut_generer_rapports ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              Rapports
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                currentUser.peut_telecharger
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 line-through"
              }`}
            >
              {currentUser.peut_telecharger ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              Téléchargement
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                currentUser.peut_partager
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 line-through"
              }`}
            >
              {currentUser.peut_partager ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              Partage
            </span>

            {currentUser.role === "admin" && (
              <>
                <button
                  onClick={() => setActiveTab("prevention")}
                  className="ml-2 px-2 py-0.5 rounded bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors cursor-pointer text-[10px]"
                >
                  Préventions (5p) →
                </button>
                <button
                  onClick={() => setActiveTab("admin")}
                  className="ml-1 px-2 py-0.5 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors cursor-pointer text-[10px]"
                >
                  Gérer les accès →
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Container - Full Width across 1920px+ monitors with standardized high-density padding */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 transition-all">
        <div key={activeTab} className="w-full animate-in fade-in-50 duration-300">
          {children}
        </div>
      </main>

      {/* Footer - Full Width */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 text-xs text-slate-500 no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-semibold text-slate-800">
              Programme National de Lutte contre le Paludisme & IRS (PID)
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Hôpital de Koron · AngloGold Ashanti SAG Siguiri (Guinée)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>
              Version Système :{" "}
              <b className="text-slate-700">2026.1 (Full-Width Pro)</b>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Opérateur : <b className="text-emerald-800">{currentUser.nom}</b> (
              {currentUser.role.toUpperCase()})
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">Insecticide Actellic 300cs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
