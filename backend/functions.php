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

    $stmt = $pdo->prepare('SELECT id, name, username, email, created_at FROM users WHERE id = ?');
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

function materialSelect(): string {
    return "
        SELECT
            m.*,
            c.name AS category_name,
            c.slug AS category_slug,
            u.name AS author_name,
            u.username AS author_username
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
        'type' => $row['type'],
        'category' => $row['category_name'],
        'fileUrl' => $row['file_path'] ?: null,
        'sourceUrl' => $row['source_url'] ?: null,
        'createdAt' => $row['created_at'],
        'author' => [
            'id' => (int)$row['author_id'],
            'name' => $row['author_name'],
            'username' => $row['author_username'],
        ],
    ];
}

function getMaterial(PDO $pdo, int $id): ?array {
    $sql = materialSelect() . "
        WHERE m.id = ?
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
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
