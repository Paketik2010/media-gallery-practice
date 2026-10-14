<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$user = currentUser($pdo);

jsonResponse(['user' => $user]);
