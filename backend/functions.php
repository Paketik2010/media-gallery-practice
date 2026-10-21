<?php

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');

    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function currentUser(PDO $pdo): ?array {
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, name, username, email, role, created_at FROM users WHERE id = ?');
    $stmt->execute([(int)$_SESSION['user_id']]);
    $user = $stmt->fetch();

    return $user ?: null;
}

function requireUser(PDO $pdo): array {
    $user = currentUser($pdo);

    if (!$user) {
        jsonResponse(['error' => 'Требуется авторизация'], 401);
    }

    return $user;
}

function requireAdmin(PDO $pdo): array {
    $user = requireUser($pdo);

    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'Недостаточно прав'], 403);
    }

    return $user;
}

function materialSelect(): string {
    return "
        SELECT
            m.*,
            c.name AS category_name,
            c.slug AS category_slug,
            u.name AS author_name,
            u.username AS author_username,
            (SELECT COUNT(*) FROM favorites f WHERE f.material_id = m.id) AS likes_count,
            EXISTS(
                SELECT 1
                FROM favorites f2
                WHERE f2.material_id = m.id AND f2.user_id = ?
            ) AS liked_by_me
        FROM materials m
        JOIN categories c ON c.id = m.category_id
        JOIN users u ON u.id = m.author_id
    ";
}

function materialToJson(array $row): array {
    return [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'description' => $row['description'],
        'tags' => array_values(array_filter(array_map('trim', explode(',', (string)($row['tags'] ?? ''))))),
        'type' => $row['type'],
        'category' => $row['category_name'],
        'categorySlug' => $row['category_slug'],
        'fileUrl' => $row['file_path'] ?: null,
        'sourceUrl' => $row['source_url'] ?: null,
        'thumbnailUrl' => $row['thumbnail_url'] ?: null,
        'originalName' => $row['original_name'] ?: null,
        'mimeType' => $row['mime_type'] ?: null,
        'sizeBytes' => (int)$row['size_bytes'],
        'views' => (int)$row['views'],
        'likes' => (int)$row['likes_count'],
        'liked' => !empty($row['liked_by_me']),
        'createdAt' => $row['created_at'],
        'author' => [
            'id' => (int)$row['author_id'],
            'name' => $row['author_name'],
            'username' => $row['author_username'],
        ],
    ];
}

function getMaterial(PDO $pdo, int $id, int $currentUserId = 0): ?array {
    $sql = materialSelect() . "
        WHERE m.id = ?
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$currentUserId, $id]);
    $row = $stmt->fetch();

    return $row ?: null;
}

function getCategoryId(PDO $pdo, string $value): int {
    $value = trim($value);

    if (ctype_digit($value)) {
        $stmt = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
        $stmt->execute([(int)$value]);
        $row = $stmt->fetch();

        if ($row) {
            return (int)$row['id'];
        }
    }

    $stmt = $pdo->prepare('SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1');
    $stmt->execute([$value, $value]);
    $row = $stmt->fetch();

    if ($row) {
        return (int)$row['id'];
    }

    $row = $pdo->query("SELECT id FROM categories WHERE slug = 'other' LIMIT 1")->fetch();
    return (int)$row['id'];
}

function validHttpUrl(string $url): ?string {
    $url = trim($url);

    if ($url === '' || !filter_var($url, FILTER_VALIDATE_URL)) {
        return null;
    }

    $scheme = strtolower((string)parse_url($url, PHP_URL_SCHEME));

    return in_array($scheme, ['http', 'https'], true) ? $url : null;
}

function detectUploadType(?array $file): ?string {
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || empty($file['tmp_name'])) {
        return null;
    }

    $name = strtolower((string)($file['name'] ?? ''));
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

    if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) return 'image';
    if (in_array($ext, ['mp3', 'wav', 'm4a', 'aac', 'flac', 'oga', 'ogg'], true)) return 'audio';
    if (in_array($ext, ['mp4', 'webm', 'ogv', 'mov'], true)) return 'video';

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($file['tmp_name']);

    if (str_starts_with($mime, 'image/')) return 'image';
    if (str_starts_with($mime, 'audio/') || $mime === 'application/ogg') return 'audio';
    if (str_starts_with($mime, 'video/')) return 'video';

    return null;
}

function saveUpload(string $type, ?array $file): ?array {
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        jsonResponse(['error' => 'Ошибка загрузки файла'], 400);
    }

    $limits = [
        'image' => 20 * 1024 * 1024,
        'video' => 500 * 1024 * 1024,
        'audio' => 100 * 1024 * 1024,
    ];

    if (($file['size'] ?? 0) > $limits[$type]) {
        jsonResponse(['error' => 'Файл слишком большой'], 413);
    }

    $allowed = [
        'image' => [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ],
        'video' => [
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
            'video/ogg' => 'ogv',
            'video/quicktime' => 'mov',
        ],
        'audio' => [
            'audio/mpeg' => 'mp3',
            'audio/wav' => 'wav',
            'audio/x-wav' => 'wav',
            'audio/ogg' => 'ogg',
            'application/ogg' => 'ogg',
            'audio/mp4' => 'm4a',
            'audio/x-m4a' => 'm4a',
            'audio/aac' => 'aac',
            'audio/flac' => 'flac',
        ],
    ];

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($file['tmp_name']);
    $ext = strtolower(pathinfo((string)($file['name'] ?? ''), PATHINFO_EXTENSION));

    if ($type === 'audio' && $ext === 'm4a' && in_array($mime, ['video/mp4', 'application/mp4', 'application/octet-stream'], true)) {
        $mime = 'audio/mp4';
    }

    if (!isset($allowed[$type][$mime])) {
        jsonResponse(['error' => 'Неподдерживаемый формат файла'], 400);
    }

    $uploadDir = dirname(__DIR__) . '/src/uploads';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $fileName = bin2hex(random_bytes(10)) . '.' . $allowed[$type][$mime];
    $fullPath = $uploadDir . '/' . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
        jsonResponse(['error' => 'Не удалось сохранить файл'], 500);
    }

    return [
        'file_path' => '/uploads/' . $fileName,
        'original_name' => basename((string)$file['name']),
        'mime_type' => $mime,
        'size_bytes' => (int)$file['size'],
    ];
}
