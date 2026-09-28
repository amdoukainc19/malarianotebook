import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Shield,
  Wifi,
  WifiOff,
  UserCheck,
  LogOut,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

interface HeaderProps {
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin }) => {
  const {
    currentUser,
    users,
    switchUser,
    logout,
    isAuthenticated,
    isOnline,
    activeTab,
    setActiveTab,
    isModuleLoading,
  } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingUserId, setIsSwitchingUserId] = useState<number | null>(null);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
    }, 200);
  };

  const handleSwitchUser = (userId: number) => {
    setIsSwitchingUserId(userId);
    setTimeout(() => {
      switchUser(userId);
      setIsSwitchingUserId(null);
      setShowUserMenu(false);
    }, 250);
  };

  const getNavItems = () => {
    if (currentUser.role === "observateur") {
      return [{ id: "dashboard", label: "Tableau de bord" }];
    }

    if (currentUser.role === "superviseur") {
      return [
        { id: "dashboard", label: "Tableau de bord" },
        { id: "villages", label: "Fiches Villages" },
        { id: "saisie-irs", label: "Enrôlement & Chambres IRS" },
        { id: "saisie-excel", label: "Saisie Grille Excel" },
        { id: "rapports", label: "Rapports & Synthèses" },
      ];
    }

    if (currentUser.role === "agent") {
      return [
        { id: "saisie-irs", label: "Enrôlement & Pulvérisation IRS" },
        { id: "villages", label: "Fiches Villages" },
        { id: "saisie-excel", label: "Saisie Grille Excel" },
        { id: "rapports", label: "Rapports & Synthèses" },
        { id: "dashboard", label: "Tableau de bord" },
      ];
    }

    return [
      { id: "dashboard", label: "Tableau de bord" },
      { id: "villages", label: "Fiches Villages" },
      { id: "saisie-irs", label: "Enrôlement & Chambres IRS" },
      { id: "saisie-excel", label: "Saisie Grille Excel" },
      { id: "rapports", label: "Rapports & Synthèses" },
      { id: "entomologie", label: "Vecteurs" },
      { id: "prevention", label: "Préventions" },
      { id: "admin", label: "Administration" },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-300 shadow-md w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-2.5 text-left focus-visible:outline-hidden"
            >
              {/* Logo image SAG */}
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
                <img
                  src="/assets/images/sag.jpg"
                  alt="Logo SAG Siguiri"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 tracking-tight block leading-tight">
                  SAG Siguiri · IRS Malaria 2026
                </span>
                <span className="text-xs font-medium text-slate-700 block leading-tight mt-0.5">
                  Hôpital de Koron — Programme Paludisme
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {isActive && isModuleLoading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : null}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
              title={
                isOnline
                  ? "Connecté au serveur de l'Hôpital"
                  : "Mode hors-ligne actif (cache local)"
              }
            >
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">
                {isOnline ? "En ligne" : "Hors-ligne"}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                  {currentUser.nom.charAt(0)}
                </div>
                <div className="hidden sm:block text-xs">
                  <div className="font-semibold text-slate-800 truncate max-w-32.5 leading-tight">
                    {currentUser.nom}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">
                        {currentUser.nom}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          currentUser.actif
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {currentUser.actif ? "Actif" : "Désactivé"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {currentUser.matricule} · {currentUser.email}
                    </p>

                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold uppercase ${
                          currentUser.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : currentUser.role === "superviseur"
                              ? "bg-blue-100 text-blue-700"
                              : currentUser.role === "agent"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {currentUser.role}
                      </span>

                      {currentUser.role === "observateur" ? (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          Tableau de bord seul
                        </span>
                      ) : (
                        <>
                          <span
                            className={`px-1.5 py-0.5 rounded ${currentUser.peut_saisir ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-slate-100 text-slate-400 line-through"}`}
                          >
                            Saisie
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${currentUser.peut_telecharger ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-slate-100 text-slate-400 line-through"}`}
                          >
                            Téléchargement
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${currentUser.peut_partager ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-slate-100 text-slate-400 line-through"}`}
                          >
                            Partage
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${currentUser.peut_generer_rapports ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-slate-100 text-slate-400 line-through"}`}
                          >
                            Rapports
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Basculer d'espace de travail (Test RBAC)
                    </p>
                    {users.map((u) => {
                      const isThisSwitching = isSwitchingUserId === u.id;
                      return (
                        <button
                          key={u.id}
                          disabled={isSwitchingUserId !== null}
                          onClick={() => handleSwitchUser(u.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer ${
                            u.id === currentUser.id
                              ? "bg-slate-100 font-semibold text-slate-900"
                              : "text-slate-600 hover:bg-slate-50"
                          } ${isThisSwitching ? "bg-emerald-50 text-emerald-900" : ""}`}
                        >
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{u.nom}</span>
                              {!u.actif && (
                                <span className="text-[9px] px-1 bg-red-100 text-red-700 rounded font-bold">
                                  Bloqué
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {u.role.toUpperCase()}{" "}
                              {u.nom_village_assigne
                                ? `(${u.nom_village_assigne})`
                                : ""}{" "}
                              ·{" "}
                              {u.role === "observateur"
                                ? "Vue seule"
                                : `${u.peut_saisir ? "Saisie" : "No Saisie"}`}
                            </div>
                          </div>
                          {isThisSwitching ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                          ) : u.id === currentUser.id ? (
                            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab("connexion");
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Portail de Connexion Officiel
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-2xs transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 hover:shadow-xs active:scale-95"
              title="Se déconnecter et retourner à la page de connexion"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Déconnexion...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Se déconnecter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation subbar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                activeTab === item.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};