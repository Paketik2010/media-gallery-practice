<?php
session_start();

$root = dirname(__DIR__);
$envFile = $root . '/.env';
$env = file_exists($envFile) ? parse_ini_file($envFile) : [];

$host = $env['MG_DB_HOST'] ?? '127.0.0.1';
$port = $env['MG_DB_PORT'] ?? '3306';
$dbName = $env['MG_DB_NAME'] ?? 'mediagallery';
$dbUser = $env['MG_DB_USER'] ?? 'root';
$dbPass = $env['MG_DB_PASS'] ?? '';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Ошибка подключения к базе данных'], JSON_UNESCAPED_UNICODE);
    exit;
}
