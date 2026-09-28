import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardView } from "./components/DashboardView";
import { VillagesView } from "./components/VillagesView";
import { LegacySprayEntry } from "./components/LegacySprayEntry";
import { RoomSprayEntry } from "./components/RoomSprayEntry";
import { ReportsView } from "./components/ReportsView";
import { EntomologyView } from "./components/EntomologyView";
import { AdminView } from "./components/AdminView";
import { PreventionView } from "./components/PreventionView";
import { LoginPage } from "./components/LoginPage";
import { LoginModal } from "./components/LoginModal";
import { ReportGenerationModal } from "./components/ReportGenerationModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ShieldAlert, UserX, ShieldCheck } from "lucide-react";

const AppContent: React.FC = () => {
  const {
    activeTab,
    currentUser,
    switchUser,
    users,
    isAuthenticated,
  } = useApp();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 1. Non authentifié → page de login
  if (!isAuthenticated || activeTab === "connexion") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-900 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8 selection:bg-emerald-200">
        <LoginPage />
      </div>
    );
  }

  // 2. Sécurité : currentUser doit exister
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
          <h1 className="text-lg font-bold">Session invalide</h1>
          <p className="text-xs text-slate-400">
            Aucun utilisateur courant. Veuillez vous reconnecter.
          </p>
        </div>
      </div>
    );
  }

  // 3. Compte désactivé
  if (!currentUser.actif) {
    const adminUser = users.find((u) => u.role === "admin") || users[0];
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <UserX className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider">
              Accès Suspendu · RBAC SAG
            </span>
            <h1 className="text-xl font-bold text-white mt-2">
              Compte Désactivé par l'Administrateur
            </h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Le compte de <b className="text-white">{currentUser.nom}</b>{" "}
              (Matricule:{" "}
              <span className="font-mono text-emerald-400">
                {currentUser.matricule}
              </span>
              , Rôle:{" "}
              <span className="uppercase font-semibold">
                {currentUser.role}
              </span>
              ) a été temporairement désactivé par l'Administration en chef de
              la SAG Siguiri.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 text-left text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Consignes d'accès :
            </div>
            <p className="text-[11px] text-slate-400">
              Veuillez vous rapprocher du Dr. Faremba Doumbouya à l'Hôpital de
              Koron pour la réactivation de vos privilèges de travail.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {adminUser && (
              <button
                onClick={() => switchUser(adminUser.id)}
                className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-slate-900" />
                Basculer vers le profil Administrateur (Dr. Faremba)
              </button>
            )}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-2 px-4 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
            >
              Connexion avec un autre identifiant
            </button>
          </div>
        </div>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </div>
    );
  }

  // 4. Observateur : uniquement Dashboard
  if (currentUser.role === "observateur") {
    return (
      <MainLayout onOpenLogin={() => setIsLoginModalOpen(true)}>
        <ErrorBoundary>
          <DashboardView />
        </ErrorBoundary>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </MainLayout>
    );
  }

  // 5. Rendu principal (admin / superviseur / agent)
  const isSuperviseur = currentUser.role === "superviseur";
  const isAdmin = currentUser.role === "admin";

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "villages":
        return <VillagesView />;
      case "saisie-excel":
        return <LegacySprayEntry />;
      case "saisie-irs":
        return <RoomSprayEntry />;
      case "rapports":
        return <ReportsView />;
      case "entomologie":
        return isSuperviseur ? <DashboardView /> : <EntomologyView />;
      case "prevention":
        return isAdmin ? <PreventionView /> : <DashboardView />;
      case "admin":
        return isSuperviseur ? <DashboardView /> : <AdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <MainLayout onOpenLogin={() => setIsLoginModalOpen(true)}>
      {/*  ErrorBoundary : affiche l'erreur à l'écran au lieu d'un blanc */}
      <ErrorBoundary>{renderActiveView()}</ErrorBoundary>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <ReportGenerationModal />
    </MainLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}