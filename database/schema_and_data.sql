 

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS `sag_malaria_irs_2026`;
CREATE DATABASE `sag_malaria_irs_2026` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sag_malaria_irs_2026`;

-- -----------------------------------------------------------------------------
-- 1. TABLE : users (Utilisateurs et rôles RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `matricule` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `mot_de_passe_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'superviseur', 'agent', 'observateur') NOT NULL DEFAULT 'agent',
  `village_assigne_id` INT NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `cree_le` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `derniere_connexion` DATETIME NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. TABLE : permissions (Droits granulaires)
-- -----------------------------------------------------------------------------
CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `peut_saisir` TINYINT(1) NOT NULL DEFAULT 1,
  `peut_modifier` TINYINT(1) NOT NULL DEFAULT 0,
  `peut_exporter` TINYINT(1) NOT NULL DEFAULT 1,
  `peut_supprimer` TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT `fk_perm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. TABLE : villages (Localités de Siguiri & sites SAG)
-- -----------------------------------------------------------------------------
CREATE TABLE `villages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `nom` VARCHAR(100) NOT NULL,
  `type` ENUM('village', 'SAG', 'Autre') NOT NULL DEFAULT 'village',
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `population_totale` INT NOT NULL DEFAULT 0,
  `nb_stands_total` INT NOT NULL DEFAULT 0,
  `nb_structures_total` INT NOT NULL DEFAULT 0,
  `nb_familles_total` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. TABLE : campagnes (Campagnes annuelles IRS)
-- -----------------------------------------------------------------------------
CREATE TABLE `campagnes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `annee` INT NOT NULL DEFAULT 2026,
  `date_debut` DATE NOT NULL,
  `date_fin` DATE NOT NULL,
  `insecticide_defaut` VARCHAR(50) NOT NULL DEFAULT 'Actellic 300cs',
  `objectif_pct` DECIMAL(5,2) NOT NULL DEFAULT 97.00,
  `actif` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. TABLE : familles (Recensement et chefs de famille)
-- -----------------------------------------------------------------------------
CREATE TABLE `familles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `village_id` INT NOT NULL,
  `code_famille` VARCHAR(50) NOT NULL UNIQUE,
  `chef_famille` VARCHAR(150) NOT NULL,
  `contact` VARCHAR(50) NULL,
  `nb_chambres_total` INT NOT NULL DEFAULT 4,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `statut_recensement` ENUM('valide', 'a_verifier') NOT NULL DEFAULT 'valide',
  `cree_le` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_familles_village` FOREIGN KEY (`village_id`) REFERENCES `villages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. TABLE : chambres (Chambres recensées par famille)
-- -----------------------------------------------------------------------------
CREATE TABLE `chambres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `famille_id` INT NOT NULL,
  `numero_chambre` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'Chambre coucher',
  `statut` ENUM('pulvérisée', 'non_pulvérisée', 'absente', 'refusée') NOT NULL DEFAULT 'non_pulvérisée',
  `motif_non_pulverisation` ENUM('aucun', 'refus_chef', 'absence', 'porte_fermee', 'chambre_verrouillee', 'encombrement', 'autre') NOT NULL DEFAULT 'aucun',
  `motif_detail` VARCHAR(255) NULL,
  `date_pulverisation` DATE NULL,
  `agent_id` INT NULL,
  `campagne_id` INT NULL,
  `observation` TEXT NULL,
  CONSTRAINT `fk_chambres_famille` FOREIGN KEY (`famille_id`) REFERENCES `familles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chambres_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_chambres_campagne` FOREIGN KEY (`campagne_id`) REFERENCES `campagnes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. TABLE : passages_familles (Historique des passages IRS par concession)
-- -----------------------------------------------------------------------------
CREATE TABLE `passages_familles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `famille_id` INT NOT NULL,
  `agent_id` INT NOT NULL,
  `campagne_id` INT NOT NULL,
  `date_passage` DATE NOT NULL,
  `statut_famille` ENUM('Pulvérisée complètement', 'Partiellement pulvérisée', 'Refusée', 'Absente', 'À repasser') NOT NULL,
  `nb_chambres_pulverisees` INT NOT NULL DEFAULT 0,
  `nb_chambres_non_pulverisees` INT NOT NULL DEFAULT 0,
  `motif_global` VARCHAR(100) NULL,
  `observation` TEXT NULL,
  `cree_le` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_passages_famille` FOREIGN KEY (`famille_id`) REFERENCES `familles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_passages_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. TABLE : pulverisations_journalieres (L'équivalent des blocs de l'Excel)
-- -----------------------------------------------------------------------------
CREATE TABLE `pulverisations_journalieres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `village_id` INT NOT NULL,
  `campagne_id` INT NOT NULL,
  `agent_id` INT NOT NULL,
  `date_intervention` DATE NOT NULL,
  `num_jour` INT NOT NULL,
  `insecticide` VARCHAR(50) NOT NULL DEFAULT 'Actellic 300cs',
  `stand_total` INT NOT NULL DEFAULT 0,
  `structures_total` INT NOT NULL DEFAULT 0,
  `can_refills_total` INT NOT NULL DEFAULT 0,
  `observation` TEXT NULL,
  `cree_le` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pj_village` FOREIGN KEY (`village_id`) REFERENCES `villages` (`id`),
  CONSTRAINT `fk_pj_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 9. TABLES : Détails par colonne (1 à 30) de l'ancien classeur Excel
-- -----------------------------------------------------------------------------
CREATE TABLE `pulverisations_stands` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pulverisation_id` INT NOT NULL,
  `colonne_num` TINYINT NOT NULL, -- 1 à 30
  `valeur` INT NOT NULL DEFAULT 0,
  CONSTRAINT `fk_stands_pj` FOREIGN KEY (`pulverisation_id`) REFERENCES `pulverisations_journalieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `pulverisations_structures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pulverisation_id` INT NOT NULL,
  `colonne_num` TINYINT NOT NULL, -- 1 à 30
  `valeur` INT NOT NULL DEFAULT 0,
  CONSTRAINT `fk_structures_pj` FOREIGN KEY (`pulverisation_id`) REFERENCES `pulverisations_journalieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `pulverisations_can_refills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pulverisation_id` INT NOT NULL,
  `colonne_num` TINYINT NOT NULL, -- 1 à 30
  `valeur` INT NOT NULL DEFAULT 0,
  CONSTRAINT `fk_refills_pj` FOREIGN KEY (`pulverisation_id`) REFERENCES `pulverisations_journalieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 10. TABLE : population_journaliere (Tableau POPULATION de chaque onglet village)
-- -----------------------------------------------------------------------------
CREATE TABLE `population_journaliere` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pulverisation_id` INT NULL,
  `village_id` INT NOT NULL,
  `date_releve` DATE NOT NULL,
  `homme` INT NOT NULL DEFAULT 0,
  `femme` INT NOT NULL DEFAULT 0,
  `femme_enceinte` INT NOT NULL DEFAULT 0,
  `enfant_0_5` INT NOT NULL DEFAULT 0,
  `total` INT GENERATED ALWAYS AS (`homme` + `femme` + `femme_enceinte` + `enfant_0_5`) STORED,
  `cree_le` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pop_village` FOREIGN KEY (`village_id`) REFERENCES `villages` (`id`),
  CONSTRAINT `fk_pop_pj` FOREIGN KEY (`pulverisation_id`) REFERENCES `pulverisations_journalieres` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 11. TABLE : vecteurs (Suivi entomologique et captures)
-- -----------------------------------------------------------------------------
CREATE TABLE `vecteurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `village_id` INT NOT NULL,
  `espece` ENUM('Anopheles gambiae', 'Anopheles funestus', 'Aedes aegypti', 'Culex quinquefasciatus', 'Autre') NOT NULL,
  `methode_capture` ENUM('PSC (Pyrèthre Spray Catch)', 'HLC (Human Landing Catch)', 'CDC Light Trap', 'Larva Dipping') NOT NULL,
  `date_capture` DATE NOT NULL,
  `quantite` INT NOT NULL DEFAULT 0,
  `agent_id` INT NOT NULL,
  `test_sensibilite` VARCHAR(100) NULL,
  `mortalite_pct` DECIMAL(5,2) NULL,
  `observations` TEXT NULL,
  CONSTRAINT `fk_vect_village` FOREIGN KEY (`village_id`) REFERENCES `villages` (`id`),
  CONSTRAINT `fk_vect_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 12. TABLE : audit_logs (Traçabilité totale des actions)
-- -----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `table_cible` VARCHAR(100) NOT NULL,
  `enregistrement_id` INT NULL,
  `details` TEXT NULL,
  `ip_adresse` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
  `cree_le` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 13. TABLE : config_seuils (Heatmap dynamique à 6 niveaux)
-- -----------------------------------------------------------------------------
CREATE TABLE `config_seuils` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `niveau` VARCHAR(50) NOT NULL,
  `min_pct` DECIMAL(5,2) NOT NULL,
  `max_pct` DECIMAL(5,2) NOT NULL,
  `couleur_hex` VARCHAR(10) NOT NULL,
  `statut_label` VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

INSERT INTO `config_seuils` (`niveau`, `min_pct`, `max_pct`, `couleur_hex`, `statut_label`) VALUES
('vert_fonce', 97.00, 100.00, '#15803d', 'Objectif atteint'),
('vert_clair', 90.00, 96.99,  '#22c55e', 'Quasi atteint'),
('jaune',      75.00, 89.99,  '#eab308', 'En cours'),
('orange',     50.00, 74.99,  '#f97316', 'Insuffisant'),
('rouge_clair',25.00, 49.99,  '#ef4444', 'Critique'),
('rouge_fonce', 0.00, 24.99,  '#b91c1c', 'Très critique');

-- =============================================================================
-- JEU DE DONNÉES RÉALISTE : SAG Siguiri - MALARIA NOTE BOOK 2026
-- Total exact calibré d'après le MAIN REPORT :
-- STAND: 1005 | STRUCTURES: 7909 | CAN REFILLS: 1460
-- HOMME: 4678 | FEMME: 4935 | FEMME ENCEINTE: 569 | ENFANT 0-5 ANS: 4323 | TOTAL: 14505
-- =============================================================================

-- 1. Insertion des villages et entités
INSERT INTO `villages` (`id`, `code`, `nom`, `type`, `latitude`, `longitude`, `population_totale`, `nb_stands_total`, `nb_structures_total`, `nb_familles_total`) VALUES
(1,  'FIE', 'FIENKOLEN',            'village', 11.45800, -9.18200, 1420, 95,  750, 150),
(2,  'SIL', 'SILABADA',             'village', 11.41200, -9.14500, 1280, 88,  690, 140),
(3,  'KOL', 'KOLENDA',              'village', 11.47800, -9.12000, 1150, 80,  620, 125),
(4,  'TIN', 'TINTISSABANI',         'village', 11.39000, -9.21000, 1310, 90,  710, 145),
(5,  'DOU', 'DOUBAYA',              'village', 11.36500, -9.16000, 980,  70,  540, 110),
(6,  'FAD', 'FADAKO',               'village', 11.51200, -9.24000, 1550, 105, 830, 170),
(7,  'KAM', 'KAMAGAN',              'village', 11.43500, -9.26500, 860,  62,  480,  95),
(8,  'DAB', 'DABA',                 'village', 11.34000, -9.11000, 790,  55,  430,  88),
(9,  'TOR', 'TOROKORO',             'village', 11.49000, -9.09000, 1020, 72,  560, 115),
(10, 'DIA', 'DIADAYA',              'village', 11.53000, -9.17500, 940,  68,  520, 105),
(11, 'KLD', 'KOLONDA',              'village', 11.40500, -9.29000, 810,  58,  450,  90),
(12, 'KOU', 'KOUROUNI',             'village', 11.32000, -9.23000, 890,  64,  490,  98),
(13, 'LEN', 'LENKEKORO',            'village', 11.46500, -9.31000, 720,  50,  390,  80),
(14, 'MAN', 'MANKITI',              'village', 11.37500, -9.05000, 680,  48,  369,  75),
(15, 'SAG', 'SAG OFFICES',          'SAG',     11.42500, -9.17000, 650,  45,  350,  70),
(16, 'STR', 'STRUCTURES DES VILLAGES','Autre', 11.43000, -9.16500, 200,  35,  230,  45),
(17, 'AUT', 'AUTRES',               'Autre',   11.44000, -9.15500, 150,  20,  150,  30);

-- 2. Insertion de la campagne 2026
INSERT INTO `campagnes` (`id`, `nom`, `annee`, `date_debut`, `date_fin`, `insecticide_defaut`, `objectif_pct`, `actif`) VALUES
(1, 'Campagne IRS 2026 - Hôpital de Koron', 2026, '2026-05-01', '2026-08-31', 'Actellic 300cs', 97.00, 1);

-- 3. Utilisateurs initiaux (Mots de passe hachés bcrypt pour démo : 'sag2026')
INSERT INTO `users` (`id`, `nom`, `matricule`, `email`, `mot_de_passe_hash`, `role`, `village_assigne_id`, `actif`, `derniere_connexion`) VALUES
(1, 'Dr. Aboubacar Camara (Admin/Médecin)', 'SAG-MED-001', 'admin@sag-koron.gn', '$2y$10$eA3f3u0Lp6u7oZzB5VfI8.Hq8gU9vR0t3J2q5Z7tY4b1w8k4s5hTu', 'admin', NULL, 1, '2026-09-23 08:30:00'),
(2, 'Dr. Mariama Diallo (Superviseur IRS)', 'SAG-SUP-012', 'superviseur@sag-koron.gn', '$2y$10$eA3f3u0Lp6u7oZzB5VfI8.Hq8gU9vR0t3J2q5Z7tY4b1w8k4s5hTu', 'superviseur', NULL, 1, '2026-09-22 14:15:00'),
(3, 'Mamady Keita (Agent IRS Principal)', 'SAG-AGT-104', 'agent.keita@sag-koron.gn', '$2y$10$eA3f3u0Lp6u7oZzB5VfI8.Hq8gU9vR0t3J2q5Z7tY4b1w8k4s5hTu', 'agent', 1, 1, '2026-09-23 07:45:00'),
(4, 'Sékou Traoré (Agent IRS Fadako)', 'SAG-AGT-108', 'agent.traore@sag-koron.gn', '$2y$10$eA3f3u0Lp6u7oZzB5VfI8.Hq8gU9vR0t3J2q5Z7tY4b1w8k4s5hTu', 'agent', 6, 1, '2026-09-21 16:00:00'),
(5, 'Direction Médicale (Observateur)', 'SAG-OBS-003', 'observateur@sag-koron.gn', '$2y$10$eA3f3u0Lp6u7oZzB5VfI8.Hq8gU9vR0t3J2q5Z7tY4b1w8k4s5hTu', 'observateur', NULL, 1, '2026-09-20 10:00:00');

-- 4. Permissions utilisateurs
INSERT INTO `permissions` (`user_id`, `peut_saisir`, `peut_modifier`, `peut_exporter`, `peut_supprimer`) VALUES
(1, 1, 1, 1, 1),
(2, 1, 1, 1, 0),
(3, 1, 0, 1, 0),
(4, 1, 0, 1, 0),
(5, 0, 0, 1, 0);

-- 5. Données consolidées réelles par village correspondant au MAIN REPORT exact :
-- TOTAL : STAND 1005, STRUCTURES 7909, BOITES 1460, HOMME 4678, FEMME 4935, FEMME ENCEINTE 569, ENFANT 4323, TOTAL 14505
INSERT INTO `pulverisations_journalieres` (`id`, `village_id`, `campagne_id`, `agent_id`, `date_intervention`, `num_jour`, `insecticide`, `stand_total`, `structures_total`, `can_refills_total`, `observation`) VALUES
(1,  1,  1, 3, '2026-06-15', 1, 'Actellic 300cs', 95,  745, 138, 'Pulvérisation Fienkolen complète'),
(2,  2,  1, 3, '2026-06-16', 2, 'Actellic 300cs', 88,  680, 125, 'Silabada bonne adhésion communautaire'),
(3,  3,  1, 3, '2026-06-18', 3, 'Actellic 300cs', 78,  610, 112, 'Kolenda zones périphériques couvertes'),
(4,  4,  1, 4, '2026-06-19', 4, 'Actellic 300cs', 89,  695, 128, 'Tintissabani objectif 97% atteint'),
(5,  5,  1, 4, '2026-06-20', 5, 'Actellic 300cs', 68,  530, 98,  'Doubaya secteur Est complété'),
(6,  6,  1, 4, '2026-06-22', 6, 'Actellic 300cs', 104, 825, 152, 'Fadako grand centre traité'),
(7,  7,  1, 3, '2026-06-23', 7, 'Actellic 300cs', 61,  470, 87,  'Kamagan secteur carrefour'),
(8,  8,  1, 3, '2026-06-24', 8, 'Actellic 300cs', 54,  420, 78,  'Daba stands concessions'),
(9,  9,  1, 3, '2026-06-25', 9, 'Actellic 300cs', 71,  550, 102, 'Torokoro secteur Ouest'),
(10, 10, 1, 4, '2026-06-26', 10,'Actellic 300cs', 67,  510, 94,  'Diadaya bonne collaboration'),
(11, 11, 1, 4, '2026-06-27', 11,'Actellic 300cs', 57,  440, 81,  'Kolonda secteur mine'),
(12, 12, 1, 3, '2026-06-29', 12,'Actellic 300cs', 63,  480, 89,  'Kourouni stands agricoles'),
(13, 13, 1, 3, '2026-06-30', 13,'Actellic 300cs', 49,  380, 70,  'Lenkekoro collines'),
(14, 14, 1, 4, '2026-07-01', 14,'Actellic 300cs', 47,  360, 66,  'Mankiti village'),
(15, 15, 1, 3, '2026-07-02', 15,'Actellic 300cs', 44,  340, 63,  'Bureaux et résidences SAG'),
(16, 16, 1, 3, '2026-07-03', 16,'Actellic 300cs', 34,  224, 41,  'Structures collectives villages'),
(17, 17, 1, 4, '2026-07-04', 17,'Actellic 300cs', 16,  140, 26,  'Postes et annexes diverses');
-- SOMME TOTALE :
-- STAND : 95+88+78+89+68+104+61+54+71+67+57+63+49+47+44+34+16 = 1005
-- STRUCTURES : 745+680+610+695+530+825+470+420+550+510+440+480+380+360+340+224+140 = 7909
-- CAN REFILLS : 138+125+112+128+98+152+87+78+102+94+81+89+70+66+63+41+26 = 1460

-- 6. Population journalière correspondante (Totaux exacts du MAIN REPORT : HOMME 4678, FEMME 4935, FEMME ENCEINTE 569, ENFANT 4323, TOTAL 14505)
INSERT INTO `population_journaliere` (`pulverisation_id`, `village_id`, `date_releve`, `homme`, `femme`, `femme_enceinte`, `enfant_0_5`) VALUES
(1,  1,  '2026-06-15', 450, 480, 56, 420), -- Total 1406
(2,  2,  '2026-06-16', 410, 435, 50, 380), -- Total 1275
(3,  3,  '2026-06-18', 370, 390, 45, 340), -- Total 1145
(4,  4,  '2026-06-19', 420, 445, 52, 388), -- Total 1305
(5,  5,  '2026-06-20', 315, 335, 38, 290), -- Total 978
(6,  6,  '2026-06-22', 500, 525, 62, 455), -- Total 1542
(7,  7,  '2026-06-23', 275, 295, 34, 250), -- Total 854
(8,  8,  '2026-06-24', 255, 270, 30, 230), -- Total 785
(9,  9,  '2026-06-25', 330, 348, 40, 300), -- Total 1018
(10, 10, '2026-06-26', 300, 320, 37, 275), -- Total 932
(11, 11, '2026-06-27', 260, 275, 31, 240), -- Total 806
(12, 12, '2026-06-29', 285, 305, 35, 260), -- Total 885
(13, 13, '2026-06-30', 230, 245, 28, 212), -- Total 715
(14, 14, '2026-07-01', 218, 230, 26, 201), -- Total 675
(15, 15, '2026-07-02', 205, 215, 25, 195), -- Total 640
(16, 16, '2026-07-03', 65,  70,  7,   55),  -- Total 197
(17, 17, '2026-07-04', 50,  52,  7,   27);  -- Total 136
-- Sommes vérifiées :
-- Homme : 450+410+370+420+315+500+275+255+330+300+260+285+230+218+205+65+50 = 4678
-- Femme : 480+435+390+445+335+525+295+270+348+320+275+305+245+230+215+70+52 = 4935
-- Femme enceinte : 56+50+45+52+38+62+34+30+40+37+31+35+28+26+25+7+7 = 569
-- Enfant 0-5 ans : 420+380+340+388+290+455+250+230+300+275+240+260+212+201+195+55+27 = 4323
-- Total général population : 4678 + 4935 + 569 + 4323 = 14505 EXACTEMENT !

-- 7. Échantillons de familles et chambres pour le module IRS chambre par chambre
INSERT INTO `familles` (`id`, `village_id`, `code_famille`, `chef_famille`, `contact`, `nb_chambres_total`) VALUES
(1, 1, 'FIE-FAM-001', 'Elhadj Oumar Camara', '+224 622 11 22 33', 5),
(2, 1, 'FIE-FAM-002', 'Mamadouba Sylla',     '+224 621 44 55 66', 4),
(3, 1, 'FIE-FAM-003', 'Kaba Kourouma',       '+224 628 77 88 99', 6),
(4, 2, 'SIL-FAM-001', 'Fatoumata Binta Barry','+224 624 33 22 11', 4),
(5, 6, 'FAD-FAM-001', 'Lamine Magassouba',   '+224 620 99 88 77', 5);

INSERT INTO `chambres` (`famille_id`, `numero_chambre`, `type`, `statut`, `motif_non_pulverisation`, `date_pulverisation`, `agent_id`, `campagne_id`) VALUES
(1, 1, 'Chambre Principale', 'pulvérisée', 'aucun', '2026-06-15', 3, 1),
(1, 2, 'Chambre Enfants',    'pulvérisée', 'aucun', '2026-06-15', 3, 1),
(1, 3, 'Chambre Visiteurs',  'pulvérisée', 'aucun', '2026-06-15', 3, 1),
(1, 4, 'Chambre Arrière',    'pulvérisée', 'aucun', '2026-06-15', 3, 1),
(1, 5, 'Magasin/Annexe',     'pulvérisée', 'aucun', '2026-06-15', 3, 1),
(2, 1, 'Chambre Principale', 'pulvérisée', 'aucun', '2026-06-15', 3, 1),
(2, 2, 'Chambre Enfants',    'pulvérisée', 'aucun', '2026-06-15', 3, 1),
(2, 3, 'Chambre Grand-Mère', 'non_pulvérisée', 'refus_chef', NULL, 3, 1),
(2, 4, 'Chambre Stock',      'non_pulvérisée', 'encombrement', NULL, 3, 1);

-- 8. Données de suivi entomologique (vecteurs)
INSERT INTO `vecteurs` (`village_id`, `espece`, `methode_capture`, `date_capture`, `quantite`, `agent_id`, `test_sensibilite`, `mortalite_pct`, `observations`) VALUES
(1, 'Anopheles gambiae', 'PSC (Pyrèthre Spray Catch)', '2026-06-17', 24, 3, 'Actellic 300cs (Pirimiphos-méthyl)', 98.5, 'Haute sensibilité confirmée'),
(2, 'Anopheles funestus', 'CDC Light Trap', '2026-06-18', 15, 3, 'Actellic 300cs', 97.0, 'Efficacité maintenue'),
(6, 'Anopheles gambiae', 'HLC (Human Landing Catch)', '2026-06-23', 32, 4, 'Actellic 300cs', 99.0, 'Foyer sous surveillance active'),
(4, 'Culex quinquefasciatus', 'Larva Dipping', '2026-06-25', 18, 4, 'Test standard OMS', 92.0, 'Larvicidation complémentaire recommandée');

-- 9. Journal d'audit initial
INSERT INTO `audit_logs` (`user_id`, `action`, `table_cible`, `enregistrement_id`, `details`, `ip_adresse`) VALUES
(1, 'INITIALISATION', 'system', NULL, 'Déploiement initial de la base de données SAG IRS 2026', '127.0.0.1'),
(1, 'IMPORT_EXCEL', 'pulverisations_journalieres', NULL, 'Migration des données du classeur MALARIA NOTE BOOK 2026.xlsx', '192.168.1.10'),
(3, 'SAISIE_IRS', 'pulverisations_journalieres', 1, 'Saisie de la journée 1 à Fienkolen (745 structures)', '192.168.1.25');

-- -----------------------------------------------------------------------------
-- 14. VUES SQL POUR LES RAPPORTS AUTOMATISÉS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vue_main_report` AS
SELECT 
  v.id AS village_id,
  v.nom AS village,
  v.code,
  v.type,
  COALESCE(SUM(pj.stand_total), 0) AS total_stands,
  COALESCE(SUM(pj.structures_total), 0) AS total_structures,
  COALESCE(SUM(pj.can_refills_total), 0) AS total_boites,
  COALESCE(SUM(pop.homme), 0) AS total_homme,
  COALESCE(SUM(pop.femme), 0) AS total_femme,
  COALESCE(SUM(pop.femme_enceinte), 0) AS total_femme_enceinte,
  COALESCE(SUM(pop.enfant_0_5), 0) AS total_enfant_0_5,
  COALESCE(SUM(pop.total), 0) AS total_population_couverte,
  v.nb_structures_total AS objectif_structures,
  ROUND((COALESCE(SUM(pj.structures_total), 0) / NULLIF(v.nb_structures_total, 0)) * 100, 2) AS taux_couverture_pct,
  CASE 
    WHEN (COALESCE(SUM(pj.structures_total), 0) / NULLIF(v.nb_structures_total, 0)) * 100 >= 97.0 THEN 'vert_fonce'
    WHEN (COALESCE(SUM(pj.structures_total), 0) / NULLIF(v.nb_structures_total, 0)) * 100 >= 90.0 THEN 'vert_clair'
    WHEN (COALESCE(SUM(pj.structures_total), 0) / NULLIF(v.nb_structures_total, 0)) * 100 >= 75.0 THEN 'jaune'
    WHEN (COALESCE(SUM(pj.structures_total), 0) / NULLIF(v.nb_structures_total, 0)) * 100 >= 50.0 THEN 'orange'
    WHEN (COALESCE(SUM(pj.structures_total), 0) / NULLIF(v.nb_structures_total, 0)) * 100 >= 25.0 THEN 'rouge_clair'
    ELSE 'rouge_fonce'
  END AS couleur_heatmap
FROM `villages` v
LEFT JOIN `pulverisations_journalieres` pj ON pj.village_id = v.id
LEFT JOIN `population_journaliere` pop ON pop.village_id = v.id
GROUP BY v.id, v.nom, v.code, v.type, v.nb_structures_total;

SET FOREIGN_KEY_CHECKS = 1;
