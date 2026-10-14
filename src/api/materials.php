<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$mine = ($_GET['mine'] ?? '') === '1';

if ($mine) {
    $user = requireUser($pdo);
    $stmt = $pdo->prepare(materialSelect() . ' WHERE m.author_id = ? ORDER BY m.created_at DESC LIMIT 100');
    $stmt->execute([(int)$user['id']]);
} else {
    $stmt = $pdo->query(materialSelect() . ' ORDER BY m.created_at DESC LIMIT 100');
}

$rows = $stmt->fetchAll();

jsonResponse([
    'materials' => array_map('materialToJson', $rows),
    'total' => count($rows),
]);
