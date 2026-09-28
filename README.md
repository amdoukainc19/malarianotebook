# SAG Siguiri - Système IRS de Lutte contre le Paludisme (MALARIA NOTE BOOK 2026)
## Hôpital de Koron — Société Minière AshantiGold Anglo / SAG Siguiri (Guinée)

Ce projet remplace l'ancien classeur Excel partagé « MALARIA NOTE BOOK 2026.xlsx » par une application web moderne, sécurisée, multi-utilisateurs et conforme aux exigences strictes de pulvérisation intradomiciliaire (IRS – Indoor Residual Spraying) chambre par chambre.

---

## 🏛️ Architecture du Projet

```
├── database/
│   └── schema_and_data.sql      # Script DDL + Jeu de données calibré (STAND: 1005, STRUCTURES: 7909, BOITES: 1460, POPULATION: 14505)
├── backend-php/                 # API REST PHP 8+ native (compatible XAMPP/WAMP/Apache/Nginx)
│   ├── api/index.php            # Routeur d'API REST
│   ├── config/Database.php      # Connexion PDO sécurisée
│   ├── config/Response.php      # Formateur JSON standardisé
│   ├── middleware/AuthMiddleware.php # Contrôle RBAC, JWT, Traçabilité
│   └── controllers/             # Contrôleurs métier (Villages, IRS, Rapports, Vecteurs, Admin)
├── src/                         # Application Web Frontend React 19 + TypeScript + Vite
│   ├── components/              # Composants UI (Navigation, Cartographie, Saisie, Rapports, Audit)
│   ├── data/                    # Moteur de données synchronisé, modèles et exportateurs
│   ├── App.tsx                  # Interface unifiée
│   └── main.tsx
└── DEPLOY_SAG_KORON.md          # Guide de déploiement pour le serveur de l'hôpital
```

---

## ⚙️ Caractéristiques Métier Clés Implémentées

1. **Reproduction intégrale de l'ancien Excel « MALARIA NOTE BOOK 2026 »** :
   - Onglets villages : FIENKOLEN, SILABADA, KOLENDA, TINTISSABANI, DOUBAYA, FADAKO, KAMAGAN, DABA, TOROKORO, DIADAYA, KOLONDA, KOUROUNI, LENKEKORO, MANKITI + SAG OFFICES + STRUCTURES DES VILLAGES + AUTRES.
   - Blocs de saisie : **STAND**, **STRUCTURES**, **CAN REFILLS** avec colonnes 1 à 30 + Total calculé en temps réel.
   - Bloc **POPULATION** : HOMME, FEMME, FEMME ENCEINTE, ENFANT DE 0-5 ANS.
   - Rapports : **MAIN REPORT**, **WEEKLY REPORT**, Vues mensuelles (Janv-Déc), Trimestrielles (T1-T4).

2. **Module Central IRS Chambre par Chambre (Spécification Hôpital de Koron)** :
   - Recensement des familles et chambres.
   - Saisie chambre par chambre avec statut (pulvérisée / non pulvérisée).
   - **Motif obligatoire en cas de non-pulvérisation** : refus du chef de famille, absence, porte fermée, chambre verrouillée, encombrée, autre.
   - Statut automatique de la famille : Pulvérisée complètement, Partiellement pulvérisée, Refusée, Absente, À repasser.
   - Formulaire mobile / tablette réactif avec bouton « Enregistrer et famille suivante » et mode hors-ligne.

3. **Règle des 97 % et Heatmap dynamique à 6 niveaux** :
   - Taux calculé sur les chambres pulvérisées (indicateur principal IRS) et sur les familles (indicateur secondaire).
   - Double pastille Heatmap (Chambres & Familles) sur la carte et les tableaux :
     - ≥ 97 % : 🟢 Vert foncé (Objectif atteint)
     - 90 – 96,9 % : 🟢 Vert clair (Quasi atteint)
     - 75 – 89,9 % : 🟡 Jaune (En cours)
     - 50 – 74,9 % : 🟠 Orange (Insuffisant)
     - 25 – 49,9 % : 🔴 Rouge clair (Critique)
     - < 25 % : 🔴 Rouge foncé (Très critique)

4. **Sécurité, RBAC et Traçabilité (Audit Log)** :
   - Rôles : Administrateur, Superviseur / Médecin, Agent de terrain, Observateur.
   - Seul l'Administrateur peut octroyer ou retirer le droit de saisie à un agent.
   - Journalisation complète de chaque action (création, modification, saisie, IP, horodatage).

5. **Exports & Restitutions** :
   - Export Excel standard (.xlsx via SheetJS) conforme aux colonnes historiques.
   - Export / Impression PDF prête pour les réunions de coordination épidémiologique.
   - Cartographie interactive géographique des localités de Siguiri.
