# Guide de Déploiement — Serveur Interne Hôpital de Koron
## Société Minière AngloGold Ashanti SAG Siguiri (Guinée)

Ce document fournit les instructions pas à pas pour déployer l'application sur le serveur intranet de l'hôpital de Koron (XAMPP, WAMP, Linux Debian/Ubuntu ou Apache/Nginx + MySQL).

---

### 1. Prérequis Serveur
- Serveur Web : Apache 2.4+ ou Nginx
- PHP : Version 8.1 ou supérieure (avec extensions `pdo`, `pdo_mysql`, `mbstring`, `json`)
- Base de données : MySQL 8.0+ ou MariaDB 10.5+
- Node.js 18+ (pour la compilation du frontend React) ou copie directe du dossier `dist/`

---

### 2. Installation de la Base de Données
1. Ouvrez votre gestionnaire MySQL (phpMyAdmin ou terminal MySQL).
2. Exécutez le script `/database/schema_and_data.sql` :
   ```bash
   mysql -u root -p < database/schema_and_data.sql
   ```
3. Cette commande crée la base `sag_malaria_irs_2026` avec toutes les tables, index, vues SQL et insère les totaux exacts du classeur Excel :
   - STAND : 1005
   - STRUCTURES : 7909
   - BOITES : 1460
   - TOTAL POPULATION : 14505 (Homme: 4678, Femme: 4935, Enceinte: 569, Enfants 0-5 ans: 4323)

---

### 3. Configuration du Backend PHP
1. Copiez le dossier `backend-php/` dans le répertoire web public (ex. `/var/www/html/sag-irs/backend/` ou `C:\xampp\htdocs\sag-irs\backend\`).
2. Vérifiez ou modifiez les identifiants MySQL dans `/backend-php/config/Database.php` :
   ```php
   private static string $host = '127.0.0.1';
   private static string $db_name = 'sag_malaria_irs_2026';
   private static string $username = 'root';
   private static string $password = '';
   ```
3. Testez l'accès en ouvrant dans un navigateur :
   `http://[IP_SERVEUR]/sag-irs/backend/api/villages`

---

### 4. Déploiement du Frontend React
1. Si vous souhaitez compiler une version statique :
   ```bash
   npm install
   npm run build
   ```
2. Les fichiers optimisés sont générés dans `dist/`.
3. Déposez le contenu de `dist/` dans le dossier web public racine (ex. `C:\xampp\htdocs\sag-irs\`).

---

### 5. Comptes d'Accès Initiaux (Hôpital de Koron)

| Nom & Rôle | Identifiant (Matricule / Email) | Mot de passe démo | Permissions |
|---|---|---|---|
| Dr. Aboubacar Camara (Admin / Médecin) | `admin@sag-koron.gn` ou `SAG-MED-001` | `sag2026` | Accès total, gestion des utilisateurs, contrôle des droits de saisie, configuration |
| Dr. Mariama Diallo (Superviseur IRS) | `superviseur@sag-koron.gn` ou `SAG-SUP-012` | `sag2026` | Consultation tous rapports, validation, export PDF/Excel, suivi épidémiologique |
| Mamady Keita (Agent IRS Principal) | `agent.keita@sag-koron.gn` ou `SAG-AGT-104` | `sag2026` | Saisie journalière (STAND/STRUCTURES/CAN REFILLS) & Chambre par chambre (Fienkolen) |
| Sékou Traoré (Agent IRS Fadako) | `agent.traore@sag-koron.gn` ou `SAG-AGT-108` | `sag2026` | Saisie pour Fadako |
| Direction Médicale (Observateur) | `observateur@sag-koron.gn` ou `SAG-OBS-003` | `sag2026` | Consultation seule (lecture) |

---

### 6. Sécurité et Sauvegardes Quotidiennes
1. Programmez un dump MySQL quotidien :
   ```bash
   mysqldump -u root -p sag_malaria_irs_2026 > /backup/sag_irs_$(date +%F).sql
   ```
2. Activer HTTPS avec un certificat SSL interne de la mine AngloGold Ashanti ou Let's Encrypt.
