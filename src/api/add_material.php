<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$user = requireUser($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Метод не поддерживается'], 405);
}

$title = trim((string)($_POST['title'] ?? ''));
$description = trim((string)($_POST['description'] ?? ''));
$type = trim((string)($_POST['type'] ?? ''));
$category = trim((string)($_POST['category'] ?? ''));
$sourceUrl = validHttpUrl((string)($_POST['source_url'] ?? ''));

if (mb_strlen($title) < 2 || mb_strlen($title) > 200) {
    jsonResponse(['error' => 'Введите название материала'], 422);
}

if (mb_strlen($description) > 2000) {
    jsonResponse(['error' => 'Слишком длинное описание'], 422);
}

if (!in_array($type, ['image', 'video', 'audio'], true)) {
    jsonResponse(['error' => 'Выберите тип материала'], 422);
}

if (!$sourceUrl || strlen($sourceUrl) > 500) {
    jsonResponse(['error' => 'Укажите правильную ссылку на файл'], 422);
}

$categoryId = getCategoryId($pdo, $category);

if (!$categoryId) {
    jsonResponse(['error' => 'Выберите категорию'], 422);
}

$stmt = $pdo->prepare(
    'INSERT INTO materials(title, description, type, category_id, source_url, author_id)
     VALUES(?,?,?,?,?,?)'
);
$stmt->execute([
    $title, $description, $type, $categoryId,
    $sourceUrl, (int)$user['id']
]);

$id = (int)$pdo->lastInsertId();
$row = getMaterial($pdo, $id);

jsonResponse(['ok' => true, 'material' => materialToJson($row)], 201);
