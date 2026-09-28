import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  UserRole,
  UserPrivileges,
  Village,
  Famille,
  Chambre,
  DailySprayRecord,
  VecteurRecord,
  AuditLog,
  ChambreStatut,
  MotifNonPulverisation,
  PreventionItem,
} from "../types";
import {
  INITIAL_USERS,
  buildInitialVillages,
  INITIAL_FAMILLES,
  INITIAL_CHAMBRES,
  INITIAL_VECTEURS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PREVENTIONS,
} from "../data/initialData";
import { getHeatmapInfo } from "../utils/heatmap";
import { syncVillageWithFieldData, calculateSprayCoverage } from "../utils/calculations";

export interface ReportModalConfig {
  type: string;
  title?: string;
  villageId?: number;
  data?: any;
  captureTargetId?: string;
}

interface AppContextType {
  currentUser: User;
  users: User[];
  isAuthenticated: boolean;
  villages: Village[];
  familles: Famille[];
  chambres: Chambre[];
  dailySprays: DailySprayRecord[];
  vecteurs: VecteurRecord[];
  auditLogs: AuditLog[];
  isOnline: boolean;
  activeTab: string;
  isModuleLoading: boolean;
  setActiveTab: (tab: string) => void;
  selectedVillageId: number | null;
  setSelectedVillageId: (id: number | null) => void;
  // Auth & Roles
  login: (identifiant: string, mdp: string) => boolean;
  logout: () => void;
  switchUser: (userId: number) => void;
  // Village Management (B)
  addVillage: (data: {
    nom: string;
    code?: string;
    type?: "village" | "SAG" | "Autre";
    latitude?: number;
    longitude?: number;
    nb_structures_total?: number;
    nb_stands_total?: number;
  }) => { village: Village; isNew: boolean };
  updateVillage: (id: number, data: Partial<Village>) => boolean;
  deleteVillage: (id: number) => boolean;
  // Daily Spray & Line Management (C2)
  addDailySpray: (data: {
    villageId: number;
    date: string;
    numJour: number;
    insecticide: string;
    stands: number[];
    structures: number[];
    canRefills: number[];
    population: {
      homme: number;
      femme: number;
      femme_enceinte: number;
      enfant_0_5: number;
    };
    observation: string;
  }) => boolean;
  updateDailySpray: (
    id: number,
    updatedData: Partial<DailySprayRecord>,
  ) => boolean;
  deleteDailySpray: (id: number) => boolean;
  importDailySprays: (records: any[]) => number;
  allowAgentsEditLines: boolean;
  toggleAllowAgentsEditLines: () => void;
  // IRS Room Level & Concessions
  addFamille: (data: {
    village_id: number;
    chef_famille: string;
    nom_concession?: string;
    contact?: string;
    nb_chambres: number;
    population?: {
      homme: number;
      femme: number;
      femme_enceinte: number;
      enfant_0_5: number;
    };
    chambres_details?: {
      type: string;
      statut: ChambreStatut;
      motif?: MotifNonPulverisation;
      detail?: string;
    }[];
  }) => Famille;
  deleteFamille: (familleId: number) => boolean;
  resyncAllVillages: () => void;
  recordFamilyPassage: (
    familleId: number,
    chambresUpdates: {
      id: number;
      statut: ChambreStatut;
      motif: MotifNonPulverisation;
      detail?: string;
    }[],
    observation: string,
  ) => boolean;
  addVecteur: (
    data: Omit<VecteurRecord, "id" | "agent_id" | "nom_agent">,
  ) => void;
  toggleUserSaisiePermission: (userId: number) => void;
  toggleUserActive: (userId: number) => void;
  updateUserPrivileges: (
    userId: number,
    privileges: Partial<UserPrivileges>,
  ) => void;
  updateUser: (userId: number, data: Partial<User>) => void;
  addUser: (userData: {
    nom: string;
    matricule: string;
    email: string;
    role: UserRole;
    village_assigne_id?: number | null;
    peut_saisir?: boolean;
    privileges?: Partial<UserPrivileges>;
  }) => void;
  // Report Generation Modal (D)
  isReportModalOpen: boolean;
  reportModalContext: ReportModalConfig | null;
  openReportModal: (context: ReportModalConfig) => void;
  closeReportModal: () => void;
  // Prevention & Resolution Module (Admin Only)
  preventionItems: PreventionItem[];
  addPreventionItem: (
    item: Omit<
      PreventionItem,
      "id" | "codeReference" | "dateCreation" | "heureCreation"
    >,
  ) => PreventionItem;
  deletePreventionItem: (id: string) => void;
  updatePreventionStatut: (
    id: string,
    statut: PreventionItem["statut"],
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = "sag_irs_malaria_2026_v2_";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1. Initial State strictly with the 4 authorized users
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "users");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 4 &&
          parsed.some((u) => u.nom.includes("Faremba Doumbouya"))
        ) {
          return parsed.map((u: any) => ({
            ...u,
            peut_saisir:
              u.peut_saisir !== undefined
                ? u.peut_saisir
                : u.role !== "observateur",
            peut_telecharger:
              u.peut_telecharger !== undefined
                ? u.peut_telecharger
                : u.role === "observateur"
                  ? false
                  : (u.peut_exporter ?? true),
            peut_exporter:
              u.peut_exporter !== undefined
                ? u.peut_exporter
                : u.role === "observateur"
                  ? false
                  : (u.peut_telecharger ?? true),
            peut_partager:
              u.peut_partager !== undefined
                ? u.peut_partager
                : u.role === "admin" || u.role === "superviseur",
            peut_generer_rapports:
              u.peut_generer_rapports !== undefined
                ? u.peut_generer_rapports
                : u.role === "admin" || u.role === "superviseur",
            peut_modifier:
              u.peut_modifier !== undefined
                ? u.peut_modifier
                : u.role === "admin" || u.role === "superviseur",
            peut_supprimer:
              u.peut_supprimer !== undefined
                ? u.peut_supprimer
                : u.role === "admin",
            actif: u.actif !== undefined ? u.actif : true,
          }));
        }
      } catch (e) {
        // Fallback to fresh initial users
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "current_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          (parsed.id === 1 ||
            parsed.id === 2 ||
            parsed.id === 3 ||
            parsed.id === 4)
        ) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_USERS[0]; // Dr. Faremba Doumbouya (Admin) by default
  });

  const [villages, setVillages] = useState<Village[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "villages");
    return saved ? JSON.parse(saved) : buildInitialVillages();
  });

  const [familles, setFamilles] = useState<Famille[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "familles");
    return saved ? JSON.parse(saved) : INITIAL_FAMILLES;
  });

  const [chambres, setChambres] = useState<Chambre[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "chambres");
    return saved ? JSON.parse(saved) : INITIAL_CHAMBRES;
  });

  const [dailySprays, setDailySprays] = useState<DailySprayRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "daily_sprays");
    if (saved) return JSON.parse(saved);
    // Seed initial daily sprays from first 2 villages for rich reporting
    const v1 = buildInitialVillages()[0];
    return [
      {
        id: 17112001,
        village_id: v1.id,
        nom_village: v1.nom,
        campagne_id: 1,
        agent_id: 2,
        nom_agent: "Dr. Colonel Magassouba",
        date_intervention: "2026-09-22",
        num_jour: 1,
        insecticide: "Actellic 300cs",
        stands: [
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0,
        ],
        structures: [
          5, 4, 6, 5, 4, 5, 6, 4, 5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0,
        ],
        can_refills: [
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0,
        ],
        stand_total: 10,
        structures_total: 48,
        can_refills_total: 10,
        population: {
          homme: 34,
          femme: 42,
          femme_enceinte: 6,
          enfant_0_5: 22,
          total: 104,
        },
        observation: "Passage préliminaire concessions Ouest",
      },
    ];
  });

  const [vecteurs, setVecteurs] = useState<VecteurRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "vecteurs");
    return saved ? JSON.parse(saved) : INITIAL_VECTEURS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + "audit_logs");
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("connexion");
  const [isModuleLoading, setIsModuleLoading] = useState<boolean>(false);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(1); // Default to Fienkolen
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Line modification privilege state (configurable by Admin)
  const [allowAgentsEditLines, setAllowAgentsEditLines] = useState<boolean>(
    () => {
      const saved = localStorage.getItem(
        STORAGE_PREFIX + "allow_agents_edit_lines",
      );
      return saved ? JSON.parse(saved) : false;
    },
  );

  // Report Modal global state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalContext, setReportModalContext] =
    useState<ReportModalConfig | null>(null);

  const openReportModal = (context: ReportModalConfig) => {
    if (currentUser.role === "observateur") {
      alert(
        "Accès non autorisé : En tant qu'observateur, vous disposez exclusivement de la consultation du tableau de bord. La génération de rapport officiel est désactivée.",
      );
      return;
    }
    if (currentUser.role === "superviseur" && !currentUser.peut_generer_rapports) {
      alert(
        "Privilège insuffisant : L'Administrateur ne vous a pas alloué le droit de générer des rapports officiels.",
      );
      return;
    }
    setReportModalContext(context);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportModalContext(null);
  };

  // Prevention & Resolution Module State
  const [preventionItems, setPreventionItems] = useState<PreventionItem[]>(
    () => {
      const saved = localStorage.getItem(STORAGE_PREFIX + "prevention_items");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {}
      }
      return INITIAL_PREVENTIONS;
    },
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_PREFIX + "prevention_items",
      JSON.stringify(preventionItems),
    );
  }, [preventionItems]);

  const addPreventionItem = (
    itemData: Omit<
      PreventionItem,
      "id" | "codeReference" | "dateCreation" | "heureCreation"
    >,
  ): PreventionItem => {
    const now = new Date();
    const dateCreation = now.toISOString().split("T")[0];
    const heureCreation = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const codeReference = `SAG-PREV-2026-N°${randNum}`;
    const id = `PREV-${Date.now()}`;

    const newItem: PreventionItem = {
      ...itemData,
      id,
      codeReference,
      dateCreation,
      heureCreation,
    };

    setPreventionItems((prev) => [newItem, ...prev]);

    addAudit(
      "CREATION_FICHE_PREVENTION",
      "prevention_items",
      null,
      `Nouvelle fiche de prévention générée : ${newItem.titre} (${codeReference}, Cible: ${newItem.villageCible})`,
    );

    return newItem;
  };

  const deletePreventionItem = (id: string) => {
    setPreventionItems((prev) => prev.filter((p) => p.id !== id));
    addAudit(
      "SUPPRESSION_FICHE_PREVENTION",
      "prevention_items",
      null,
      `Suppression de la fiche de prévention ${id}`,
    );
  };

  const updatePreventionStatut = (
    id: string,
    statut: PreventionItem["statut"],
  ) => {
    setPreventionItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, statut } : p)),
    );
  };

  const handleSetActiveTab = (tab: string) => {
    // 3 - Observateur restriction: can ONLY see dashboard
    if (currentUser.role === "observateur" && tab !== "dashboard") {
      setActiveTab("dashboard");
      return;
    }
    // 2 - Superviseur restriction: must NOT see or access admin and entomologie
    if (
      currentUser.role === "superviseur" &&
      (tab === "admin" || tab === "entomologie")
    ) {
      alert(
        "Accès refusé : Le rôle Superviseur n'a pas accès aux modules Administration et Vecteurs.",
      );
      setActiveTab("dashboard");
      return;
    }
    if (tab === activeTab) return;

    setIsModuleLoading(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsModuleLoading(false);
    }, 240);
  };

  // Enforce role-based tab containment when role changes
  useEffect(() => {
    if (currentUser.role === "observateur" && activeTab !== "dashboard") {
      setActiveTab("dashboard");
    } else if (
      currentUser.role === "superviseur" &&
      (activeTab === "admin" || activeTab === "entomologie")
    ) {
      setActiveTab("dashboard");
    }
  }, [currentUser.id, currentUser.role, activeTab]);

  // Keep currentUser state in sync when user list is updated by Admin
  useEffect(() => {
    const updated = users.find((u) => u.id === currentUser.id);
    if (updated) {
      if (JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [users, currentUser]);

  const toggleAllowAgentsEditLines = () => {
    if (currentUser.role !== "admin") {
      alert(
        "Seul l'Administrateur peut modifier les privilèges d'édition de lignes.",
      );
      return;
    }
    setAllowAgentsEditLines((prev) => {
      const next = !prev;
      localStorage.setItem(
        STORAGE_PREFIX + "allow_agents_edit_lines",
        JSON.stringify(next),
      );
      addAudit(
        "MODIFICATION_PRIVILEGE_LIGNES",
        "permissions",
        null,
        `Privilège de modification/suppression de lignes pour Superviseurs & Agents : ${next ? "ACTIVÉ" : "DÉSACTIVÉ"}`,
      );
      return next;
    });
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_PREFIX + "current_user",
      JSON.stringify(currentUser),
    );
  }, [currentUser]);

  // Synchronisation automatique initiale du socle de données de terrain
  useEffect(() => {
    setVillages((prev) =>
      prev.map((v) => syncVillageWithFieldData(v, familles, chambres))
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "villages", JSON.stringify(villages));
  }, [villages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "familles", JSON.stringify(familles));
  }, [familles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "chambres", JSON.stringify(chambres));
  }, [chambres]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_PREFIX + "daily_sprays",
      JSON.stringify(dailySprays),
    );
  }, [dailySprays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "vecteurs", JSON.stringify(vecteurs));
  }, [vecteurs]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_PREFIX + "audit_logs",
      JSON.stringify(auditLogs),
    );
  }, [auditLogs]);

  // Log audit helper
  const addAudit = (
    action: string,
    table: string,
    recordId: number | null,
    details: string,
  ) => {
    const newLog: AuditLog = {
      id: Date.now(),
      user_id: currentUser ? currentUser.id : null,
      nom_utilisateur: currentUser ? currentUser.nom : "Système",
      matricule: currentUser ? currentUser.matricule : "SYS-000",
      role: currentUser ? currentUser.role : "système",
      action,
      table_cible: table,
      enregistrement_id: recordId,
      details,
      ip_adresse: "192.168.1." + Math.floor(Math.random() * 80 + 10),
      cree_le: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Auth methods
  const login = (identifiant: string, mdp: string): boolean => {
    const cleanId = identifiant.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.matricule.toLowerCase() === cleanId,
    );
    if (!found) {
      addAudit(
        "ECHEC_CONNEXION",
        "users",
        null,
        `Tentative échouée : identifiant "${identifiant}" inconnu dans le système`,
      );
      return false;
    }

    if (!found.actif) {
      addAudit(
        "TENTATIVE_COMPTE_DESACTIVE",
        "users",
        found.id,
        `Tentative de connexion sur le compte désactivé de ${found.nom} (${found.role})`,
      );
      alert(
        `Accès Refusé : Le compte de ${found.nom} (${found.matricule}, ${found.role}) est actuellement DÉSACTIVÉ par l'Administrateur en Chef de la SAG Siguiri. Veuillez contacter la Direction Médicale de Koron.`,
      );
      return false;
    }

    if (found && (mdp === "sag2026" || mdp.length > 0)) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      if (found.role === "agent") {
        setActiveTab("saisie-irs");
      } else {
        setActiveTab("dashboard");
      }
      addAudit(
        "CONNEXION_UTILISATEUR",
        "users",
        found.id,
        `Connexion réussie de ${found.nom} (${found.role})`,
      );
      return true;
    }
    addAudit(
      "ECHEC_CONNEXION",
      "users",
      null,
      `Mot de passe invalide pour l'identifiant: ${identifiant}`,
    );
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAudit(
        "DECONNEXION_UTILISATEUR",
        "users",
        currentUser.id,
        `Déconnexion de ${currentUser.nom}`,
      );
    }
    setIsAuthenticated(false);
    setActiveTab("connexion");
  };

  const switchUser = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      if (!user.actif) {
        alert(
          `Impossible de basculer : Le compte de ${user.nom} (${user.role.toUpperCase()}) a été DÉSACTIVÉ par l'Administrateur en Chef. L'accès aux modules opérationnels lui est strictement bloqué.`,
        );
        return;
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user.role === "agent") {
        setActiveTab("saisie-irs");
      } else {
        setActiveTab("dashboard");
      }
      addAudit(
        "CHANGEMENT_PROFIL",
        "users",
        user.id,
        `Changement rapide vers le profil ${user.nom} (${user.role})`,
      );
    }
  };

  // =========================================================================
  // VILLAGE CREATION & MANAGEMENT (B)
  // =========================================================================
  const addVillage = (data: {
    nom: string;
    code?: string;
    type?: "village" | "SAG" | "Autre";
    latitude?: number;
    longitude?: number;
    nb_structures_total?: number;
    nb_stands_total?: number;
  }): { village: Village; isNew: boolean } => {
    const cleanNom = data.nom.trim();
    const existing = villages.find(
      (v) =>
        v.nom.toLowerCase() === cleanNom.toLowerCase() ||
        (data.code && v.code.toLowerCase() === data.code.trim().toLowerCase()),
    );

    if (existing) {
      return { village: existing, isNew: false };
    }

    const nextId =
      villages.length > 0 ? Math.max(...villages.map((v) => v.id)) + 1 : 1;
    const generatedCode = data.code
      ? data.code.trim().toUpperCase()
      : cleanNom.substring(0, 4).toUpperCase();
    const structuresTotal =
      data.nb_structures_total && data.nb_structures_total > 0
        ? data.nb_structures_total
        : 300;
    const standsTotal =
      data.nb_stands_total && data.nb_stands_total > 0
        ? data.nb_stands_total
        : Math.round(structuresTotal / 3.5);

    const newVillage: Village = {
      id: nextId,
      code: generatedCode,
      nom: cleanNom.toUpperCase(),
      type: data.type || "village",
      latitude:
        data.latitude ||
        Number((11.43 + (Math.random() - 0.5) * 0.14).toFixed(4)),
      longitude:
        data.longitude ||
        Number((-9.18 + (Math.random() - 0.5) * 0.14).toFixed(4)),
      population_totale: Math.round(structuresTotal * 4.2),
      nb_stands_total: standsTotal,
      nb_structures_total: structuresTotal,
      nb_familles_total: Math.round(structuresTotal / 2.2),
      stands_pulverises: 0,
      structures_pulverisees: 0,
      can_refills_total: 0,
      pop_homme: 0,
      pop_femme: 0,
      pop_femme_enceinte: 0,
      pop_enfant_0_5: 0,
      pop_couverte_total: 0,
      taux_structures_pct: 0,
      taux_chambres_pct: 0,
      taux_familles_pct: 0,
      chambres_totales: structuresTotal,
      chambres_pulverisees: 0,
      chambres_non_pulverisees: structuresTotal,
      familles_totales: Math.round(structuresTotal / 2.2),
      familles_pulverisees: 0,
      familles_completes: 0,
      familles_partielles: 0,
      familles_refusees: 0,
      familles_absentes: 0,
      ratio_chambres_famille: Number(
        (
          structuresTotal / Math.max(1, Math.round(structuresTotal / 2.2))
        ).toFixed(1),
      ),
      heatmap_chambres: getHeatmapInfo(0),
      heatmap_familles: getHeatmapInfo(0),
      heatmap_structures: getHeatmapInfo(0),
      objectif_97_atteint: false,
    };

    setVillages((prev) => [...prev, newVillage]);
    setSelectedVillageId(newVillage.id);

    addAudit(
      "CREATION_VILLAGE",
      "villages",
      newVillage.id,
      `Création du village ${newVillage.nom} (${newVillage.code}) avec ${structuresTotal} structures cibles par ${currentUser.nom}`,
    );

    return { village: newVillage, isNew: true };
  };

  const updateVillage = (id: number, data: Partial<Village>): boolean => {
    if (currentUser.role !== "admin" && currentUser.role !== "superviseur") {
      alert(
        "Seuls l'Administrateur et le Superviseur peuvent modifier les caractéristiques d'un village.",
      );
      return false;
    }

    setVillages((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, ...data };
        if (data.nb_structures_total !== undefined) {
          const taux =
            updated.nb_structures_total > 0
              ? Number(
                  (
                    (updated.structures_pulverisees /
                      updated.nb_structures_total) *
                    100
                  ).toFixed(1),
                )
              : 0;
          updated.taux_structures_pct = taux;
          updated.taux_chambres_pct = Math.min(100, taux);
          updated.heatmap_structures = getHeatmapInfo(taux);
          updated.heatmap_chambres = getHeatmapInfo(Math.min(100, taux));
          updated.objectif_97_atteint = taux >= 97.0;
        }
        return updated;
      }),
    );

    addAudit(
      "MODIFICATION_VILLAGE",
      "villages",
      id,
      `Mise à jour des coordonnées / objectifs du village #${id} par ${currentUser.nom}`,
    );
    return true;
  };

  const deleteVillage = (id: number): boolean => {
    if (currentUser.role !== "admin") {
      alert("Seul l'Administrateur peut supprimer un village.");
      return false;
    }

    const target = villages.find((v) => v.id === id);
    if (!target) return false;

    setVillages((prev) => prev.filter((v) => v.id !== id));
    setDailySprays((prev) => prev.filter((s) => s.village_id !== id));

    if (selectedVillageId === id) {
      const remaining = villages.filter((v) => v.id !== id);
      setSelectedVillageId(remaining[0]?.id || null);
    }

    addAudit(
      "SUPPRESSION_VILLAGE",
      "villages",
      id,
      `Suppression définitive du village ${target.nom} (${target.code}) par ${currentUser.nom}`,
    );
    return true;
  };

  // =========================================================================
  // DAILY SPRAYS & LINE MANAGEMENT (C2)
  // =========================================================================
  const addDailySpray = (data: {
    villageId: number;
    date: string;
    numJour: number;
    insecticide: string;
    stands: number[];
    structures: number[];
    canRefills: number[];
    population: {
      homme: number;
      femme: number;
      femme_enceinte: number;
      enfant_0_5: number;
    };
    observation: string;
  }): boolean => {
    if (!currentUser.peut_saisir) {
      alert(
        "Erreur : Votre droit de saisie est désactivé par l'administrateur.",
      );
      return false;
    }

    const village = villages.find((v) => v.id === data.villageId);
    if (!village) return false;

    const sumStands = data.stands.reduce((a, b) => a + (Number(b) || 0), 0);
    const sumStructures = data.structures.reduce(
      (a, b) => a + (Number(b) || 0),
      0,
    );
    const sumRefills = data.canRefills.reduce(
      (a, b) => a + (Number(b) || 0),
      0,
    );
    const popTotal =
      data.population.homme +
      data.population.femme +
      data.population.femme_enceinte +
      data.population.enfant_0_5;

    const newRecord: DailySprayRecord = {
      id: Date.now(),
      village_id: data.villageId,
      nom_village: village.nom,
      campagne_id: 1,
      agent_id: currentUser.id,
      nom_agent: currentUser.nom,
      date_intervention: data.date,
      num_jour: data.numJour,
      insecticide: data.insecticide,
      stands: data.stands,
      structures: data.structures,
      can_refills: data.canRefills,
      stand_total: sumStands,
      structures_total: sumStructures,
      can_refills_total: sumRefills,
      population: {
        ...data.population,
        total: popTotal,
      },
      observation: data.observation,
    };

    setDailySprays((prev) => [newRecord, ...prev]);

    // Recalculer instantanément les statistiques du village
    setVillages((prev) =>
      prev.map((v) => {
        if (v.id !== data.villageId) return v;

        const newStructTotal = v.structures_pulverisees + sumStructures;
        const newStandsTotal = v.stands_pulverises + sumStands;
        const newRefillsTotal = v.can_refills_total + sumRefills;
        const newHomme = v.pop_homme + data.population.homme;
        const newFemme = v.pop_femme + data.population.femme;
        const newEnceinte =
          v.pop_femme_enceinte + data.population.femme_enceinte;
        const newEnfant = v.pop_enfant_0_5 + data.population.enfant_0_5;
        const newPopTotal = newHomme + newFemme + newEnceinte + newEnfant;

        const tauxStructures =
          v.nb_structures_total > 0
            ? Number(
                ((newStructTotal / v.nb_structures_total) * 100).toFixed(1),
              )
            : 0;

        const tauxChambres =
          v.chambres_totales > 0
            ? Number(((newStructTotal / v.chambres_totales) * 100).toFixed(1))
            : tauxStructures;

        // Calcul précis du nombre de concessions / familles pulvérisées
        const newFamillesPulv = Math.min(
          v.familles_totales,
          v.familles_pulverisees + sumStands,
        );
        const tauxFamilles =
          v.familles_totales > 0
            ? Number(((newFamillesPulv / v.familles_totales) * 100).toFixed(1))
            : 0;

        const ratioChambres =
          v.familles_totales > 0
            ? Number((v.chambres_totales / v.familles_totales).toFixed(2))
            : 5.0;

        const newCompletes = Math.round(newFamillesPulv * 0.94);
        const newPartielles = Math.max(0, newFamillesPulv - newCompletes);

        return {
          ...v,
          stands_pulverises: newStandsTotal,
          structures_pulverisees: newStructTotal,
          can_refills_total: newRefillsTotal,
          pop_homme: newHomme,
          pop_femme: newFemme,
          pop_femme_enceinte: newEnceinte,
          pop_enfant_0_5: newEnfant,
          pop_couverte_total: newPopTotal,
          derniere_intervention: data.date,
          taux_structures_pct: tauxStructures,
          taux_chambres_pct: Math.min(100, tauxChambres),
          chambres_pulverisees: Math.min(v.chambres_totales, newStructTotal),
          chambres_non_pulverisees: Math.max(
            0,
            v.chambres_totales - Math.min(v.chambres_totales, newStructTotal),
          ),
          familles_pulverisees: newFamillesPulv,
          familles_completes: newCompletes,
          familles_partielles: newPartielles,
          taux_familles_pct: Math.min(100, tauxFamilles),
          ratio_chambres_famille: ratioChambres,
          heatmap_structures: getHeatmapInfo(tauxStructures),
          heatmap_chambres: getHeatmapInfo(Math.min(100, tauxChambres)),
          heatmap_familles: getHeatmapInfo(Math.min(100, tauxFamilles)),
          objectif_97_atteint: tauxChambres >= 97.0,
        };
      }),
    );

    addAudit(
      "SAISIE_JOURNALIERE_EXCEL",
      "pulverisations_journalieres",
      newRecord.id,
      `Saisie Jour ${data.numJour} à ${village.nom} : ${sumStructures} structures, ${sumStands} stands, ${sumRefills} recharges, Pop: ${popTotal} par ${currentUser.nom}`,
    );

    return true;
  };

  const updateDailySpray = (
    id: number,
    updatedData: Partial<DailySprayRecord>,
  ): boolean => {
    const canEdit =
      currentUser.role === "admin" ||
      currentUser.role === "superviseur" ||
      allowAgentsEditLines;
    if (!canEdit) {
      alert(
        "Privilège insuffisant : la modification de ligne est restreinte par l'administrateur.",
      );
      return false;
    }

    setDailySprays((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...updatedData };
        if (updatedData.stands) {
          merged.stand_total = updatedData.stands.reduce(
            (a, b) => a + (Number(b) || 0),
            0,
          );
        }
        if (updatedData.structures) {
          merged.structures_total = updatedData.structures.reduce(
            (a, b) => a + (Number(b) || 0),
            0,
          );
        }
        if (updatedData.can_refills) {
          merged.can_refills_total = updatedData.can_refills.reduce(
            (a, b) => a + (Number(b) || 0),
            0,
          );
        }
        if (updatedData.population) {
          merged.population.total =
            (merged.population.homme || 0) +
            (merged.population.femme || 0) +
            (merged.population.femme_enceinte || 0) +
            (merged.population.enfant_0_5 || 0);
        }
        return merged;
      }),
    );

    addAudit(
      "MODIFICATION_LIGNE_SAISIE",
      "pulverisations_journalieres",
      id,
      `Modification de la ligne de saisie #${id} par ${currentUser.nom}`,
    );
    return true;
  };

  const deleteDailySpray = (id: number): boolean => {
    const canDelete =
      currentUser.role === "admin" ||
      (allowAgentsEditLines && currentUser.role === "superviseur");
    if (!canDelete) {
      alert(
        "Privilège insuffisant : la suppression de ligne est réservée à l'Administrateur.",
      );
      return false;
    }

    const target = dailySprays.find((r) => r.id === id);
    if (!target) return false;

    setDailySprays((prev) => prev.filter((r) => r.id !== id));
    addAudit(
      "SUPPRESSION_LIGNE_SAISIE",
      "pulverisations_journalieres",
      id,
      `Suppression de la saisie Jour ${target.num_jour} à ${target.nom_village} par ${currentUser.nom}`,
    );
    return true;
  };

  const importDailySprays = (records: any[]): number => {
    if (currentUser.role !== "admin" && currentUser.role !== "superviseur") {
      alert(
        "Seuls l'Administrateur et le Superviseur peuvent importer des lignes de saisie.",
      );
      return 0;
    }

    let count = 0;
    const newRecords: DailySprayRecord[] = [];

    records.forEach((rec, idx) => {
      const village =
        villages.find(
          (v) =>
            v.id === rec.village_id ||
            v.nom.toLowerCase() === (rec.nom_village || "").toLowerCase(),
        ) || villages[0];
      const stands =
        Array.isArray(rec.stands) && rec.stands.length === 30
          ? rec.stands
          : Array(30).fill(0);
      const structures =
        Array.isArray(rec.structures) && rec.structures.length === 30
          ? rec.structures
          : Array(30).fill(0);
      const can_refills =
        Array.isArray(rec.can_refills) && rec.can_refills.length === 30
          ? rec.can_refills
          : Array(30).fill(0);

      const sTotal = structures.reduce(
        (a: number, b: number) => a + (Number(b) || 0),
        0,
      );
      const stTotal = stands.reduce(
        (a: number, b: number) => a + (Number(b) || 0),
        0,
      );
      const rTotal = can_refills.reduce(
        (a: number, b: number) => a + (Number(b) || 0),
        0,
      );

      const popH = Number(rec.population?.homme || rec.pop_homme || 0);
      const popF = Number(rec.population?.femme || rec.pop_femme || 0);
      const popE = Number(
        rec.population?.femme_enceinte || rec.pop_enceinte || 0,
      );
      const popEnf = Number(rec.population?.enfant_0_5 || rec.pop_enfant || 0);

      newRecords.push({
        id: Date.now() + idx,
        village_id: village.id,
        nom_village: village.nom,
        campagne_id: 1,
        agent_id: currentUser.id,
        nom_agent: currentUser.nom,
        date_intervention:
          rec.date_intervention ||
          rec.date ||
          new Date().toISOString().substring(0, 10),
        num_jour: Number(rec.num_jour) || 1,
        insecticide: rec.insecticide || "Actellic 300cs",
        stands,
        structures,
        can_refills,
        stand_total: stTotal,
        structures_total: sTotal,
        can_refills_total: rTotal,
        population: {
          homme: popH,
          femme: popF,
          femme_enceinte: popE,
          enfant_0_5: popEnf,
          total: popH + popF + popE + popEnf,
        },
        observation: rec.observation || "Importé via module d'importation SAG",
      });
      count++;
    });

    if (newRecords.length > 0) {
      setDailySprays((prev) => [...newRecords, ...prev]);
      addAudit(
        "IMPORT_LIGNES_SAISIE",
        "pulverisations_journalieres",
        null,
        `Importation réussie de ${count} lignes par ${currentUser.nom}`,
      );
    }
    return count;
  };

  // Recensement direct d'une nouvelle concession / famille avec ses chambres
  const addFamille = (data: {
    village_id: number;
    chef_famille: string;
    nom_concession?: string;
    contact?: string;
    nb_chambres: number;
    population?: {
      homme: number;
      femme: number;
      femme_enceinte: number;
      enfant_0_5: number;
    };
    chambres_details?: {
      type: string;
      statut: ChambreStatut;
      motif?: MotifNonPulverisation;
      detail?: string;
    }[];
  }): Famille => {
    const village = villages.find((v) => v.id === data.village_id);
    const vCode = village?.code || "VIL";
    const vFamCount =
      familles.filter((f) => f.village_id === data.village_id).length + 1;
    const codeFam = `${vCode}-FAM-${String(vFamCount).padStart(3, "0")}`;
    const newFamId = Date.now();

    const popH = Number(data.population?.homme) || 0;
    const popF = Number(data.population?.femme) || 0;
    const popE = Number(data.population?.femme_enceinte) || 0;
    const popK = Number(data.population?.enfant_0_5) || 0;
    const popTot = popH + popF + popE + popK;

    const DEFAULT_TYPES = [
      "Chambre Principale (Chef)",
      "Chambre Épouse 1",
      "Chambre Épouse 2",
      "Chambre Enfants",
      "Chambre Annexe / Magasin",
      "Chambre Visiteurs",
    ];

    const newChambres: Chambre[] = [];
    let pulvCount = 0;

    if (data.chambres_details && data.chambres_details.length > 0) {
      data.chambres_details.forEach((cd, idx) => {
        const isPulv = cd.statut === "pulvérisée";
        if (isPulv) pulvCount++;
        newChambres.push({
          id: newFamId * 10 + idx,
          famille_id: newFamId,
          numero_chambre: idx + 1,
          type: cd.type || DEFAULT_TYPES[idx % DEFAULT_TYPES.length],
          statut: cd.statut,
          motif_non_pulverisation: cd.motif || (isPulv ? "aucun" : "absence"),
          motif_detail: cd.detail || "",
          date_pulverisation: isPulv
            ? new Date().toISOString().substring(0, 10)
            : undefined,
          agent_id: currentUser.id,
          nom_agent: currentUser.nom,
        });
      });
    } else {
      const roomTotal = Math.max(1, data.nb_chambres || 4);
      for (let i = 0; i < roomTotal; i++) {
        newChambres.push({
          id: newFamId * 10 + i,
          famille_id: newFamId,
          numero_chambre: i + 1,
          type: DEFAULT_TYPES[i % DEFAULT_TYPES.length],
          statut: "non_pulvérisée",
          motif_non_pulverisation: "absence",
          date_pulverisation: undefined,
          agent_id: currentUser.id,
          nom_agent: currentUser.nom,
        });
      }
    }

    const calc = calculateSprayCoverage(newChambres.length, pulvCount);
    let statutFam: Famille["statut_famille"] = "Non visitée";
    if (pulvCount > 0) {
      statutFam = calc.is100Pct
        ? "Pulvérisée complètement"
        : "Partiellement pulvérisée";
    }

    const newFam: Famille = {
      id: newFamId,
      village_id: data.village_id,
      nom_village: village?.nom || "Village",
      code_famille: codeFam,
      nom_concession: data.nom_concession || `Concession ${data.chef_famille}`,
      chef_famille: data.chef_famille,
      contact: data.contact || "+224 600 00 00 00",
      nb_chambres_total: newChambres.length,
      chambres_pulverisees: pulvCount,
      chambres_non_pulverisees: newChambres.length - pulvCount,
      statut_famille: statutFam,
      maison_entiere_pulverisee: calc.is100Pct,
      taux_couverture_famille_pct: calc.rate,
      population_famille: {
        homme: popH,
        femme: popF,
        femme_enceinte: popE,
        enfant_0_5: popK,
        total: popTot || 5,
      },
      date_dernier_passage: new Date().toISOString().substring(0, 10),
    };

    const updatedFamilles = [newFam, ...familles];
    const updatedChambres = [...chambres, ...newChambres];

    setFamilles(updatedFamilles);
    setChambres(updatedChambres);

    // Lier immédiatement aux calculs du village et de l'app
    setVillages((prev) =>
      prev.map((v) => {
        if (v.id !== data.village_id) return v;
        return syncVillageWithFieldData(v, updatedFamilles, updatedChambres);
      }),
    );

    addAudit(
      "RECENSEMENT_NOUVELLE_FAMILLE",
      "familles",
      newFamId,
      `Enrôlement concession ${newFam.nom_concession} (${newFam.chef_famille}) : ${newChambres.length} chambres, Pop: ${popTot} (H:${popH}, F:${popF}, FE:${popE}, Enf:${popK}) à ${village?.nom} par ${currentUser.nom}`,
    );

    return newFam;
  };

  const deleteFamille = (familleId: number): boolean => {
    const target = familles.find((f) => f.id === familleId);
    if (!target) return false;

    const remainingFamilles = familles.filter((f) => f.id !== familleId);
    const remainingChambres = chambres.filter((c) => c.famille_id !== familleId);

    setFamilles(remainingFamilles);
    setChambres(remainingChambres);

    setVillages((prev) =>
      prev.map((v) => {
        if (v.id !== target.village_id) return v;
        return syncVillageWithFieldData(v, remainingFamilles, remainingChambres);
      }),
    );

    addAudit(
      "SUPPRESSION_FAMILLE",
      "familles",
      familleId,
      `Suppression de la concession ${target.nom_concession} (${target.chef_famille}) par ${currentUser.nom}`,
    );

    return true;
  };

  const resyncAllVillages = () => {
    setVillages((prev) =>
      prev.map((v) => syncVillageWithFieldData(v, familles, chambres)),
    );
  };

  // Action: Central Module IRS Room-by-room passage
  const recordFamilyPassage = (
    familleId: number,
    chambresUpdates: {
      id: number;
      statut: ChambreStatut;
      motif: MotifNonPulverisation;
      detail?: string;
    }[],
    observation: string,
  ): boolean => {
    if (!currentUser.peut_saisir) {
      alert(
        "Erreur : Votre droit de saisie est désactivé par l'administrateur.",
      );
      return false;
    }

    const famille = familles.find((f) => f.id === familleId);
    if (!famille) return false;

    let nbPulv = 0;
    let nbNonPulv = 0;
    let motifPrincipal: string = "aucun";

    // 1. Update chambres
    const updatedChambres = chambres.map((c) => {
      const update = chambresUpdates.find((u) => u.id === c.id);
      if (update) {
        if (update.statut === "pulvérisée") {
          nbPulv++;
        } else {
          nbNonPulv++;
          if (motifPrincipal === "aucun" && update.motif !== "aucun") {
            motifPrincipal = update.motif;
          }
        }
        return {
          ...c,
          statut: update.statut,
          motif_non_pulverisation: update.motif,
          motif_detail: update.detail,
          date_pulverisation:
            update.statut === "pulvérisée"
              ? new Date().toISOString().substring(0, 10)
              : undefined,
          agent_id: currentUser.id,
          nom_agent: currentUser.nom,
        };
      }
      return c;
    });

    // 2. Déduction du statut et calcul strict de pulvérisation
    const totChambres = famille.nb_chambres_total || Math.max(1, nbPulv + nbNonPulv);
    const calc = calculateSprayCoverage(totChambres, nbPulv);

    let statutFam: Famille["statut_famille"] = "Pulvérisée complètement";
    if (nbPulv === 0) {
      if (motifPrincipal === "refus_chef") {
        statutFam = "Refusée";
      } else if (motifPrincipal === "absence") {
        statutFam = "Absente";
      } else {
        statutFam = "À repasser";
      }
    } else if (nbNonPulv > 0) {
      statutFam = "Partiellement pulvérisée";
    }

    // 3. Update famille
    const updatedFamilles = familles.map((f) => {
      if (f.id !== familleId) return f;
      return {
        ...f,
        chambres_pulverisees: nbPulv,
        chambres_non_pulverisees: nbNonPulv,
        statut_famille: statutFam,
        maison_entiere_pulverisee: calc.is100Pct,
        taux_couverture_famille_pct: calc.rate,
        date_dernier_passage: new Date().toISOString().substring(0, 10),
      };
    });

    setChambres(updatedChambres);
    setFamilles(updatedFamilles);

    // 4. Lier et recalculer instantanément le village à partir des données de terrain
    setVillages((prev) =>
      prev.map((v) => {
        if (v.id !== famille.village_id) return v;
        return syncVillageWithFieldData(v, updatedFamilles, updatedChambres);
      }),
    );

    addAudit(
      "ENREGISTREMENT_PASSAGE_IRS",
      "passages_familles",
      familleId,
      `Passage sur famille ${famille.chef_famille} (${famille.code_famille}) : ${statutFam} (${nbPulv}/${totChambres} pièces - Taux: ${calc.rate}%) par ${currentUser.nom}`,
    );

    return true;
  };

  // Add Entomology Vector record
  const addVecteur = (
    data: Omit<VecteurRecord, "id" | "agent_id" | "nom_agent">,
  ) => {
    const newRecord: VecteurRecord = {
      ...data,
      id: Date.now(),
      agent_id: currentUser.id,
      nom_agent: currentUser.nom,
    };
    setVecteurs((prev) => [newRecord, ...prev]);
    addAudit(
      "CAPTURE_VECTEURS",
      "vecteurs",
      newRecord.id,
      `Capture de ${data.quantite} spécimens de ${data.espece} à ${data.nom_village} (${data.methode_capture}) par ${currentUser.nom}`,
    );
  };

  // Admin toggles Saisie Permission
  const toggleUserSaisiePermission = (userId: number) => {
    if (currentUser.role !== "admin") {
      alert(
        "Seul l'Administrateur est habilité à modifier les droits de saisie des agents.",
      );
      return;
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = !u.peut_saisir;
          addAudit(
            updated ? "OCTROI_DROIT_SAISIE" : "RETRAIT_DROIT_SAISIE",
            "permissions",
            userId,
            `Modification des droits de saisie pour ${u.nom} : ${updated ? "Activé" : "Désactivé"}`,
          );
          return { ...u, peut_saisir: updated };
        }
        return u;
      }),
    );
  };

  // 1 - Admin: Active ou désactive les utilisateurs (Superviseur, Observateur)
  const toggleUserActive = (userId: number) => {
    if (currentUser.role !== "admin") {
      alert(
        "Seul l'Administrateur peut activer ou désactiver les comptes utilisateurs.",
      );
      return;
    }
    if (userId === currentUser.id) {
      alert("Impossible de désactiver votre propre compte administrateur.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextActive = !u.actif;
          addAudit(
            nextActive ? "ACTIVATION_COMPTE" : "DESACTIVATION_COMPTE",
            "users",
            userId,
            `${nextActive ? "Activation" : "Désactivation"} du compte ${u.nom} (${u.role}) par ${currentUser.nom}`,
          );
          return { ...u, actif: nextActive };
        }
        return u;
      }),
    );
  };

  // 1 - Admin: Liste de choix à allouer les privilèges (saisie, télécharger, partager, rapports, etc.)
  const updateUserPrivileges = (
    userId: number,
    privileges: Partial<UserPrivileges>,
  ) => {
    if (currentUser.role !== "admin") {
      alert(
        "Seul l'Administrateur est habilité à allouer ou modifier les privilèges.",
      );
      return;
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const telecharger =
            privileges.peut_telecharger !== undefined
              ? privileges.peut_telecharger
              : privileges.peut_exporter !== undefined
                ? privileges.peut_exporter
                : u.peut_telecharger;
          const updated: User = {
            ...u,
            ...privileges,
            peut_telecharger: telecharger,
            peut_exporter: telecharger,
          };
          addAudit(
            "ALLOCATION_PRIVILEGES_RBAC",
            "permissions",
            userId,
            `Mise à jour des privilèges pour ${u.nom} (${u.role}) : ` +
              `Saisie=${updated.peut_saisir}, Télécharger=${updated.peut_telecharger}, Partager=${updated.peut_partager}, Rapports=${updated.peut_generer_rapports}`,
          );
          return updated;
        }
        return u;
      }),
    );
  };

  // Admin updates full user info
  const updateUser = (userId: number, data: Partial<User>) => {
    if (currentUser.role !== "admin") {
      alert(
        "Seul l'Administrateur est habilité à modifier les informations des utilisateurs.",
      );
      return;
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...data };
          addAudit(
            "MODIFICATION_UTILISATEUR",
            "users",
            userId,
            `Mise à jour du compte ${updated.nom} (${updated.role})`,
          );
          return updated;
        }
        return u;
      }),
    );
  };

  // Admin adds user with full privileges configuration
  const addUser = (userData: {
    nom: string;
    matricule: string;
    email: string;
    role: UserRole;
    village_assigne_id?: number | null;
    peut_saisir?: boolean;
    privileges?: Partial<UserPrivileges>;
  }) => {
    if (currentUser.role !== "admin") return;
    const village = villages.find((v) => v.id === userData.village_assigne_id);

    // Default privilege matrix based on role
    const isObs = userData.role === "observateur";
    const isSup = userData.role === "superviseur";
    const isAdm = userData.role === "admin";

    const p = userData.privileges || {};
    const defaultSaisie = isObs
      ? false
      : userData.peut_saisir !== undefined
        ? userData.peut_saisir
        : true;
    const defaultTelecharger = isObs
      ? false
      : p.peut_telecharger !== undefined
        ? p.peut_telecharger
        : true;

    const newUser: User = {
      id: Date.now(),
      nom: userData.nom,
      matricule: userData.matricule,
      email: userData.email,
      role: userData.role,
      village_assigne_id: userData.village_assigne_id || null,
      nom_village_assigne: village ? village.nom : undefined,
      actif: true,
      peut_saisir: p.peut_saisir !== undefined ? p.peut_saisir : defaultSaisie,
      peut_telecharger: defaultTelecharger,
      peut_exporter: defaultTelecharger,
      peut_partager: isObs
        ? false
        : p.peut_partager !== undefined
          ? p.peut_partager
          : isAdm || isSup,
      peut_generer_rapports: isObs
        ? false
        : p.peut_generer_rapports !== undefined
          ? p.peut_generer_rapports
          : isAdm || isSup,
      peut_modifier: isObs
        ? false
        : p.peut_modifier !== undefined
          ? p.peut_modifier
          : isAdm || isSup,
      peut_supprimer: isAdm,
      derniere_connexion: new Date()
        .toISOString()
        .substring(0, 19)
        .replace("T", " "),
    };

    setUsers((prev) => [...prev, newUser]);
    addAudit(
      "CREATION_UTILISATEUR",
      "users",
      newUser.id,
      `Nouvel utilisateur créé : ${newUser.nom} (${newUser.matricule}, ${newUser.role})`,
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        villages,
        familles,
        chambres,
        dailySprays,
        vecteurs,
        auditLogs,
        isOnline,
        activeTab,
        isModuleLoading,
        setActiveTab: handleSetActiveTab,
        selectedVillageId,
        setSelectedVillageId,
        login,
        logout,
        switchUser,
        addVillage,
        updateVillage,
        deleteVillage,
        addDailySpray,
        updateDailySpray,
        deleteDailySpray,
        importDailySprays,
        allowAgentsEditLines,
        toggleAllowAgentsEditLines,
        addFamille,
        deleteFamille,
        resyncAllVillages,
        recordFamilyPassage,
        addVecteur,
        toggleUserSaisiePermission,
        toggleUserActive,
        updateUserPrivileges,
        updateUser,
        addUser,
        isReportModalOpen,
        reportModalContext,
        openReportModal,
        closeReportModal,
        preventionItems,
        addPreventionItem,
        deletePreventionItem,
        updatePreventionStatut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useApp doit être utilisé au sein de AppProvider");
  return context;
};
