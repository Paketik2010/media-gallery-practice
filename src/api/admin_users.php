<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

requireAdmin($pdo);

$rows = $pdo->query('
    SELECT
        u.id,
        u.name,
        u.username,
        u.email,
        u.role,
        u.created_at,
        COUNT(m.id) AS materials_count
    FROM users u
    LEFT JOIN materials m ON m.author_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
')->fetchAll();

jsonResponse(['users' => $rows]);
