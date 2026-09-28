import React, { useState, useRef, useId } from "react";
import { useApp } from "../context/AppContext";
import { PreventionItem, PreventionCategory, Village, DailySprayRecord } from "../types";
import { getHeatmapInfo } from "../utils/heatmap";
import {
  ShieldAlert,
  Sparkles,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  PlusCircle,
  HelpCircle,
  Stethoscope,
  Building2,
  Users,
  Target,
  Clock,
  Layers,
  Check,
  ChevronRight,
  ShieldCheck,
  Award,
  Calendar,
  Send,
  Trash2,
  Eye,
  Activity,
  Flame,
  Droplet,
  Compass,
  ArrowRight,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export const PreventionView: React.FC = () => {
  const {
    villages,
    dailySprays,
    familles,
    chambres,
    vecteurs,
    currentUser,
    preventionItems,
    addPreventionItem,
    deletePreventionItem,
    updatePreventionStatut,
    setActiveTab,
  } = useApp();

  // If not admin, security check
  if (currentUser.role !== "admin") {
    return (
      <div className="w-full bg-white rounded-2xl p-8 border border-red-200 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">
          Accès Réservé à l'Espace Administrateur
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          L'option "Préventions & Résolutions Épidémiologiques" est strictement
          réservée au Médecin-Chef et Administrateur de la SAG Siguiri.
        </p>
        <button
          onClick={() => setActiveTab("dashboard")}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  // Active view tab: "dashboard_resolutions" vs "document_5_pages"
  const [activeTabMode, setActiveTabMode] = useState<"interactive" | "document">(
    "interactive",
  );

  // Filters
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<
    number | "all"
  >("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New Request Form State (Demande de l'Admin)
  const [requestVillageId, setRequestVillageId] = useState<number | "all">("all");
  const [requestCategory, setRequestCategory] =
    useState<PreventionCategory>("analyse_ligne_excel");
  const [requestExcelLine, setRequestExcelLine] = useState<number | "none">(12);
  const [customProblemTitle, setCustomProblemTitle] = useState("");
  const [customProblemDescription, setCustomProblemDescription] = useState("");
  const [isSubmittingAnalysis, setIsSubmittingAnalysis] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  // 5-Page Document Preview & PDF Export State
  const [activeDocumentPage, setActiveDocumentPage] = useState<number | "all">(
    "all",
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [uniqueDocReference] = useState(
    () => `SAG-PREV-2026-N°${Math.floor(100000 + Math.random() * 900000)}`,
  );

  // Target dataset calculations
  const totalStructuresCibles = villages.reduce(
    (acc, v) => acc + v.nb_structures_total,
    0,
  );
  const totalStructuresPulverisees = villages.reduce(
    (acc, v) => acc + v.structures_pulverisees,
    0,
  );
  const globalCoveragePct =
    totalStructuresCibles > 0
      ? Number(
          ((totalStructuresPulverisees / totalStructuresCibles) * 100).toFixed(
            1,
          ),
        )
      : 0;

  const totalFamillesCibles = villages.reduce(
    (acc, v) => acc + v.familles_totales,
    0,
  );
  const totalFamillesPulverisees = villages.reduce(
    (acc, v) => acc + v.familles_pulverisees,
    0,
  );
  const famillesCoveragePct =
    totalFamillesCibles > 0
      ? Number(
          ((totalFamillesPulverisees / totalFamillesCibles) * 100).toFixed(1),
        )
      : 0;

  const totalPopProtegee = villages.reduce(
    (acc, v) => acc + v.pop_couverte_total,
    0,
  );
  const totalFemmesEnceintes = villages.reduce(
    (acc, v) => acc + v.pop_femme_enceinte,
    0,
  );
  const totalEnfants05 = villages.reduce(
    (acc, v) => acc + v.pop_enfant_0_5,
    0,
  );
  const totalBidons = villages.reduce(
    (acc, v) => acc + v.can_refills_total,
    0,
  );
  const structuresPerBidon =
    totalBidons > 0
      ? (totalStructuresPulverisees / totalBidons).toFixed(2)
      : "5.45";

  // Filtered Preventions List
  const filteredPreventions = preventionItems.filter((item) => {
    const matchVillage =
      selectedVillageFilter === "all" ||
      item.villageId === selectedVillageFilter ||
      item.villageCible.toLowerCase().includes(
        villages
          .find((v) => v.id === selectedVillageFilter)
          ?.nom.toLowerCase() || "",
      );
    const matchCat =
      selectedCategoryFilter === "all" || item.categorie === selectedCategoryFilter;
    const matchSearch =
      item.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descriptionProbleme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.villageCible.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.codeReference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchVillage && matchCat && matchSearch;
  });

  // PRESETS OF COMMON ADMIN PROBLEMS & EXCEL LINE ISSUES
  const PROBLEM_PRESETS = [
    {
      titre: "Analyse Dérive Ligne Excel 1→30 (Sur-consommation d'Actellic)",
      categorie: "analyse_ligne_excel" as PreventionCategory,
      line: 12,
      villageId: 1, // Fienkolen
      description:
        "L'auscultation de la ligne 12 révèle un ratio anormalement bas de 3.0 structures/bidon au lieu de 5.4, indiquant une surconsommation de +44% d'insecticide et une possible buse usée.",
    },
    {
      titre: "Poches de Refus Chefs de Concession & Maisons Incomplètes",
      categorie: "refus_chef" as PreventionCategory,
      line: 4,
      villageId: 3, // Kolenda
      description:
        "Refus de traitement exprimé par 3 chefs de concessions familiales craignant pour leurs récoltes de maïs et leur bétail, bloquant 8 chambres au centre de la localité.",
    },
    {
      titre: "Concessions Fermées & Absences lors du Premier Passage Matinal",
      categorie: "chambres_fermees" as PreventionCategory,
      line: 8,
      villageId: 2, // Silabada
      description:
        "12 concessions trouvées portes closes entre 07h30 et 10h00 en raison du départ précoce des ménages vers les placers d'orpaillage artisanal.",
    },
    {
      titre: "Décrochage sous le Seuil Contractuel OMS de 97% & Ratissage",
      categorie: "ecart_seuil_97" as PreventionCategory,
      line: 15,
      villageId: 4, // Tintissabani
      description:
        "Le taux de couverture stagne à 95.8% avec un écart de -1.2% à la norme contractuelle SAG/OMS. Nécessité d'un round de ratissage d'urgence (Mop-up round).",
    },
    {
      titre: "Bouclier de Protection Mère-Enfant & Groupes Vulnérables",
      categorie: "groupes_vulnerables" as PreventionCategory,
      line: 18,
      villageId: 6, // Fadako
      description:
        "Recensement d'une forte concentration de 62 femmes enceintes et 455 enfants <5ans nécessitant un couplage immédiat IRS et distribution de moustiquaires MILDA.",
    },
    {
      titre: "Surveillance Entomologique & Baisse de Rémanence Actellic",
      categorie: "resistance_vectorielle" as PreventionCategory,
      line: 22,
      villageId: 1, // Fienkolen
      description:
        "Surveillance des bio-essais cônes OMS après 45 jours d'exposition pour surveiller la mortalité 24h des Anopheles gambiae s.l. en zone fluviale.",
    },
  ];

  const handleApplyPreset = (index: number) => {
    setActivePresetIndex(index);
    const p = PROBLEM_PRESETS[index];
    setCustomProblemTitle(p.titre);
    setCustomProblemDescription(p.description);
    setRequestCategory(p.categorie);
    setRequestExcelLine(p.line);
    setRequestVillageId(p.villageId);
  };

  // Launch Automated Deep Diagnostic & Generate Solution
  const handleLaunchAnalysis = () => {
    if (!customProblemTitle.trim() && activePresetIndex === null) {
      alert("Veuillez renseigner le titre ou le problème à analyser.");
      return;
    }

    setIsSubmittingAnalysis(true);

    const targetVillageObj =
      requestVillageId === "all"
        ? null
        : villages.find((v) => v.id === requestVillageId);
    const villageName = targetVillageObj
      ? targetVillageObj.nom
      : "Consolidé District de Siguiri";

    // Dynamic calculations based on real data
    const structCible = targetVillageObj
      ? targetVillageObj.nb_structures_total
      : totalStructuresCibles;
    const structPulv = targetVillageObj
      ? targetVillageObj.structures_pulverisees
      : totalStructuresPulverisees;
    const rate =
      structCible > 0 ? ((structPulv / structCible) * 100).toFixed(1) : "97.0";
    const delta = (Number(rate) - 97.0).toFixed(1);

    const lineNum =
      requestExcelLine !== "none" ? Number(requestExcelLine) : 1;
    const lineLabel =
      requestExcelLine !== "none"
        ? `Ligne ${lineNum} du Registre Excel 1→30`
        : "Synthèse Consolidée des Feuilles Excel";

    const titleToUse =
      customProblemTitle.trim() ||
      (activePresetIndex !== null
        ? PROBLEM_PRESETS[activePresetIndex].titre
        : "Analyse de Prévention Épidémiologique");

    const descToUse =
      customProblemDescription.trim() ||
      (activePresetIndex !== null
        ? PROBLEM_PRESETS[activePresetIndex].description
        : `Analyse et préconisations pour ${villageName} à partir des relevés de terrain.`);

    // Generate tailored solutions and root causes based on request category
    let immediateAction = "";
    let mediumTermAction = "";
    let structuralAction = "";
    let cityAdvice = "";
    let chemicalProtocol = "";
    let targetKPI = "";
    let rootCauses: string[] = [];

    switch (requestCategory) {
      case "analyse_ligne_excel":
      case "sous_dosage_chimique":
        immediateAction =
          "Calibrage au débitmètre d'eau à 550 ml/min et remplacement des buses céramiques 8002E défectueuses sur le pulvérisateur concerné.";
        mediumTermAction =
          "Formation accélérée des 2 opérateurs de la brigade au rythme métré de 5 secondes par bande de 2 mètres.";
        structuralAction =
          "Système de verrouillage logiciel Excel interdisant la validation des feuilles journalières si le ratio s'écarte de 5.4 ± 15%.";
        cityAdvice = `Adapter les dotations de stocks d'Actellic 300cs pour ${villageName} et consigner les bidons vidés avec triple rinçage.`;
        chemicalProtocol =
          "Maintien de la dosimétrie réglementaire OMS à 1.0 g m.a./m² d'Actellic 300CS avec pression manomètre stabilisée à 45 PSI.";
        targetKPI = "Régularisation du ratio à 5.4 structures/bidon sous 24h.";
        rootCauses = [
          "Élargissement de l'orifice de buse suite à l'abrasion des suspensions chimiques",
          "Vitesse d'application trop lente de l'opérateur de terrain",
          "Vanne de contrôle de pression (CFV) fatiguée nécessitant un détartrage",
        ];
        break;

      case "refus_chef":
        immediateAction =
          "Médiation directe par le Dr. Faremba Doumbouya accompagné du Doyen des Sages et du Chef de District avec bâches de protection vivrières.";
        mediumTermAction =
          "Opération de repassage (Mop-up round) confiée à une équipe féminine d'opératrices de pulvérisation.";
        structuralAction =
          "Engagement communautaire préalable avec protocole coutumier signé avant chaque campagne annuelle.";
        cityAdvice = `Campagne d'affichage explicative en langue Malinké au marché central et à la mosquée de ${villageName}.`;
        chemicalProtocol =
          "Application soignée en assurant l'aération obligatoire de 2 heures avant la réoccupation des pièces.";
        targetKPI = "100% des chambres refusées pulvérisées dans les 48 heures.";
        rootCauses = [
          "Craintes infondées sur la salubrité des céréales entreposées",
          "Déficit d'information préalable du chef de concession",
          "Habitudes culturelles nécessitant une approche par les aînés du village",
        ];
        break;

      case "chambres_fermees":
        immediateAction =
          "Déploiement d'une brigade crépusculaire de 17h00 à 19h30 pour traiter les concessions au retour des placers d'orpaillage.";
        mediumTermAction =
          "Identification de référents de quartier dépositaires temporaires des clés avec reçu certifié.";
        structuralAction =
          "Adaptation des plannings de passage sur les jours de repos hebdomadaires des mineurs artisanaux.";
        cityAdvice = `Annonces synchronisées par le crieur public la veille du passage à ${villageName}.`;
        chemicalProtocol =
          "Traitement méthodique sans encombrement, vérification des greniers et placards.";
        targetKPI = "Réduction des absences à moins de 2% des concessions recensées.";
        rootCauses = [
          "Départ précoce des ménages vers les sites miniers SAG et orpaillages",
          "Non-concordance des horaires de passage standard avec la vie économique locale",
        ];
        break;

      case "groupes_vulnerables":
        immediateAction =
          "Couplage systématique du traitement des habitations avec la dotation immédiate de moustiquaires MILDA de dernière génération.";
        mediumTermAction =
          "Consultations prénatales avancées au poste de santé et distribution préventive de TPIg.";
        structuralAction =
          "Suivi épidémiologique trimestriel de la prévalence palustre chez les nourrissons en pédiatrie SAG Koron.";
        cityAdvice = `Sensibilisation personnalisée des mères de famille de ${villageName} au couchage dès le coucher du soleil.`;
        chemicalProtocol =
          "Pulvérisation méticuleuse des angles morts et sous-pentes où se concentrent les anophèles en journée.";
        targetKPI = "Zéro accès palustre grave recensé chez les enfants de moins de 5 ans.";
        rootCauses = [
          "Vulnérabilité immunitaire naturelle des jeunes enfants et femmes enceintes",
          "Sommeil ponctuel hors moustiquaire lors des fortes chaleurs",
        ];
        break;

      default:
        immediateAction =
          "Ratissage immédiat des zones à risque et consolidation des données du classeur Excel.";
        mediumTermAction =
          "Audit de conformité des brigades d'application sous la supervision directe du Dr. Colonel Magassouba.";
        structuralAction =
          "Intégration pérenne des recommandations dans le plan stratégique quinquennal SAG Siguiri.";
        cityAdvice = `Soutien logistique renforcé pour le secteur de ${villageName}.`;
        chemicalProtocol =
          "Actellic 300CS dilué selon les préconisations du fabricant et standards OMS.";
        targetKPI = "Atteinte d'une couverture ≥ 97.5% certifiée.";
        rootCauses = [
          "Dispersion géographique de certaines concessions",
          "Conditions climatiques ou logistiques de brousse",
        ];
        break;
    }

    // Create and save prevention item
    addPreventionItem({
      auteur: "Dr. Faremba Doumbouya (Admin en Chef)",
      categorie: requestCategory,
      titre: titleToUse,
      villageCible: villageName,
      villageId: targetVillageObj ? targetVillageObj.id : undefined,
      ligneExcelNumero: requestExcelLine !== "none" ? lineNum : undefined,
      ligneExcelLabel: lineLabel,
      descriptionProbleme: descToUse,
      analyseDiagnostique: {
        resume: `Diagnostic épidémiologique et technique établi pour ${villageName}. Taux de couverture actuel : ${rate}% (Écart au seuil 97% OMS : ${delta}%).`,
        donneesConstatees: [
          {
            libelle: "Taux de Couverture Localité",
            valeur: `${rate}%`,
            norme: "≥ 97.0%",
            ecart: `${delta}%`,
            statutGravite: Number(rate) >= 97 ? "Sous Contrôle" : "Majeur",
          },
          {
            libelle: "Structures Cibles / Traitées",
            valeur: `${structPulv} / ${structCible}`,
            norme: "100% Cibles",
            ecart: `${structCible - structPulv} restantes`,
            statutGravite: structCible - structPulv > 10 ? "Critique" : "Modéré",
          },
          {
            libelle: "Rendement Insecticide Ligne",
            valeur: `${structuresPerBidon} struct./bidon`,
            norme: "5.40 struct./bidon",
            ecart: `${(Number(structuresPerBidon) - 5.4).toFixed(2)} struct.`,
            statutGravite:
              Math.abs(Number(structuresPerBidon) - 5.4) > 1
                ? "Critique"
                : "Sous Contrôle",
          },
          {
            libelle: "Groupes Vulnérables Protégés",
            valeur: `${totalFemmesEnceintes} enceintes · ${totalEnfants05} enfants <5ans`,
            norme: "Protection Totale",
            ecart: "Priorité Maximale",
            statutGravite: "Sous Contrôle",
          },
        ],
        causesRacines: rootCauses,
        impactPopulation: `Protection directe de la population de ${villageName} contre les piqûres infectantes d'Anopheles gambiae.`,
      },
      moyensPreventionEtResolution: {
        actionImmediate24h: immediateAction,
        actionMoyenTerme7j: mediumTermAction,
        resolutionStructurelle: structuralAction,
        recommandationsVille: cityAdvice,
        protocoleChimiqueEtTechnique: chemicalProtocol,
        indicateurCibleSuivi: targetKPI,
      },
      statut: "Validé & Préconisé",
    });

    setIsSubmittingAnalysis(false);
    setCustomProblemTitle("");
    setCustomProblemDescription("");
    setActivePresetIndex(null);
    alert(
      ` Analyse diagnostique validée ! La fiche de prévention pour ${villageName} a été enregistrée avec succès et intégrée au Document Officiel de Prévention (5 Feuillets A4).`,
    );
  };

  // =========================================================================
  // MULTI-PAGE 5-PAGE A4 PDF GENERATOR (jspdf + html2canvas)
  // =========================================================================
  const handleDownload5PagePDF = async () => {
    setIsDownloadingPdf(true);
    setPdfProgress("Initialisation de l'exportation du Document 5 Pages A4...");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageIds = [
        "prevention-a4-page-1",
        "prevention-a4-page-2",
        "prevention-a4-page-3",
        "prevention-a4-page-4",
        "prevention-a4-page-5",
      ];

      for (let i = 0; i < pageIds.length; i++) {
        const pageId = pageIds[i];
        setPdfProgress(
          `Génération du Feuillet A4 ${i + 1} / 5 (Rendu haute précision)...`,
        );

        const element = document.getElementById(pageId);
        if (element) {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          if (i > 0) {
            pdf.addPage("a4", "portrait");
          }
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }
      }

      setPdfProgress("Finalisation du document PDF certifié...");
      pdf.save(`Document_Officiel_Preventions_SAG_Koron_2026.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération PDF:", error);
      alert(
        "Génération directe indisponible, redirection vers l'impression système.",
      );
      window.print();
    } finally {
      setIsDownloadingPdf(false);
      setPdfProgress("");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcelPreventions = () => {
    const wb = XLSX.utils.book_new();

    const dataRows: (string | number)[][] = [
      ["PROGRAMME DE LUTTE CONTRE LE PALUDISME - HOPITAL DE KORON (SAG SIGUIRI)"],
      ["DOCUMENT STRATEGIQUE DE PREVENTION ET DE RESOLUTION DES PROBLEMES"],
      ["AUTEUR / ADMINISTRATEUR :", currentUser.nom],
      ["DATE D'EDITION :", new Date().toLocaleDateString("fr-FR")],
      ["REFERENCE OFFICIELLE :", uniqueDocReference],
      [""],
      [
        "CODE REF",
        "DATE",
        "LOCALITE CIBLE",
        "LIGNE EXCEL ANALYSEE",
        "CATEGORIE",
        "PROBLEME POSE",
        "DIAGNOSTIC CHIFFRE",
        "ACTION IMMEDIATE (24H)",
        "ACTION MOYEN TERME (7J)",
        "RESOLUTION STRUCTURELLE",
        "RECOMMANDATION VILLE",
        "STATUT",
      ],
    ];

    preventionItems.forEach((p) => {
      dataRows.push([
        p.codeReference,
        p.dateCreation,
        p.villageCible,
        p.ligneExcelLabel || "Consolidé",
        p.categorie,
        p.descriptionProbleme,
        p.analyseDiagnostique.resume,
        p.moyensPreventionEtResolution.actionImmediate24h,
        p.moyensPreventionEtResolution.actionMoyenTerme7j,
        p.moyensPreventionEtResolution.resolutionStructurelle,
        p.moyensPreventionEtResolution.recommandationsVille,
        p.statut,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, ws, "Preventions_SAG_2026");
    XLSX.writeFile(wb, `Preventions_Solutions_SAG_Koron_2026.xlsx`);
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ========================================================================= */}
      {/* 1. TOP EDITORIAL BANNER & ADMIN BADGE                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              Espace Administrateur en Chef · Option Spéciale Préventions
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-600">
              Audit Épidémiologique & Solutions Opérationnelles
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Préventions, Analyse des Feuilles Excel & Résolution des Demandes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-4xl">
            Auscultation chirurgicale des données des 20 villages, fiches de
            chambres IRS, feuilles de calculs journalières (Lignes 1→30) et
            génération certifiée du Document Officiel de Prévention (5 Feuillets
            A4 téléchargeables en PDF).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTabMode("interactive")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTabMode === "interactive"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Moteur de Diagnostic & Demandes ({preventionItems.length})
          </button>

          <button
            onClick={() => setActiveTabMode("document")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTabMode === "document"
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            Document Officiel 5 Pages (PDF A4)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONSOLIDATED PLATFORM KPIS                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">
            Localités Évaluées
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            20 villages
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            District SAG Siguiri
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">
            Couverture Chambres (IRS)
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {globalCoveragePct}%
          </div>
          <div className="text-[10px] text-amber-700 font-bold mt-1">
            Seuil Requis : ≥ 97.0%
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">
            Structures Réalisées
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {totalStructuresPulverisees.toLocaleString("fr-FR")}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            sur {totalStructuresCibles.toLocaleString("fr-FR")} cibles
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">
            Rendement Insecticide
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {structuresPerBidon}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            structures / bidon 10L
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">
            Groupes Vulnérables
          </div>
          <div className="text-lg font-bold font-mono text-purple-900 mt-0.5">
            {(totalFemmesEnceintes + totalEnfants05).toLocaleString("fr-FR")}
          </div>
          <div className="text-[10px] text-purple-700 font-medium mt-1">
            {totalFemmesEnceintes} enc. · {totalEnfants05} &lt;5ans
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800">
            Préventions Formulées
          </div>
          <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
            {preventionItems.length} fiches
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            100% résolues & préconisées
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE DIAGNOSTIC & PROBLEM SOLVER ENGINE                         */}
      {/* ========================================================================= */}
      {activeTabMode === "interactive" && (
        <div className="space-y-6">
          {/* Main Solver Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Moteur d'Auscultation & Demande de l'Administrateur
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Formulez une demande, choisissez une localité ou une ligne
                    du registre Excel : le système analyse les données et
                    propose les solutions immédiates.
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-auto">
                Validé par : {currentUser.nom} (Admin)
              </span>
            </div>

            {/* Presets Quick Pickers */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                Cas Fréquents & Problèmes Types Détectés sur la Plateforme :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PROBLEM_PRESETS.map((preset, idx) => {
                  const isSelected = activePresetIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(idx)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/30"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="truncate">{preset.titre}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom parameters form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Localité / Ville Cible :
                </label>
                <select
                  value={requestVillageId}
                  onChange={(e) =>
                    setRequestVillageId(
                      e.target.value === "all" ? "all" : Number(e.target.value),
                    )
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="all">
                     Consolidé - Ensemble des 20 Localités SAG
                  </option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom} ({v.taux_structures_pct}% couv.,{" "}
                      {v.nb_structures_total} struct.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Ligne Excel de Calcul Auscultée :
                </label>
                <select
                  value={requestExcelLine}
                  onChange={(e) =>
                    setRequestExcelLine(
                      e.target.value === "none"
                        ? "none"
                        : Number(e.target.value),
                    )
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="none">
                     Aucune ligne spécifique (Analyse globale village)
                  </option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Ligne {num} - Registre Excel Terrain (Formule =SUM 1→30)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Nature de la Problématique :
                </label>
                <select
                  value={requestCategory}
                  onChange={(e) =>
                    setRequestCategory(e.target.value as PreventionCategory)
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="analyse_ligne_excel">
                     Dérive de Calcul Ligne Excel / Ratio Chimique
                  </option>
                  <option value="refus_chef">
                     Refus Chef de Concession / Maisons Partielles
                  </option>
                  <option value="chambres_fermees">
                     Chambres Fermées / Absences Matinales
                  </option>
                  <option value="ecart_seuil_97">
                     Décrochage sous le seuil contractuel 97%
                  </option>
                  <option value="groupes_vulnerables">
                     Protection Prioritaire Mère-Enfant
                  </option>
                  <option value="resistance_vectorielle">
                     Surveillance Entomologique & Rémanence
                  </option>
                  <option value="requete_personnalisee">
                     Question / Demande Spécifique Libre
                  </option>
                </select>
              </div>
            </div>

            {/* Custom Prompt & Instructions */}
            <div className="space-y-2 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objet de la Demande / Titre du Problème :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Analyse de la ligne 12 et résolution de la baisse de couverture au quartier Nord..."
                  value={customProblemTitle}
                  onChange={(e) => setCustomProblemTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Détail du Problème Posé par l'Administrateur :
                </label>
                <textarea
                  rows={2}
                  placeholder="Décrivez ici la situation constatée, l'écart constaté, ou la solution demandée..."
                  value={customProblemDescription}
                  onChange={(e) => setCustomProblemDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Action button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-500">
                 Le moteur applique automatiquement les normes OMS et les
                formules du classeur SAG Siguiri.
              </div>

              <button
                type="button"
                onClick={handleLaunchAnalysis}
                disabled={isSubmittingAnalysis}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                
                <span>
                  {isSubmittingAnalysis
                    ? "Analyse en cours..."
                    : "Lancer l'Analyse Diagnostique & Résoudre le Problème"}
                </span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher une prévention, une localité, une ligne..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedVillageFilter}
                onChange={(e) =>
                  setSelectedVillageFilter(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium"
              >
                <option value="all">Toutes localités ({villages.length})</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nom}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium hidden md:block"
              >
                <option value="all">Toutes catégories</option>
                <option value="analyse_ligne_excel">Lignes Excel</option>
                <option value="refus_chef">Refus Chefs</option>
                <option value="chambres_fermees">Chambres Fermées</option>
                <option value="groupes_vulnerables">Groupes Vulnérables</option>
                <option value="resistance_vectorielle">Entomologie</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcelPreventions}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabMode("document")}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voir le Document 5 Pages (PDF)</span>
              </button>
            </div>
          </div>

          {/* List of Asked and Answered Preventions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Registre des Préventions Demandées & Répondues (
                {filteredPreventions.length} fiches)
              </h3>
              <span className="text-[11px] text-slate-400">
                Toutes les fiches sont intégrées dans le Document 5 Pages
              </span>
            </div>

            {filteredPreventions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Aucune fiche de prévention ne correspond à ces critères
                </p>
                <p className="text-[11px] text-slate-400">
                  Utilisez le formulaire ci-dessus pour lancer une analyse ou
                  réinitialisez les filtres.
                </p>
              </div>
            ) : (
              filteredPreventions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Card Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                        {item.codeReference}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {item.titre}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {item.statut}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.dateCreation} {item.heureCreation}
                      </span>
                      <button
                        onClick={() => deletePreventionItem(item.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Supprimer la fiche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    {/* Meta Info Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Localité / Ville Cible :
                        </span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {item.villageCible}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Ligne Excel Auscultée :
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          {item.ligneExcelLabel || "Consolidé"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Auteur de la Préconisation :
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          {item.auteur}
                        </span>
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Problématique Soumise par l'Administrateur :
                      </h4>
                      <p className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                        {item.descriptionProbleme}
                      </p>
                    </div>

                    {/* Quantitative Diagnostic Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        Auscultation & Données Chiffrées Constatées :
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {item.analyseDiagnostique.donneesConstatees.map(
                          (d, didx) => (
                            <div
                              key={didx}
                              className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                            >
                              <div className="text-[10px] text-slate-500">
                                {d.libelle}
                              </div>
                              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                                {d.valeur}
                              </div>
                              <div className="text-[10px] text-slate-600 flex items-center justify-between mt-0.5">
                                <span>Norme: {d.norme}</span>
                                <span
                                  className={`font-semibold ${
                                    d.statutGravite === "Critique"
                                      ? "text-red-600"
                                      : d.statutGravite === "Majeur"
                                        ? "text-amber-600"
                                        : "text-emerald-700"
                                  }`}
                                >
                                  {d.ecart}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Solutions and Means of Prevention */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5"> 
                        Moyens de Prévention & Solutions Opérationnelles :
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                             Action Immédiate (24h)
                          </span>
                          <p className="text-[11px] text-emerald-950 leading-relaxed font-medium">
                            {
                              item.moyensPreventionEtResolution
                                .actionImmediate24h
                            }
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                             Action Moyen Terme (J+7)
                          </span>
                          <p className="text-[11px] text-blue-950 leading-relaxed font-medium">
                            {
                              item.moyensPreventionEtResolution
                                .actionMoyenTerme7j
                            }
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                          <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                             Résolution Structurelle
                          </span>
                          <p className="text-[11px] text-purple-950 leading-relaxed font-medium">
                            {
                              item.moyensPreventionEtResolution
                                .resolutionStructurelle
                            }
                          </p>
                        </div>
                      </div>

                      {/* City advice and chemical protocol footer */}
                      <div className="p-2.5 bg-slate-900 text-white rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-300">
                          <span className="text-amber-400 font-bold">
                            Conseil Ville ({item.villageCible}) :{" "}
                          </span>
                          {item.moyensPreventionEtResolution.recommandationsVille}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
                           {item.moyensPreventionEtResolution.indicateurCibleSuivi}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. THE 5-PAGE OFFICIAL PDF DOCUMENT CONTAINER                             */}
      {/* ========================================================================= */}
      {activeTabMode === "document" && (
        <div className="space-y-6">
          {/* Action and Download Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                5P
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Document Officiel de Prévention & Résolution Épidémiologique
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    5 Feuillets A4 Conformes
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {uniqueDocReference} · Validation Hôpital de Koron · {currentUser.nom}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Page Navigator Filter */}
              <div className="flex items-center bg-slate-800 p-1 rounded-lg text-xs">
                {["all", 1, 2, 3, 4, 5].map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setActiveDocumentPage(pg as any)}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      activeDocumentPage === pg
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {pg === "all" ? "Tout voir (5p)" : `Page ${pg}`}
                  </button>
                ))}
              </div>

              {/* DIRECT PDF DOWNLOAD */}
              <button
                type="button"
                disabled={isDownloadingPdf}
                onClick={handleDownload5PagePDF}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {isDownloadingPdf
                    ? pdfProgress || "Génération PDF..."
                    : "Télécharger en format PDF (.pdf)"}
                </span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / PDF Système</span>
              </button>
            </div>
          </div>

          {/* Progress Toast */}
          {isDownloadingPdf && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-3 font-semibold shadow-sm animate-pulse no-print">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
              <span>{pdfProgress}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* THE 5 STANDARDIZED A4 PAGES (210mm x 297mm)                               */}
          {/* ========================================================================= */}
          <div className="w-full flex flex-col items-center justify-center space-y-6 print:space-y-0">
            {/* --------------------------------------------------------------------- */}
            {/* FEUILLET 1 : PAGE DE GARDE INSTITUTIONNELLE & CADRE DE MISSION PRÉVENTION */}
            {/* --------------------------------------------------------------------- */}
            {(activeDocumentPage === "all" || activeDocumentPage === 1) && (
              <div
                id="prevention-a4-page-1"
                className="a4-page-cover bg-slate-950 text-white flex flex-col justify-between border border-slate-300 print:border-none"
                style={{ padding: "40px 50px" }}
              >
                <img
                  src="/assets/images/image1.svg"
                  alt="Sceau Officiel SAG"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/35 to-black/95 pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl shadow-lg">
                      
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                        HÔPITAL DE KORON · ANGLOGOLD ASHANTI SAG
                      </div>
                      <div className="text-[11px] text-slate-200 font-medium">
                        District Sanitaire de Siguiri · République de Guinée
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">
                        Programme National de Lutte contre le Paludisme (PNLP)
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-300">
                    <div className="text-emerald-400 font-bold">
                      CELLULE ÉPIDÉMIOLOGIQUE CENTRALE
                    </div>
                    <div>CAMPAGNE IRS 2026</div>
                    <div className="text-[10px] text-amber-300 font-bold">
                      {uniqueDocReference}
                    </div>
                  </div>
                </div>

                {/* Center Title & Mission Description */}
                <div className="relative z-10 w-full my-auto space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-mono font-black uppercase tracking-wider shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                    DOSSIER DE PRÉVENTION & GESTION DES CRISES · FEUILLET 1 / 5
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    PLAN DIRECTEUR STRATÉGIQUE DE PRÉVENTION & RÉSOLUTION ÉPIDÉMIOLOGIQUE
                  </h1>

                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    Auscultation des feuilles de calculs journalières (Lignes 1→30),
                    audit des refus de chefs de concessions, calibrage des dosimétries
                    d'Actellic 300CS et compilation des résolutions médicales
                    certifiées.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                    <div className="bg-black/50 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                      <div className="text-slate-400 text-[10px]">
                        Périmètre :
                      </div>
                      <div className="font-bold text-white">
                        20 Villages SAG
                      </div>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                      <div className="text-slate-400 text-[10px]">
                        Insecticide Clé :
                      </div>
                      <div className="font-bold text-emerald-400">
                        Actellic 300CS
                      </div>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                      <div className="text-slate-400 text-[10px]">
                        Objectif Seuil :
                      </div>
                      <div className="font-bold text-amber-300">
                        ≥ 97.0% Couverture
                      </div>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                      <div className="text-slate-400 text-[10px]">
                        Préventions Traitées :
                      </div>
                      <div className="font-bold text-purple-300">
                        {preventionItems.length} Résolutions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="relative z-10 pt-4 border-t border-white/20 flex flex-wrap items-end justify-between gap-4 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Médecin-Chef & Auteur Référent
                    </div>
                    <div className="text-sm font-bold text-white">
                      Dr. Faremba Doumbouya
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Directeur Médical Hôpital de Koron · SAG Siguiri
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-300">
                    <div>
                      Édition officielle du :{" "}
                      <span className="text-white font-bold">
                        {new Date().toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Signature Numérique & Sceau Hospitalier Certifié
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* FEUILLET 2 : DIAGNOSTIC CONSOLIDÉ DES 20 LOCALITÉS DU DISTRICT        */}
            {/* --------------------------------------------------------------------- */}
            {(activeDocumentPage === "all" || activeDocumentPage === 2) && (
              <div
                id="prevention-a4-page-2"
                className="a4-page bg-white text-slate-900 border border-slate-300 print:border-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                      FEUILLET 2 / 5
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Diagnostic Consolidé de la Plateforme & 20 Localités
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {uniqueDocReference}
                  </span>
                </div>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      1. Synthèse Épidémiologique des 20 Localités du District de Siguiri
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Regroupement exhaustif des données : recensement des structures,
                      concessions familiales, recharges de bidons d'insecticide et
                      populations protégées.
                    </p>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[9px] text-slate-500 font-semibold uppercase">
                        Population Totale
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                        {totalPopProtegee.toLocaleString("fr-FR")} hab.
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[9px] text-slate-500 font-semibold uppercase">
                        Chambres Traitées
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                        {totalStructuresPulverisees.toLocaleString("fr-FR")} /{" "}
                        {totalStructuresCibles.toLocaleString("fr-FR")}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[9px] text-slate-500 font-semibold uppercase">
                        Taux Global Réalisé
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
                        {globalCoveragePct}%
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[9px] text-slate-500 font-semibold uppercase">
                        Écart Objectif 97%
                      </div>
                      <div
                        className={`text-sm font-mono font-bold mt-0.5 ${
                          globalCoveragePct >= 97
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {Number((globalCoveragePct - 97).toFixed(1)) >= 0
                          ? `+${(globalCoveragePct - 97).toFixed(1)}%`
                          : `${(globalCoveragePct - 97).toFixed(1)}%`}
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive 20 Villages Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[9px] border-collapse">
                      <thead className="bg-slate-900 text-white font-mono">
                        <tr>
                          <th className="p-1 pl-2">Code</th>
                          <th className="p-1">Localité / Village</th>
                          <th className="p-1 text-right">Pop. Totale</th>
                          <th className="p-1 text-right">Structures Cibles</th>
                          <th className="p-1 text-right">Pulvérisées</th>
                          <th className="p-1 text-right">Taux IRS %</th>
                          <th className="p-1 text-right">Bidons</th>
                          <th className="p-1 text-center">Conformité OMS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {villages.slice(0, 17).map((v) => {
                          const isConforme = v.taux_structures_pct >= 97;
                          return (
                            <tr
                              key={v.id}
                              className={
                                isConforme ? "hover:bg-slate-50" : "bg-amber-50/50"
                              }
                            >
                              <td className="p-1 pl-2 font-bold text-slate-800">
                                {v.code}
                              </td>
                              <td className="p-1 font-semibold text-slate-900">
                                {v.nom}
                              </td>
                              <td className="p-1 text-right">
                                {v.pop_couverte_total.toLocaleString("fr-FR")}
                              </td>
                              <td className="p-1 text-right">
                                {v.nb_structures_total}
                              </td>
                              <td className="p-1 text-right font-bold">
                                {v.structures_pulverisees}
                              </td>
                              <td className="p-1 text-right font-bold text-emerald-800">
                                {v.taux_structures_pct}%
                              </td>
                              <td className="p-1 text-right">
                                {v.can_refills_total}
                              </td>
                              <td className="p-1 text-center font-sans">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                    isConforme
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isConforme ? "≥ 97% CONFORME" : "MOP-UP REQUIS"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Demographic and Vulnerability Synthesis */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-500 font-semibold block">
                        Femmes Enceintes sous Protection :
                      </span>
                      <span className="font-bold text-purple-900 font-mono text-xs">
                        {totalFemmesEnceintes.toLocaleString("fr-FR")} mères
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">
                        Enfants de Moins de 5 Ans Protégés :
                      </span>
                      <span className="font-bold text-purple-900 font-mono text-xs">
                        {totalEnfants05.toLocaleString("fr-FR")} nourrissons
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">
                        Indice de Priorité Mère-Enfant :
                      </span>
                      <span className="font-bold text-emerald-800 font-mono text-xs">
                        {totalPopProtegee > 0
                          ? (
                              ((totalFemmesEnceintes + totalEnfants05) /
                                totalPopProtegee) *
                              100
                            ).toFixed(1)
                          : "45.0"}
                        % de la démographie
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Hôpital de Koron · SAG Siguiri (Guinée)</span>
                  <span>Document Certifié · Feuillet 2 / 5</span>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* FEUILLET 3 : ANALYSE CHIRURGICALE DES LIGNES ET FEUILLES EXCEL 1→30   */}
            {/* --------------------------------------------------------------------- */}
            {(activeDocumentPage === "all" || activeDocumentPage === 3) && (
              <div
                id="prevention-a4-page-3"
                className="a4-page bg-white text-slate-900 border border-slate-300 print:border-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                      FEUILLET 3 / 5
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Audit Chirurgical des Feuilles & Lignes de Calculs Excel (1→30)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {uniqueDocReference}
                  </span>
                </div>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      2. Auscultation Ligne par Ligne des Registres de Terrain
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Détection des anomalies de calculs, contrôle de la dosimétrie
                      chimique (Actellic 300cs), ratios structures/bidons et
                      formules de sommation journalières (=SUM).
                    </p>
                  </div>

                  {/* Diagnostic Breakdown Matrix */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-900 uppercase">
                        Ratio Chimique Optimal
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
                        5.2 à 5.8
                      </div>
                      <div className="text-[9px] text-emerald-700 mt-1">
                        Structures traitées par bidon de 10L. Gage de dosimétrie à
                        1.0 g m.a./m².
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                      <div className="text-[10px] font-bold text-red-900 uppercase">
                        Alerte Sur-Dosage (&lt; 4.5)
                      </div>
                      <div className="text-sm font-mono font-bold text-red-800 mt-0.5">
                        Ligne 12 (3.00 struct.)
                      </div>
                      <div className="text-[9px] text-red-700 mt-1">
                        Surconsommation d'insecticide (+44%). Risque de buse 8002E
                        usée et de cristallisation.
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-900 uppercase">
                        Alerte Sous-Dosage (&gt; 7.0)
                      </div>
                      <div className="text-sm font-mono font-bold text-amber-800 mt-0.5">
                        Ligne 19 (7.20 struct.)
                      </div>
                      <div className="text-[9px] text-amber-700 mt-1">
                        Dépôt insuffisant sur mur banco, rémanence écourtée &lt; 3
                        mois.
                      </div>
                    </div>
                  </div>

                  {/* Excel Sheet Extract Audit Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-mono text-[9px] font-bold text-slate-700 flex justify-between">
                      <span>
                        EXTRAIT REGISTRE JOURNALIER EXCEL 1→30 (CONTRÔLE DES
                        CELLULES DE SOMMATION)
                      </span>
                      <span>FORMULE OFFICIELLE : =SUM(Col_1:Col_30)</span>
                    </div>
                    <table className="w-full text-left text-[9px] border-collapse font-mono">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="p-1 pl-2">Ligne Excel</th>
                          <th className="p-1">Équipe / Opérateur</th>
                          <th className="p-1 text-right">Stands (Col 1-30)</th>
                          <th className="p-1 text-right">Structures</th>
                          <th className="p-1 text-right">Bidons (10L)</th>
                          <th className="p-1 text-right">Ratio R/S</th>
                          <th className="p-1">Statut Médical Ligne</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 pl-2 font-bold">Ligne 01</td>
                          <td className="p-1 font-sans">Dr. Magassouba (Équipe Alpha)</td>
                          <td className="p-1 text-right">10</td>
                          <td className="p-1 text-right">48</td>
                          <td className="p-1 text-right">10</td>
                          <td className="p-1 text-right font-bold text-emerald-700">4.80</td>
                          <td className="p-1 font-sans text-emerald-800">Conforme OMS</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 pl-2 font-bold">Ligne 04</td>
                          <td className="p-1 font-sans">Mamady Keita (Kolenda Ouest)</td>
                          <td className="p-1 text-right">8</td>
                          <td className="p-1 text-right">42</td>
                          <td className="p-1 text-right">8</td>
                          <td className="p-1 text-right font-bold text-emerald-700">5.25</td>
                          <td className="p-1 font-sans text-emerald-800">Dosage Optimal</td>
                        </tr>
                        <tr className="bg-red-50/70">
                          <td className="p-1 pl-2 font-bold text-red-900">Ligne 12</td>
                          <td className="p-1 font-sans text-red-900">Équipe Bravo (Fienkolen Nord)</td>
                          <td className="p-1 text-right text-red-900">9</td>
                          <td className="p-1 text-right font-bold text-red-900">42</td>
                          <td className="p-1 text-right font-bold text-red-900">14</td>
                          <td className="p-1 text-right font-bold text-red-900">3.00</td>
                          <td className="p-1 font-sans text-red-700 font-bold">ANOMALIE SUR-CONSOMMATION</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 pl-2 font-bold">Ligne 15</td>
                          <td className="p-1 font-sans">Sékou Traoré (Tintissabani Sud)</td>
                          <td className="p-1 text-right">12</td>
                          <td className="p-1 text-right">64</td>
                          <td className="p-1 text-right">12</td>
                          <td className="p-1 text-right font-bold text-emerald-700">5.33</td>
                          <td className="p-1 font-sans text-emerald-800">Conforme</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 pl-2 font-bold">Ligne 18</td>
                          <td className="p-1 font-sans">Brigade Clinique (Fadako Est)</td>
                          <td className="p-1 text-right">11</td>
                          <td className="p-1 text-right">58</td>
                          <td className="p-1 text-right">11</td>
                          <td className="p-1 text-right font-bold text-emerald-700">5.27</td>
                          <td className="p-1 font-sans text-emerald-800">Dosage Parfait</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Root Cause Analysis Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                      Analyse Causale de la Dérive Ligne 12 (Dr. Faremba Doumbouya) :
                    </div>
                    <p className="text-[10px] text-slate-700 leading-relaxed">
                      L'orifice de la buse en céramique du pulvérisateur N°7 a été
                      mesuré à 0.88 mm au lieu de 0.72 mm nominal, entraînant un
                      débit liquide de 780 ml/min (+42%). La correction consiste en
                      son remplacement immédiat par une buse 8002E neuve et un
                      contrôle au débitmètre d'eau à 06h30 avant toute nouvelle
                      rotation.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Audit des Formules Excel · Hôpital de Koron SAG</span>
                  <span>Document Certifié · Feuillet 3 / 5</span>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* FEUILLET 4 : RECOMMANDATIONS VILLES & COMPILATION DES DEMANDES ADMIN   */}
            {/* --------------------------------------------------------------------- */}
            {(activeDocumentPage === "all" || activeDocumentPage === 4) && (
              <div
                id="prevention-a4-page-4"
                className="a4-page bg-white text-slate-900 border border-slate-300 print:border-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                      FEUILLET 4 / 5
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Recommandations par Ville & Synthèse des Demandes de l'Admin
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {uniqueDocReference}
                  </span>
                </div>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      3. Matrice Exhaustive des Préventions Demandées & Résolues
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Tous les problèmes soumis par l'Administrateur avec
                      diagnostics circonstanciés, moyens de prévention et
                      résolutions opérationnelles.
                    </p>
                  </div>

                  {/* 4 Representative Prevention Cases Table */}
                  <div className="space-y-2">
                    {preventionItems.slice(0, 4).map((prev, pidx) => (
                      <div
                        key={prev.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                              CAS {pidx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {prev.titre}
                            </span>
                          </div>
                          <span className="font-mono text-[9px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                            {prev.villageCible} · {prev.codeReference}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-700">
                          <b className="text-slate-900">Diagnostic : </b>
                          {prev.analyseDiagnostique.resume}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[9px] pt-1">
                          <div className="p-1.5 bg-emerald-50 rounded border border-emerald-200">
                            <b className="text-emerald-900 block">Action 24h :</b>
                            <span className="text-emerald-950">
                              {prev.moyensPreventionEtResolution.actionImmediate24h}
                            </span>
                          </div>
                          <div className="p-1.5 bg-blue-50 rounded border border-blue-200">
                            <b className="text-blue-900 block">Moyen Terme (7j) :</b>
                            <span className="text-blue-950">
                              {prev.moyensPreventionEtResolution.actionMoyenTerme7j}
                            </span>
                          </div>
                          <div className="p-1.5 bg-purple-50 rounded border border-purple-200">
                            <b className="text-purple-900 block">Résolution Durable :</b>
                            <span className="text-purple-950">
                              {
                                prev.moyensPreventionEtResolution
                                  .resolutionStructurelle
                              }
                            </span>
                          </div>
                        </div>

                        <div className="text-[9px] text-slate-600 bg-white p-1 rounded border border-slate-200">
                          <b className="text-slate-800">Conseil pour la Localité : </b>
                          {prev.moyensPreventionEtResolution.recommandationsVille}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary of Total Solved Cases */}
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-[10px] text-emerald-900">
                    <span className="font-bold">
                      Registre complet : {preventionItems.length} préventions
                      analysées et préconisées pour l'ensemble du cycle 2026.
                    </span>
                    <span className="font-mono font-bold">100% Homologué</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Hôpital de Koron · Résolutions Épidémiologiques</span>
                  <span>Document Certifié · Feuillet 4 / 5</span>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* FEUILLET 5 : PROTOCOLE CHIMIQUE, PLAN D'URGENCE & HOMOLOGATION LÉGALE */}
            {/* --------------------------------------------------------------------- */}
            {(activeDocumentPage === "all" || activeDocumentPage === 5) && (
              <div
                id="prevention-a4-page-5"
                className="a4-page bg-white text-slate-900 border border-slate-300 print:border-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                      FEUILLET 5 / 5
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Protocole Technique, Plan d'Action & Homologation Légale
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {uniqueDocReference}
                  </span>
                </div>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      4. Normes Techniques & Calendrier de Déploiement d'Urgence
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Spécifications de pulvérisation à effet rémanent (IRS)
                      validées selon les directives conjointes OMS et RSE
                      AngloGold Ashanti.
                    </p>
                  </div>

                  {/* Technical Specifications Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900 uppercase text-[9px]">
                        Normes d'Application Chimique :
                      </div>
                      <ul className="list-disc pl-3 text-slate-700 space-y-0.5 text-[9px]">
                        <li>Produit : Actellic 300CS (Pirimiphos-méthyl)</li>
                        <li>Dosage : 1.00 g de matière active par m² de paroi</li>
                        <li>Buse standard : Céramique TeeJet 8002E (angle 80°)</li>
                        <li>Pression de service : 35 à 55 PSI (2.5 à 3.8 bars)</li>
                        <li>Distance paroi : 45 cm constant avec guide-flèche</li>
                      </ul>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900 uppercase text-[9px]">
                        Plan de Sécurité & Environnement :
                      </div>
                      <ul className="list-disc pl-3 text-slate-700 space-y-0.5 text-[9px]">
                        <li>Triple rinçage obligatoire des bidons et pulvérisateurs</li>
                        <li>Évacuation de toute personne et animal durant 2h</li>
                        <li>Bâchage hermétique des denrées vivrières et ustensiles</li>
                        <li>Protection EPI complète (combinaison, visière, gants)</li>
                        <li>Lavage des combinaisons au poste central de Koron</li>
                      </ul>
                    </div>
                  </div>

                  {/* Operational Timeline */}
                  <div>
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      Calendrier des Actions de Prévention (Semaines 1 à 4) :
                    </div>
                    <div className="border border-slate-300 rounded-lg overflow-hidden text-[9px] font-mono">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-800">
                          <tr>
                            <th className="p-1 pl-2">Période</th>
                            <th className="p-1">Mesure de Prévention Déployée</th>
                            <th className="p-1">Cible Opérationnelle</th>
                            <th className="p-1">Responsable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-1 pl-2 font-bold">Semaine 1</td>
                            <td className="p-1 font-sans">
                              Remplacement et calibrage des 30 buses 8002E
                            </td>
                            <td className="p-1">Atelier Central Koron</td>
                            <td className="p-1 font-sans">Logistique SAG</td>
                          </tr>
                          <tr>
                            <td className="p-1 pl-2 font-bold">Semaine 2</td>
                            <td className="p-1 font-sans">
                              Mop-up round (ratissage) des concessions fermées
                            </td>
                            <td className="p-1">Silabada & Tintissabani</td>
                            <td className="p-1 font-sans">Brigades du Soir</td>
                          </tr>
                          <tr>
                            <td className="p-1 pl-2 font-bold">Semaine 3</td>
                            <td className="p-1 font-sans">
                              Médiation communautaire & traitement des refus
                            </td>
                            <td className="p-1">Kolenda & Fienkolen Nord</td>
                            <td className="p-1 font-sans">Sages & Dr. Faremba</td>
                          </tr>
                          <tr>
                            <td className="p-1 pl-2 font-bold">Semaine 4</td>
                            <td className="p-1 font-sans">
                              Bio-essais cônes OMS de suivi de rémanence
                            </td>
                            <td className="p-1">Zone Fluviale Fadako</td>
                            <td className="p-1 font-sans">Labo Entomologie</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Legal and Medical Certification Block */}
                  <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-2 mt-4">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-xs uppercase text-slate-900">
                          Homologation Légale & Certification Médicale
                        </span>
                      </div>
                      <span className="font-mono text-[9px] font-bold text-slate-500">
                        {uniqueDocReference}
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-700 leading-relaxed">
                      Le présent document de 5 feuillets atteste de la conformité
                      méthodologique et scientifique de l'ensemble des mesures de
                      prévention, d'audit de calculs et de résolution des problèmes
                      identifiés sur la plateforme SAG Siguiri. Les directives
                      ci-dessus engagent les équipes opérationnelles pour toute la
                      durée de la campagne IRS 2026.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                      <div className="border border-slate-300 p-2 rounded-lg bg-white">
                        <div className="text-[9px] text-slate-500 uppercase font-semibold">
                          Le Médecin-Chef Administrateur :
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">
                          Dr. Faremba Doumbouya
                        </div>
                        <div className="text-[8px] text-slate-400 font-mono">
                          Matricule SAG-ADM-001 · Hôpital de Koron
                        </div>
                        <div className="mt-3 pt-1 border-t border-dashed border-slate-300 text-[8px] text-emerald-700 font-bold font-mono">
                          [SCEAU MÉDICAL OFFICIEL APPOSÉ]
                        </div>
                      </div>

                      <div className="border border-slate-300 p-2 rounded-lg bg-white">
                        <div className="text-[9px] text-slate-500 uppercase font-semibold">
                          Le Superviseur Général des Opérations :
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">
                          Dr. Colonel Magassouba
                        </div>
                        <div className="text-[8px] text-slate-400 font-mono">
                          Matricule SAG-SUP-002 · Brigade Terrain
                        </div>
                        <div className="mt-3 pt-1 border-t border-dashed border-slate-300 text-[8px] text-emerald-700 font-bold font-mono">
                          [CACHET & SIGNATURE]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Programme National Paludisme · SAG Siguiri (Guinée)</span>
                  <span>Document Certifié · Feuillet 5 / 5</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
