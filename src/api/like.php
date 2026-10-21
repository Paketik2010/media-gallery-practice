<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$user = requireUser($pdo);
$data = getJsonBody();
$id = (int)($data['id'] ?? 0);

$stmt = $pdo->prepare('SELECT id FROM materials WHERE id = ?');
$stmt->execute([$id]);

if (!$stmt->fetch()) {
    jsonResponse(['error' => 'Материал не найден'], 404);
}

$stmt = $pdo->prepare('SELECT 1 FROM favorites WHERE user_id = ? AND material_id = ?');
$stmt->execute([(int)$user['id'], $id]);
$liked = (bool)$stmt->fetchColumn();

if ($liked) {
    $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND material_id = ?');
    $stmt->execute([(int)$user['id'], $id]);
} else {
    $stmt = $pdo->prepare('INSERT INTO favorites(user_id, material_id) VALUES(?, ?)');
    $stmt->execute([(int)$user['id'], $id]);
}

$stmt = $pdo->prepare('SELECT COUNT(*) FROM favorites WHERE material_id = ?');
$stmt->execute([$id]);

jsonResponse([
    'liked' => !$liked,
    'likes' => (int)$stmt->fetchColumn(),
]);
