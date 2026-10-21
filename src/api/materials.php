<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$user = currentUser($pdo);
$currentUserId = $user ? (int)$user['id'] : 0;

$where = ['m.is_public = 1'];
$params = [];

$q = trim((string)($_GET['q'] ?? ''));
$type = trim((string)($_GET['type'] ?? ''));
$category = trim((string)($_GET['category'] ?? ''));
$mine = ($_GET['mine'] ?? '') === '1';

if ($q !== '') {
    $where[] = '(m.title LIKE ? OR m.description LIKE ? OR m.tags LIKE ? OR u.name LIKE ? OR u.username LIKE ?)';
    $search = '%' . $q . '%';
    array_push($params, $search, $search, $search, $search, $search);
}

if (in_array($type, ['image', 'video', 'audio'], true)) {
    $where[] = 'm.type = ?';
    $params[] = $type;
}

if ($category !== '' && $category !== 'all' && $category !== 'Все категории') {
    $where[] = '(c.name = ? OR c.slug = ?)';
    $params[] = $category;
    $params[] = $category;
}

if ($mine) {
    $user = requireUser($pdo);
    $where[] = 'm.author_id = ?';
    $params[] = (int)$user['id'];
}

$sort = $_GET['sort'] ?? 'newest';

if ($sort === 'oldest') {
    $order = 'm.created_at ASC';
} elseif ($sort === 'name') {
    $order = 'm.title ASC';
} elseif ($sort === 'size') {
    $order = 'm.size_bytes DESC, m.created_at DESC';
} elseif ($sort === 'popular') {
    $order = 'm.views DESC';
} else {
    $order = 'm.created_at DESC';
}

$sql = materialSelect() . "
    WHERE " . implode(' AND ', $where) . "
    ORDER BY $order
    LIMIT 100
";

$stmt = $pdo->prepare($sql);
$stmt->execute(array_merge([$currentUserId], $params));
$rows = $stmt->fetchAll();

jsonResponse([
    'materials' => array_map('materialToJson', $rows),
    'total' => count($rows),
]);
