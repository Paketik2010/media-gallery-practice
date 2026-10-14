<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$id = (int)($_GET['id'] ?? 0);
if ($id < 1) {
    jsonResponse(['error' => 'Материал не найден'], 404);
}

$row = getMaterial($pdo, $id);

if (!$row) {
    jsonResponse(['error' => 'Материал не найден'], 404);
}

jsonResponse(['material' => materialToJson($row)]);
