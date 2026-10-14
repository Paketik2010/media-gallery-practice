<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$_SESSION = [];
session_destroy();

jsonResponse(['ok' => true]);
