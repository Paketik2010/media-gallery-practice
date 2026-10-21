<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$user = requireUser($pdo);
$data = getJsonBody();
$id = (int)($data['id'] ?? 0);

$stmt = $pdo->prepare('SELECT * FROM materials WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$material = $stmt->fetch();

if (!$material) {
    jsonResponse(['error' => 'Материал не найден'], 404);
}

if ((int)$material['author_id'] !== (int)$user['id'] && $user['role'] !== 'admin') {
    jsonResponse(['error' => 'Можно удалять только свои материалы'], 403);
}

foreach (['file_path', 'thumbnail_url'] as $field) {
    $path = (string)($material[$field] ?? '');

    if (!str_starts_with($path, '/uploads/')) {
        continue;
    }

    $file = dirname(__DIR__, 2) . '/src/uploads/' . basename($path);

    if (is_file($file)) {
        unlink($file);
    }
}

$stmt = $pdo->prepare('DELETE FROM materials WHERE id = ?');
$stmt->execute([$id]);

jsonResponse(['ok' => true]);
