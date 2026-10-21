<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Метод не поддерживается'], 405);
}

$data = getJsonBody();

$name = trim((string)($data['name'] ?? $data['fullname'] ?? ''));
$username = trim((string)($data['username'] ?? ''));
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');
$confirm = (string)($data['confirm_password'] ?? $data['confirmPassword'] ?? '');

$errors = [];

if (mb_strlen($name) < 2) $errors['name'] = 'Введите имя';
if (!preg_match('/^[\p{L}\p{N}_.-]{3,32}$/u', $username)) $errors['username'] = 'Логин: 3–32 символа, буквы, цифры, точка, дефис или _';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Некорректный email';
if (mb_strlen($password) < 8) $errors['password'] = 'Минимум 8 символов';
if ($password !== $confirm) $errors['confirm_password'] = 'Пароли не совпадают';

if ($errors) {
    jsonResponse(['error' => 'Проверьте форму', 'fields' => $errors], 422);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
$stmt->execute([$username, $email]);

if ($stmt->fetch()) {
    jsonResponse(['error' => 'Пользователь уже существует'], 409);
}

$stmt = $pdo->prepare("INSERT INTO users(name, username, email, password_hash, role) VALUES(?,?,?,?, 'user')");
$stmt->execute([$name, $username, $email, password_hash($password, PASSWORD_DEFAULT)]);

$_SESSION['user_id'] = (int)$pdo->lastInsertId();

jsonResponse([
    'ok' => true,
    'user' => currentUser($pdo),
], 201);
