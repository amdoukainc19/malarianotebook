<?php
/**
 * =============================================================================
 * API REST PHP 8+ - Hôpital de Koron, AngloGold Ashanti SAG Siguiri
 * Programme de Lutte contre le Paludisme & IRS (Pulvérisation Intradomiciliaire)
 * Fichier : config/Database.php
 * =============================================================================
 */

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    private static string $host = '127.0.0.1';
    private static string $db_name = 'sag_malaria_irs_2026';
    private static string $username = 'root';
    private static string $password = '';
    private static int $port = 3306;

    /**
     * Obtenir l'instance PDO unique (Pattern Singleton)
     */
    public static function getConnection(): PDO {
        if (self::$instance === null) {
            // Lecture éventuelle depuis l'environnement ou les constantes XAMPP/WAMP
            $host = getenv('DB_HOST') ?: self::$host;
            $db   = getenv('DB_NAME') ?: self::$db_name;
            $user = getenv('DB_USER') ?: self::$username;
            $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : self::$password;
            $port = getenv('DB_PORT') ?: self::$port;

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'succes' => false,
                    'message' => 'Erreur de connexion à la base de données de l\'Hôpital de Koron : ' . $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        return self::$instance;
    }
}
