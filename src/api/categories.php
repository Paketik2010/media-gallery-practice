<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$rows = $pdo->query('SELECT id, name FROM categories ORDER BY id')->fetchAll();

jsonResponse(['categories' => $rows]);
