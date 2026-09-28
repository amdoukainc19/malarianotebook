<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Fichier : api/index.php
 * Routeur principal de l'API REST
 * =============================================================================
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/VillageController.php';
require_once __DIR__ . '/../controllers/FamilyController.php';
require_once __DIR__ . '/../controllers/SprayController.php';
require_once __DIR__ . '/../controllers/ReportController.php';
require_once __DIR__ . '/../controllers/EntomologyController.php';
require_once __DIR__ . '/../controllers/AdminController.php';

use App\Config\Response;
use App\Controllers\AuthController;
use App\Controllers\VillageController;
use App\Controllers\FamilyController;
use App\Controllers\SprayController;
use App\Controllers\ReportController;
use App\Controllers\EntomologyController;
use App\Controllers\AdminController;

// Initialiser les en-têtes CORS et de sécurité
Response::initCors();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Nettoyage du préfixe URI
$uri = preg_replace('#^/backend-php/api#', '', $uri);
$uri = preg_replace('#^/api#', '', $uri);
$uri = rtrim($uri, '/');

try {
    // 1. Authentification
    if ($uri === '/auth/login' && $method === 'POST') {
        (new AuthController())->login();
    } elseif ($uri === '/auth/me' && $method === 'GET') {
        (new AuthController())->me();
    } elseif ($uri === '/auth/logout' && $method === 'POST') {
        (new AuthController())->logout();
    }

    // 2. Villages
    elseif ($uri === '/villages' && $method === 'GET') {
        (new VillageController())->index();
    } elseif (preg_match('#^/villages/(\d+)/stats$#', $uri, $m) && $method === 'GET') {
        (new VillageController())->stats((int)$m[1]);
    }

    // 3. Familles et Chambres
    elseif (preg_match('#^/villages/(\d+)/familles$#', $uri, $m) && $method === 'GET') {
        (new FamilyController())->getByVillage((int)$m[1]);
    } elseif (preg_match('#^/familles/(\d+)/chambres$#', $uri, $m) && $method === 'GET') {
        (new FamilyController())->getChambres((int)$m[1]);
    } elseif (preg_match('#^/chambres/(\d+)/pulverisation$#', $uri, $m) && $method === 'POST') {
        (new FamilyController())->pulveriserChambre((int)$m[1]);
    } elseif (preg_match('#^/familles/(\d+)/passages$#', $uri, $m) && $method === 'POST') {
        (new FamilyController())->enregistrerPassage((int)$m[1]);
    }

    // 4. Pulvérisations journalières (Format Excel blocs 1-30)
    elseif ($uri === '/pulverisations' && $method === 'POST') {
        (new SprayController())->store();
    } elseif (preg_match('#^/pulverisations/(\d+)$#', $uri, $m) && $method === 'GET') {
        (new SprayController())->show((int)$m[1]);
    }

    // 5. Rapports
    elseif ($uri === '/rapports/main' && $method === 'GET') {
        (new ReportController())->mainReport();
    } elseif ($uri === '/rapports/comparatif' && $method === 'GET') {
        (new ReportController())->comparativeReport();
    } elseif ($uri === '/rapports/periode' && $method === 'GET') {
        (new ReportController())->periodReport();
    }

    // 6. Vecteurs & Entomologie
    elseif ($uri === '/vecteurs' && $method === 'GET') {
        (new EntomologyController())->index();
    } elseif ($uri === '/vecteurs' && $method === 'POST') {
        (new EntomologyController())->store();
    }

    // 7. Administration & Audit
    elseif ($uri === '/admin/utilisateurs' && $method === 'GET') {
        (new AdminController())->listUsers();
    } elseif ($uri === '/admin/utilisateurs' && $method === 'POST') {
        (new AdminController())->createUser();
    } elseif (preg_match('#^/admin/utilisateurs/(\d+)/toggle-saisie$#', $uri, $m) && $method === 'POST') {
        (new AdminController())->toggleDroitSaisie((int)$m[1]);
    } elseif ($uri === '/admin/audit-logs' && $method === 'GET') {
        (new AdminController())->auditLogs();
    }

    // Route 404
    else {
        Response::error("Point d'accès introuvable : {$method} {$uri}", 404);
    }
} catch (\Throwable $e) {
    Response::error("Erreur serveur : " . $e->getMessage(), 500);
}
