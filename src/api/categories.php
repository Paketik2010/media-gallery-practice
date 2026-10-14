<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$rows = $pdo->query('SELECT id, name, slug FROM categories ORDER BY name')->fetchAll();

jsonResponse(['categories' => $rows]);
