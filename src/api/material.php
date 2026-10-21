<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$id = (int)($_GET['id'] ?? 0);
$user = currentUser($pdo);
$currentUserId = $user ? (int)$user['id'] : 0;

if ($id < 1) {
    jsonResponse(['error' => 'Материал не найден'], 404);
}

$stmt = $pdo->prepare('UPDATE materials SET views = views + 1 WHERE id = ?');
$stmt->execute([$id]);

$row = getMaterial($pdo, $id, $currentUserId);

if (!$row) {
    jsonResponse(['error' => 'Материал не найден'], 404);
}

jsonResponse(['material' => materialToJson($row)]);
