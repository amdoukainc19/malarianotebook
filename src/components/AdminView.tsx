import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UserRole, User, UserPrivileges } from "../types";
import {
  Users,
  Shield,
  Lock,
  Unlock,
  PlusCircle,
  Search,
  ShieldAlert,
  FileText,
  CheckCircle2,
  XCircle,
  Check,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Download,
  Share2,
  FileSpreadsheet,
  Edit3,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Info,
  Sparkles,
  MapPin,
  Building2,
  UserCheck,
  UserX,
  Flame,
  ArrowRight,
} from "lucide-react";

export const AdminView: React.FC = () => {
  const {
    users,
    currentUser,
    toggleUserActive,
    updateUserPrivileges,
    updateUser,
    addUser,
    addVillage,
    auditLogs,
    villages,
    openReportModal,
    setActiveTab,
    preventionItems,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    "users" | "villages" | "audit" | "config"
  >("users");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddVillageModal, setShowAddVillageModal] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "superviseur" | "agent" | "observateur" | "actif" | "inactif"
  >("all");

  // Admin Notification Toast
  const [adminToast, setAdminToast] = useState<{
    text: string;
    type: "success" | "warning";
  } | null>(null);

  const showToast = (text: string, type: "success" | "warning" = "success") => {
    setAdminToast({ text, type });
    setTimeout(() => {
      setAdminToast(null);
    }, 4500);
  };

  // Privilege allocation modal state
  const [selectedUserForPrivileges, setSelectedUserForPrivileges] =
    useState<User | null>(null);
  const [tempPrivileges, setTempPrivileges] = useState<UserPrivileges>({
    peut_saisir: true,
    peut_telecharger: true,
    peut_exporter: true,
    peut_partager: true,
    peut_generer_rapports: true,
    peut_modifier: true,
    peut_supprimer: false,
  });

  // New user form state
  const [nom, setNom] = useState("");
  const [matricule, setMatricule] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("superviseur");
  const [villageAssigne, setVillageAssigne] = useState<number | null>(null);
  const [newUserPrivileges, setNewUserPrivileges] = useState<UserPrivileges>({
    peut_saisir: true,
    peut_telecharger: true,
    peut_exporter: true,
    peut_partager: true,
    peut_generer_rapports: true,
    peut_modifier: true,
    peut_supprimer: false,
  });

  // New Village Form State (Admin)
  const [vNom, setVNom] = useState("");
  const [vCode, setVCode] = useState("");
  const [vType, setVType] = useState<"village" | "SAG" | "Autre">("village");
  const [vStructures, setVStructures] = useState(300);
  const [vStands, setVStands] = useState(85);
  const [vLat, setVLat] = useState("11.4325");
  const [vLng, setVLng] = useState("-9.1824");
  const [vAgentId, setVAgentId] = useState<number | null>(null);

  const isAdmin = currentUser.role === "admin";

  const handleToggleUserActive = (u: User) => {
    if (!isAdmin) {
      alert("Seul l'Administrateur peut activer ou désactiver les comptes.");
      return;
    }
    if (u.id === currentUser.id) {
      alert("Impossible de désactiver votre propre compte Administrateur.");
      return;
    }
    const nextStatus = !u.actif;
    toggleUserActive(u.id);
    if (nextStatus) {
      showToast(
        `Le compte de ${u.nom} (${u.role.toUpperCase()}) a été ACTIVÉ avec succès. L'accès opérationnel lui est accordé.`,
        "success",
      );
    } else {
      showToast(
        `Le compte de ${u.nom} (${u.role.toUpperCase()}) a été DÉSACTIVÉ avec succès. Ses accès et formulaires sont immédiatement bloqués.`,
        "warning",
      );
    }
  };

  // Open Privilege Allocation Modal
  const handleOpenPrivilegeModal = (user: User) => {
    setSelectedUserForPrivileges(user);
    setTempPrivileges({
      peut_saisir: user.peut_saisir,
      peut_telecharger: user.peut_telecharger,
      peut_exporter: user.peut_telecharger,
      peut_partager: user.peut_partager,
      peut_generer_rapports: user.peut_generer_rapports,
      peut_modifier: user.peut_modifier,
      peut_supprimer: user.peut_supprimer,
    });
  };

  const handleSavePrivileges = () => {
    if (!selectedUserForPrivileges) return;
    updateUserPrivileges(selectedUserForPrivileges.id, tempPrivileges);
    showToast(
      `Privilèges de travail mis à jour pour ${selectedUserForPrivileges.nom}.`,
      "success",
    );
    setSelectedUserForPrivileges(null);
  };

  const handleAssignVillageToUser = (userId: number, villageId: number | null) => {
    const v = villages.find((item) => item.id === villageId);
    updateUser(userId, {
      village_assigne_id: villageId,
      nom_village_assigne: v ? v.nom : undefined,
    });
    showToast(
      v
        ? `Localité d'intervention affectée : ${v.nom}.`
        : "Localité retirée pour cet utilisateur.",
      "success",
    );
  };

  const handleCreateVillageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!vNom.trim()) {
      alert("Veuillez renseigner le nom de la localité.");
      return;
    }

    const { village } = addVillage({
      nom: vNom.trim(),
      code: vCode.trim() || vNom.trim().substring(0, 4).toUpperCase(),
      type: vType,
      nb_structures_total: Number(vStructures) || 300,
      nb_stands_total: Number(vStands) || Math.round((Number(vStructures) || 300) / 3.5),
      latitude: Number(vLat) || 11.4325,
      longitude: Number(vLng) || -9.1824,
    });

    if (vAgentId) {
      updateUser(vAgentId, {
        village_assigne_id: village.id,
        nom_village_assigne: village.nom,
      });
    }

    setShowAddVillageModal(false);
    setVNom("");
    setVCode("");
    showToast(
      `Localité "${village.nom}" (${village.code}) créée avec succès dans tout le système ! Immédiatement visible par le Superviseur et les Agents.`,
      "success",
    );
  };

  const handleRoleChangeForNewUser = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "observateur") {
      setNewUserPrivileges({
        peut_saisir: false,
        peut_telecharger: false,
        peut_exporter: false,
        peut_partager: false,
        peut_generer_rapports: false,
        peut_modifier: false,
        peut_supprimer: false,
      });
    } else if (newRole === "superviseur") {
      setNewUserPrivileges({
        peut_saisir: true,
        peut_telecharger: true,
        peut_exporter: true,
        peut_partager: true,
        peut_generer_rapports: true,
        peut_modifier: true,
        peut_supprimer: false,
      });
    } else if (newRole === "agent") {
      setNewUserPrivileges({
        peut_saisir: true,
        peut_telecharger: true,
        peut_exporter: true,
        peut_partager: false,
        peut_generer_rapports: false,
        peut_modifier: false,
        peut_supprimer: false,
      });
    } else if (newRole === "admin") {
      setNewUserPrivileges({
        peut_saisir: true,
        peut_telecharger: true,
        peut_exporter: true,
        peut_partager: true,
        peut_generer_rapports: true,
        peut_modifier: true,
        peut_supprimer: true,
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    addUser({
      nom,
      matricule,
      email,
      role,
      village_assigne_id: villageAssigne,
      peut_saisir: newUserPrivileges.peut_saisir,
      privileges: newUserPrivileges,
    });

    setShowAddUserModal(false);
    setNom("");
    setMatricule("");
    setEmail("");
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.nom_utilisateur.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()),
  );

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider">
              Administration en Chef & Sécurité RBAC
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-600">
              Autorité Centrale
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Espace d'Administration · Gestion des Rôles & Privilèges
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hôpital de Koron · Activation / désactivation des comptes
            (Superviseur, Observateur) et attribution précise des droits de
            travail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("prevention")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
          
            Module Préventions ({preventionItems.length} fiches)
          </button>

          <button
            type="button"
            onClick={() => openReportModal({ type: "audit_rbac" })}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-800" />
            Générer Rapport Audit & Sécurité
          </button>

          {activeAdminTab === "users" && (
            <button
              onClick={() => setShowAddUserModal(true)}
              disabled={!isAdmin}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
                isAdmin
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Nouvel Utilisateur
            </button>
          )}
        </div>
      </div>

      {/* Role Explanatory Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <div>
            <h4 className="text-xs font-bold text-purple-900">
              Espace Administrateur
            </h4>
            <p className="text-[11px] text-purple-700 mt-0.5 leading-snug">
              Droit absolu sur l'ensemble de la plateforme. Active/désactive les
              comptes et alloue les privilèges de saisie, téléchargement,
              partage et rapports.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900">
              Espace Superviseur
            </h4>
            <p className="text-[11px] text-blue-700 mt-0.5 leading-snug">
              Ne voit ni <b>"Administration"</b> ni <b>"Vecteurs"</b>. Toutes
              ses actions sont strictement régies par les privilèges accordés
              par l'Admin.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
            3
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Espace Observateur
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              Unique accès : <b>Tableau de bord uniquement</b> en lecture seule.
              Ne peut rien télécharger, modifier ni accéder à d'autres
              rubriques.
            </p>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab("users")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeAdminTab === "users"
              ? "bg-purple-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-purple-300" />
          <span>Option Administration · Comptes & Accès ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("villages")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeAdminTab === "villages"
              ? "bg-purple-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-purple-300" />
          <span>Administration des Localités & Villages ({villages.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("audit")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeAdminTab === "audit"
              ? "bg-purple-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Journal d'Audit ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("config")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeAdminTab === "config"
              ? "bg-purple-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Paramètres Campagne</span>
        </button>

        <button
          onClick={() => setActiveTab("prevention")}
          className="ml-auto px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs whitespace-nowrap"
        >
        
          Ouvrir Préventions →
        </button>
      </div>

      {/* Admin Real-Time Toast Notification */}
      {adminToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 shadow-sm animate-in fade-in ${
            adminToast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-amber-50 border-amber-300 text-amber-950"
          }`}
        >
          <div className="flex items-center gap-2">
            {adminToast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{adminToast.text}</span>
          </div>
          <button
            onClick={() => setAdminToast(null)}
            className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 1 : GESTION DES UTILISATEURS, ACTIVATION & PRIVILÈGES                 */}
      {/* ========================================================================= */}
      {activeAdminTab === "users" && (
        <div className="space-y-6">
          {!isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <b>Note de sécurité :</b> Vous êtes connecté en tant que{" "}
                <b>{currentUser.role}</b>. Seul l'Administrateur peut
                activer/désactiver des comptes et allouer des privilèges.
              </span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* PANNEAU DE CONTRÔLE RAPIDE : ACTIVATION / DÉSACTIVATION DES RÔLES */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-linear-to-br from-slate-900 via-slate-800 to-purple-950 text-white rounded-2xl p-5 border border-slate-700/80 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/50">
                  Administration en Chef · Gestion des Accès
                </span>
                <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                  <span>Panneau d'Activation & Désactivation des Comptes Opérationnels</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Contrôlez instantanément le statut d'activité des Superviseurs et Agents de terrain. Tout compte désactivé est immédiatement verrouillé dans tout le système.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">
                  Comptes actifs : <b className="text-emerald-400 font-mono">{users.filter((u) => u.actif).length}</b> / {users.length}
                </span>
              </div>
            </div>

            {/* Quick Action Cards for Superviseur and Agent de Terrain */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Carte Superviseur Général */}
              {(() => {
                const sup = users.find((u) => u.role === "superviseur") || users[1];
                if (!sup) return null;
                return (
                  <div
                    key={sup.id}
                    className={`p-4 rounded-xl border transition-all ${
                      sup.actif
                        ? "bg-slate-800/80 border-blue-500/40"
                        : "bg-red-950/40 border-red-500/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${sup.actif ? "bg-blue-600" : "bg-red-800"}`}>
                          
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{sup.nom}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{sup.matricule} · Superviseur Général</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          sup.actif
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {sup.actif ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                        {sup.actif ? "ACTIF" : "DÉSACTIVÉ"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                      {sup.actif
                        ? "Le Superviseur peut superviser les 17 localités, valider les tournées, consulter les grilles Excel et générer les synthèses."
                        : "Compte actuellement DÉSACTIVÉ. Le Superviseur ne peut plus se connecter ni effectuer d'actions dans l'application."}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPrivilegeModal(sup)}
                        disabled={!isAdmin}
                        className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        Privilèges
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(sup)}
                        disabled={!isAdmin}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          sup.actif
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {sup.actif ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Désactiver le Superviseur</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Réactiver le Superviseur</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Carte Agent de Terrain */}
              {(() => {
                const agt = users.find((u) => u.role === "agent") || users[2];
                if (!agt) return null;
                const vAssigne = villages.find((v) => v.id === agt.village_assigne_id);
                return (
                  <div
                    key={agt.id}
                    className={`p-4 rounded-xl border transition-all ${
                      agt.actif
                        ? "bg-slate-800/80 border-emerald-500/40"
                        : "bg-red-950/40 border-red-500/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${agt.actif ? "bg-emerald-600" : "bg-red-800"}`}>
                          
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{agt.nom}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{agt.matricule} · Agent de Terrain</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          agt.actif
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {agt.actif ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                        {agt.actif ? "ACTIF" : "DÉSACTIVÉ"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                      {agt.actif
                        ? `L'Agent est autorisé à enrôler les familles et saisir les pulvérisations chambre par chambre (affecté à ${vAssigne ? vAssigne.nom : "Toutes les localités"}).`
                        : "Compte actuellement DÉSACTIVÉ. L'Agent ne peut plus accéder aux formulaires d'enrôlement ni pulvériser de concessions."}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPrivilegeModal(agt)}
                        disabled={!isAdmin}
                        className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        Privilèges
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(agt)}
                        disabled={!isAdmin}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          agt.actif
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {agt.actif ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Désactiver l'Agent</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Réactiver l'Agent</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Carte Observateur ou Administration Principale */}
              {(() => {
                const obs = users.find((u) => u.role === "observateur");
                if (!obs) return null;
                return (
                  <div
                    key={obs.id}
                    className={`p-4 rounded-xl border transition-all ${
                      obs.actif
                        ? "bg-slate-800/80 border-slate-600/60"
                        : "bg-red-950/40 border-red-500/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${obs.actif ? "bg-slate-700" : "bg-red-800"}`}>
                          
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{obs.nom}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{obs.matricule} · Observateur</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          obs.actif
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {obs.actif ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                        {obs.actif ? "ACTIF" : "DÉSACTIVÉ"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                      {obs.actif
                        ? "Profil en lecture seule : uniquement autorisé à consulter le Tableau de bord général (sans droit d'export ni modification)."
                        : "Compte Observateur DÉSACTIVÉ. Toute tentative de consultation du Tableau de bord lui est refusée."}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">Consultation seule</span>
                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(obs)}
                        disabled={!isAdmin}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          obs.actif
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {obs.actif ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Désactiver</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Réactiver</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Registre Complet des Comptes Utilisateurs & Privilèges
                </h2>
                <p className="text-xs text-slate-500">
                  Gestion centralisée, affectation des localités et activation instantanée
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setRoleFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roleFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tous ({users.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter("superviseur")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roleFilter === "superviseur" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Superviseurs
                  </button>
                  <button
                    onClick={() => setRoleFilter("agent")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roleFilter === "agent" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Agents
                  </button>
                  <button
                    onClick={() => setRoleFilter("actif")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roleFilter === "actif" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Actifs ({users.filter((u) => u.actif).length})
                  </button>
                  <button
                    onClick={() => setRoleFilter("inactif")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roleFilter === "inactif" ? "bg-red-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Désactivés ({users.filter((u) => !u.actif).length})
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Filtrer utilisateur..."
                    className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-emerald-600 w-40 sm:w-48"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Utilisateur</th>
                    <th className="py-2.5 px-3">Rôle</th>
                    <th className="py-2.5 px-3 text-center">
                      Statut du Compte (Toggle)
                    </th>
                    <th className="py-2.5 px-3">
                      Localité / Village Assigné
                    </th>
                    <th className="py-2.5 px-3">
                      Privilèges Alloués par l'Admin
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      Actions Administrateur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter((u) => {
                      if (roleFilter === "superviseur") return u.role === "superviseur";
                      if (roleFilter === "agent") return u.role === "agent";
                      if (roleFilter === "observateur") return u.role === "observateur";
                      if (roleFilter === "actif") return u.actif;
                      if (roleFilter === "inactif") return !u.actif;
                      return true;
                    })
                    .filter((u) => {
                      if (!userSearch) return true;
                      const q = userSearch.toLowerCase();
                      return (
                        u.nom.toLowerCase().includes(q) ||
                        u.matricule.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q)
                      );
                    })
                    .map((u) => {
                      const isSelf = u.id === currentUser.id;
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            !u.actif ? "bg-red-50/30" : ""
                          }`}
                        >
                          {/* Identité */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  u.role === "admin"
                                    ? "bg-purple-700"
                                    : u.role === "superviseur"
                                      ? "bg-blue-700"
                                      : u.role === "agent"
                                        ? "bg-emerald-700"
                                        : "bg-slate-700"
                                }`}
                              >
                                {u.nom.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.nom}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-normal">
                                      (Vous)
                                    </span>
                                  )}
                                  {!u.actif && (
                                    <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                                      BLOQUÉ
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {u.matricule} · {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Rôle */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : u.role === "superviseur"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : u.role === "agent"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          {/* Statut Compte avec Commutateur Interactif */}
                          <td className="py-3 px-3 text-center">
                            {u.role !== "admin" ? (
                              <button
                                type="button"
                                onClick={() => handleToggleUserActive(u)}
                                disabled={!isAdmin}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                                  u.actif
                                    ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300"
                                    : "bg-red-100 text-red-900 hover:bg-red-200 border border-red-300"
                                }`}
                                title="Cliquer pour activer ou désactiver ce compte"
                              >
                                {u.actif ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                    <span>Actif</span>
                                    <ToggleRight className="w-4 h-4 text-emerald-700" />
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-red-600" />
                                    <span>Désactivé</span>
                                    <ToggleLeft className="w-4 h-4 text-red-700" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                                Permanent
                              </span>
                            )}
                          </td>

                          {/* Localité / Village Assigné */}
                          <td className="py-3 px-3">
                            {u.role === "admin" ? (
                              <span className="text-[11px] text-slate-400 italic">Toutes localités (Admin)</span>
                            ) : u.role === "observateur" ? (
                              <span className="text-[11px] text-slate-400 italic">Vue globale</span>
                            ) : (
                              <select
                                value={u.village_assigne_id || ""}
                                onChange={(e) =>
                                  handleAssignVillageToUser(
                                    u.id,
                                    e.target.value ? Number(e.target.value) : null,
                                  )
                                }
                                disabled={!isAdmin}
                                className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-purple-600 cursor-pointer"
                              >
                                <option value="">Toutes les localités</option>
                                {villages.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.nom} ({v.code})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>

                          {/* Privilèges Alloués */}
                          <td className="py-3 px-3">
                            {u.role === "observateur" ? (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                   Tableau de bord seul (Visiteur)
                                </span>
                                <span className="text-[10px] text-slate-400 italic">
                                  Aucun droit de téléchargement
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    u.peut_saisir
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-400 line-through"
                                  }`}
                                >
                                  Saisie
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    u.peut_telecharger
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-400 line-through"
                                  }`}
                                >
                                  Télécharger
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    u.peut_partager
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-400 line-through"
                                  }`}
                                >
                                  Partager
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    u.peut_generer_rapports
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-400 line-through"
                                  }`}
                                >
                                  Rapports
                                </span>
                                {u.peut_modifier && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                    Modifier
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions Administrateur */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Bouton Allouer Privilèges */}
                              <button
                                onClick={() => handleOpenPrivilegeModal(u)}
                                disabled={!isAdmin || isSelf}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                  !isAdmin || isSelf
                                    ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                                title={
                                  isSelf
                                    ? "L'admin dispose de tous les privilèges"
                                    : "Gérer la liste des privilèges accordés"
                                }
                              >
                                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                                Privilèges
                              </button>

                              {/* Bouton Activer / Désactiver */}
                              {u.role !== "admin" ? (
                                <button
                                  onClick={() => handleToggleUserActive(u)}
                                  disabled={!isAdmin}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95 ${
                                    !isAdmin
                                      ? "opacity-40 cursor-not-allowed"
                                      : u.actif
                                        ? "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                                        : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                  }`}
                                >
                                  {u.actif ? (
                                    <>
                                      <XCircle className="w-3 h-3 text-red-600" />
                                      Désactiver
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Activer
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic px-2">
                                  Admin Maître
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE : ADMINISTRATION DES LOCALITÉS & VILLAGES (CRÉATION ET GESTION)       */}
      {/* ========================================================================= */}
      {activeAdminTab === "villages" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider">
                  Réseau Territorial SAG Koron
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-semibold text-slate-600">
                  {villages.length} Localités Enregistrées
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Administration des Localités & Déploiement IRS
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Création de nouveaux villages, configuration des structures cibles et suivi en temps réel pour Superviseurs et Agents de terrain.
              </p>
            </div>

            <button
              onClick={() => setShowAddVillageModal(true)}
              disabled={!isAdmin}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                isAdmin
                  ? "bg-purple-700 hover:bg-purple-800 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Créer un Nouveau Village (Admin)</span>
            </button>
          </div>

          {/* Villages Grid Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {villages.map((v) => {
              const assignedAgents = users.filter((u) => u.village_assigne_id === v.id);
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-purple-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {v.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 uppercase">
                        {v.nom}
                      </h4>
                      <span className="text-[10px] text-slate-400">{v.type === "SAG" ? "Base SAG" : "Village Rural"}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        v.taux_chambres_pct >= 97
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : v.taux_chambres_pct >= 75
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {v.taux_chambres_pct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400">Chambres Traitées</div>
                      <div className="font-bold font-mono text-slate-800">
                        {v.chambres_pulverisees} / {v.chambres_totales}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Structures Cibles</div>
                      <div className="font-bold font-mono text-slate-800">
                        {v.nb_structures_total}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                    <span>
                      Personnel affecté :{" "}
                      <b>{assignedAgents.length > 0 ? assignedAgents.map((a) => a.nom.split(" ")[0]).join(", ") : "Non assigné"}</b>
                    </span>
                    <button
                      onClick={() => setActiveTab("villages")}
                      className="text-purple-700 hover:text-purple-900 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                    >
                      Fiche →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : JOURNAL D'AUDIT (AUDIT TRAIL)                                     */}
      {/* ========================================================================= */}
      {activeAdminTab === "audit" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Registre d'Imputabilité & Traçabilité
              </h2>
              <p className="text-xs text-slate-500">
                Traçabilité complète des activations, privilèges alloués et
                saisies
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Rechercher action, utilisateur..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date & Heure</th>
                  <th className="py-2.5 px-3">Utilisateur</th>
                  <th className="py-2.5 px-3">Rôle</th>
                  <th className="py-2.5 px-3">Action Système</th>
                  <th className="py-2.5 px-3">Détails & Modifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {log.cree_le}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {log.nom_utilisateur}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.action.includes("ACTIVATION") ||
                          log.action.includes("OCTROI")
                            ? "bg-emerald-100 text-emerald-800"
                            : log.action.includes("DESACTIVATION") ||
                                log.action.includes("RETRAIT")
                              ? "bg-red-100 text-red-800"
                              : log.action.includes("PRIVILEGES")
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 3 : CONFIGURATION GLOBALE CAMPAGNE                                   */}
      {/* ========================================================================= */}
      {activeAdminTab === "config" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Paramètres Campagne IRS 2026 & Seuils Heatmap
            </h2>
            <p className="text-xs text-slate-500">
              Standards Hôpital de Koron / AngloGold Ashanti SAG Siguiri
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-slate-900">
                Insecticide Officiel de Référence
              </div>
              <p className="text-xs text-slate-600">
                Actellic 300cs (Pirimiphos-méthyl suspension microencapsulée)
              </p>
              <div className="text-[11px] text-slate-500">
                Dosage : 1 sachet / boîte par pompe Hudson X-Pert (8L de
                bouillie).
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-slate-900">
                Objectif de Couverture Requise (KPI)
              </div>
              <p className="text-xs text-emerald-800 font-bold font-mono">
                ≥ 97.0% des structures répertoriées
              </p>
              <div className="text-[11px] text-slate-500">
                Seuil de conformité de l'Hôpital de Koron pour casser le cycle
                vectoriel.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1 : ALLOUER LA LISTE DE CHOIX DE PRIVILÈGES (RBAC ADMIN)             */}
      {/* ========================================================================= */}
      {selectedUserForPrivileges && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  Espace Administration · Allouer les Privilèges
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Droits de : {selectedUserForPrivileges.nom}
                </h3>
                <p className="text-xs text-slate-500">
                  Rôle actuel :{" "}
                  <b className="uppercase">{selectedUserForPrivileges.role}</b>{" "}
                  ({selectedUserForPrivileges.matricule})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForPrivileges(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-slate-600">
                Sélectionnez dans la liste ci-dessous les fonctionnalités
                autorisées pour cet utilisateur sur la plateforme :
              </p>

              {/* Checkbox Options List */}
              <div className="space-y-2.5">
                {/* 1. Saisie et enregistrer */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempPrivileges.peut_saisir}
                    onChange={(e) =>
                      setTempPrivileges({
                        ...tempPrivileges,
                        peut_saisir: e.target.checked,
                      })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Saisie et Enregistrer les Données
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Autorise la saisie sur la Grille Excel journalière (1→30)
                      et la saisie IRS pièce par pièce des concessions.
                    </p>
                  </div>
                </label>

                {/* 2. Télécharger */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempPrivileges.peut_telecharger}
                    onChange={(e) =>
                      setTempPrivileges({
                        ...tempPrivileges,
                        peut_telecharger: e.target.checked,
                        peut_exporter: e.target.checked,
                      })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      Télécharger & Exporter (Excel .xlsx, CSV, PDF)
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Autorise le téléchargement des classeurs Excel, exports de
                      données brutes et impression directe.
                    </p>
                  </div>
                </label>

                {/* 3. Partager */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempPrivileges.peut_partager}
                    onChange={(e) =>
                      setTempPrivileges({
                        ...tempPrivileges,
                        peut_partager: e.target.checked,
                      })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      Partager les Fiches & Synthèses
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Autorise le partage externe des fiches d'intervention et
                      copies synthétiques.
                    </p>
                  </div>
                </label>

                {/* 4. Générer les rapports */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempPrivileges.peut_generer_rapports}
                    onChange={(e) =>
                      setTempPrivileges({
                        ...tempPrivileges,
                        peut_generer_rapports: e.target.checked,
                      })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      Générer les Rapports Officiels
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Accès au Générateur Avancé (Page de garde officielle,
                      carrousel d'indicateurs et certification de fin de
                      campagne).
                    </p>
                  </div>
                </label>

                {/* 5. Modifier les fiches */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempPrivileges.peut_modifier}
                    onChange={(e) =>
                      setTempPrivileges({
                        ...tempPrivileges,
                        peut_modifier: e.target.checked,
                      })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      Modifier les Fiches Villages & Objectifs
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Permet d'éditer le nombre de structures cibles et les
                      caractéristiques des localités.
                    </p>
                  </div>
                </label>
              </div>

              {/* Presets */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Profils rapides :</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setTempPrivileges({
                        peut_saisir: true,
                        peut_telecharger: true,
                        peut_exporter: true,
                        peut_partager: true,
                        peut_generer_rapports: true,
                        peut_modifier: true,
                        peut_supprimer: false,
                      })
                    }
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] cursor-pointer"
                  >
                    Superviseur Complet
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTempPrivileges({
                        peut_saisir: false,
                        peut_telecharger: false,
                        peut_exporter: false,
                        peut_partager: false,
                        peut_generer_rapports: false,
                        peut_modifier: false,
                        peut_supprimer: false,
                      })
                    }
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] cursor-pointer"
                  >
                    Lecture Seule (Observateur)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserForPrivileges(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSavePrivileges}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Valider & Appliquer les Privilèges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2 : CRÉER UN NOUVEL UTILISATEUR                                     */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Créer un Nouveau Compte
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Affectation et configuration initiale des droits
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Dr. Fanta Condé"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matricule SAG
                  </label>
                  <input
                    type="text"
                    required
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    placeholder="SAG-SUP-015"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rôle
                  </label>
                  <select
                    value={role}
                    onChange={(e) =>
                      handleRoleChangeForNewUser(e.target.value as UserRole)
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-emerald-600"
                  >
                    <option value="superviseur">Superviseur IRS</option>
                    <option value="observateur">Observateur (Visiteur)</option>
                    <option value="agent">Agent de terrain</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Professionnel
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@sag-koron.gn"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-emerald-600"
                />
              </div>

              {/* Privilèges à allouer dès la création */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Liste des Privilèges à Allouer :
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserPrivileges.peut_saisir}
                      onChange={(e) =>
                        setNewUserPrivileges({
                          ...newUserPrivileges,
                          peut_saisir: e.target.checked,
                        })
                      }
                      className="rounded text-emerald-600"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      Saisie & Enregistrer
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserPrivileges.peut_telecharger}
                      onChange={(e) =>
                        setNewUserPrivileges({
                          ...newUserPrivileges,
                          peut_telecharger: e.target.checked,
                          peut_exporter: e.target.checked,
                        })
                      }
                      className="rounded text-emerald-600"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      Télécharger (Excel/PDF)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserPrivileges.peut_partager}
                      onChange={(e) =>
                        setNewUserPrivileges({
                          ...newUserPrivileges,
                          peut_partager: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      Partager
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserPrivileges.peut_generer_rapports}
                      onChange={(e) =>
                        setNewUserPrivileges({
                          ...newUserPrivileges,
                          peut_generer_rapports: e.target.checked,
                        })
                      }
                      className="rounded text-purple-600"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      Générer Rapports
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Créer & Activer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3 : CRÉER UNE NOUVELLE LOCALITÉ / VILLAGE (ADMIN EN CHEF)           */}
      {/* ========================================================================= */}
      {showAddVillageModal && (
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
                onClick={() => setShowAddVillageModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVillageSubmit} className="py-4 space-y-3.5">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Enregistrement automatique dans tout le système :</span>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Cette nouvelle localité sera instantanément enregistrée dans le socle de données et accessible à tous les <b>Superviseurs</b> et <b>Agents de terrain</b> pour l'enrôlement et la pulvérisation IRS.
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
                    value={vNom}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVNom(val);
                      if (!vCode || vCode.length <= 4) {
                        setVCode(val.trim().substring(0, 4).toUpperCase());
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
                    value={vCode}
                    onChange={(e) => setVCode(e.target.value.toUpperCase())}
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
                    value={vType}
                    onChange={(e) => setVType(e.target.value as any)}
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
                    max={3000}
                    value={vStructures}
                    onChange={(e) => setVStructures(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stands / Concessions
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1000}
                    value={vStands}
                    onChange={(e) => setVStands(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Affecter immédiatement un Agent ou Superviseur (optionnel)
                </label>
                <select
                  value={vAgentId || ""}
                  onChange={(e) => setVAgentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-purple-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="">Aucune affectation immédiate (disponible pour tous)</option>
                  {users
                    .filter((u) => u.role === "agent" || u.role === "superviseur")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nom} ({u.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVillageModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Enregistrer & Déployer la Localité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
