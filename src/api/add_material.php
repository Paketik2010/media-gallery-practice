<?php
require dirname(__DIR__, 2) . '/backend/db.php';
require dirname(__DIR__, 2) . '/backend/functions.php';

$user = requireUser($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Метод не поддерживается'], 405);
}

$title = trim((string)($_POST['title'] ?? ''));
$description = trim((string)($_POST['description'] ?? ''));
$rawTags = trim((string)($_POST['tags'] ?? ''));
$tagParts = preg_split('/[,;\r\n]+/u', $rawTags) ?: [];
$cleanTags = [];

foreach ($tagParts as $tag) {
    $tag = ltrim(trim($tag), '#');

    if ($tag === '' || in_array($tag, $cleanTags, true)) {
        continue;
    }

    $cleanTags[] = mb_substr($tag, 0, 30);

    if (count($cleanTags) >= 8) {
        break;
    }
}

$tags = implode(',', $cleanTags);
$type = trim((string)($_POST['type'] ?? $_POST['media_type'] ?? ''));
$category = trim((string)($_POST['category'] ?? ''));
$sourceUrl = validHttpUrl((string)($_POST['source_url'] ?? ''));
$thumbnailUrl = validHttpUrl((string)($_POST['thumbnail_url'] ?? ''));

$detectedType = detectUploadType($_FILES['file'] ?? null);
if ($detectedType) {
    $type = $detectedType;
}

if (mb_strlen($title) < 2) {
    jsonResponse(['error' => 'Введите название материала'], 422);
}

if (!in_array($type, ['image', 'video', 'audio'], true)) {
    jsonResponse(['error' => 'Выберите тип материала'], 422);
}

$upload = saveUpload($type, $_FILES['file'] ?? null);
$thumbnailUpload = null;

if (!$upload && !$sourceUrl) {
    jsonResponse(['error' => 'Загрузите файл или укажите ссылку'], 422);
}

if ($type === 'image' && !$thumbnailUrl) {
    $thumbnailUrl = $upload['file_path'] ?? $sourceUrl;
}

if ($type === 'video') {
    $thumbnailUpload = saveUpload('image', $_FILES['thumbnail'] ?? null);

    if ($thumbnailUpload) {
        $thumbnailUrl = $thumbnailUpload['file_path'];
    }
}

$categoryId = getCategoryId($pdo, $category);

$stmt = $pdo->prepare('
    INSERT INTO materials(
        title,
        description,
        tags,
        type,
        category_id,
        file_path,
        source_url,
        thumbnail_url,
        original_name,
        mime_type,
        size_bytes,
        author_id
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
');

$stmt->execute([
    $title,
    $description,
    $tags,
    $type,
    $categoryId,
    $upload['file_path'] ?? null,
    $sourceUrl,
    $thumbnailUrl,
    $upload['original_name'] ?? null,
    $upload['mime_type'] ?? null,
    $upload['size_bytes'] ?? 0,
    (int)$user['id'],
]);

$id = (int)$pdo->lastInsertId();
$row = getMaterial($pdo, $id, (int)$user['id']);

jsonResponse([
    'ok' => true,
    'material' => materialToJson($row),
], 201);
