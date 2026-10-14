<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Метод не поддерживается'], 405);
}

$data = getJsonBody();
$identifier = trim((string)($data['identifier'] ?? ''));
$password = (string)($data['password'] ?? '');

$stmt = $pdo->prepare('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1');
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(['error' => 'Неверный логин или пароль'], 401);
}

$_SESSION['user_id'] = (int)$user['id'];
session_regenerate_id(true);

jsonResponse([
    'ok' => true,
    'user' => currentUser($pdo),
]);
