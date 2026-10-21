<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/db.php';

$categories = [
    ['Фотографии', 'photos'],
    ['Музыка', 'music'],
    ['Обучение', 'education'],
    ['Развлечения', 'entertainment'],
    ['Архитектура', 'architecture'],
    ['Город', 'city'],
    ['Дизайн', 'design'],
    ['Путешествия', 'travel'],
    ['Технологии', 'technology'],
    ['Подкасты', 'podcasts'],
    ['Звуковые эффекты', 'sound-effects'],
    ['Другое', 'other'],
];

$insertCategory = $pdo->prepare('INSERT INTO categories(name, slug) VALUES(?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)');
foreach ($categories as $category) {
    $insertCategory->execute($category);
}

$ensureUser = static function (string $name, string $username, string $email, string $password, string $role) use ($pdo): int {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$username, $email]);
    $existing = $stmt->fetch();
    if ($existing) {
        return (int)$existing['id'];
    }
    $stmt = $pdo->prepare('INSERT INTO users(name, username, email, password_hash, role) VALUES(?,?,?,?,?)');
    $stmt->execute([$name, $username, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
    return (int)$pdo->lastInsertId();
};

$ensureUser('Администратор', 'admin', 'admin@mediagallery.local', 'Admin123!', 'admin');
$alexId = $ensureUser('Алексей Смирнов', 'alex_smirnov', 'alex.smirnov@example.com', 'Demo123!', 'user');

$count = (int)$pdo->query('SELECT COUNT(*) FROM materials')->fetchColumn();
if ($count === 0) {
    $categoryMap = [];
    foreach ($pdo->query('SELECT id, name FROM categories')->fetchAll() as $row) {
        $categoryMap[$row['name']] = (int)$row['id'];
    }

    $image1 = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80';
    $image2 = 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80';
    $image3 = 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=80';
    $image4 = 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80';
    $video = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
    $audio = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';

    $rows = [
        ['Рассвет на плато Бермамыт', 'Первые лучи солнца над горным плато.', 'image', 'Фотографии', $image1, $image1],
        ['Геометрия бетона: Музей', 'Современная архитектура и строгие геометрические формы.', 'image', 'Архитектура', $image2, $image2],
        ['Утренняя роса на клевере', 'Макросъёмка природы после рассвета.', 'image', 'Фотографии', $image3, $image3],
        ['Неоновый город', 'Ночная городская фотография.', 'image', 'Город', $image4, $image4],
        ['CSS Grid и Flexbox', 'Короткое учебное видео по адаптивной верстке.', 'video', 'Обучение', $video, $image2],
        ['Дикая Исландия', 'Небольшой ролик о путешествиях.', 'video', 'Путешествия', $video, $image1],
        ['Flow Dynamics', 'Экспериментальная визуальная анимация.', 'video', 'Развлечения', $video, $image4],
        ['Веб-технологии 2026', 'Обзор современных технологий веб-разработки.', 'video', 'Технологии', $video, $image2],
        ['Synthwave Midnight Drive', 'Атмосферный электронный трек.', 'audio', 'Музыка', $audio, $image4],
        ['Lo-Fi Beats', 'Фоновая музыка для работы.', 'audio', 'Музыка', $audio, $image2],
        ['Подкаст о дизайне', 'Разговор о интерфейсах и дизайн-системах.', 'audio', 'Подкасты', $audio, $image3],
        ['Звуки природы', 'Набор звуков для мультимедийных проектов.', 'audio', 'Звуковые эффекты', $audio, $image1],
    ];

    $insert = $pdo->prepare('
        INSERT INTO materials(title, description, type, category_id, source_url, thumbnail_url, author_id, views)
        VALUES(?,?,?,?,?,?,?,?)
    ');
    foreach ($rows as $index => $row) {
        [$title, $description, $type, $category, $source, $thumb] = $row;
        $insert->execute([$title, $description, $type, $categoryMap[$category], $source, $thumb, $alexId, 100 + $index * 73]);
    }
}

echo "Seed complete\n";
echo "Demo user: alex_smirnov / Demo123!\n";
echo "Admin: admin / Admin123!\n";
