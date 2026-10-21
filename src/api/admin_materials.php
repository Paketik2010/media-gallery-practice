<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$user = requireAdmin($pdo);

$sql = materialSelect() . "
    ORDER BY m.created_at DESC
    LIMIT 500
";

$stmt = $pdo->prepare($sql);
$stmt->execute([(int)$user['id']]);
$rows = $stmt->fetchAll();

jsonResponse([
    'materials' => array_map('materialToJson', $rows),
]);
