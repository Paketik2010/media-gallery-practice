<?php

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$file = __DIR__ . '/src' . $path;

function serveMediaFile(string $file): void {
    $size = filesize($file);
    $start = 0;
    $end = $size - 1;
    $status = 200;

    $mime = mime_content_type($file) ?: 'application/octet-stream';
    header('Content-Type: ' . $mime);
    header('Accept-Ranges: bytes');

    $range = $_SERVER['HTTP_RANGE'] ?? '';

    if ($range && preg_match('/bytes=(\d*)-(\d*)/', $range, $match)) {
        if ($match[1] === '' && $match[2] !== '') {
            $length = min((int)$match[2], $size);
            $start = max(0, $size - $length);
        } else {
            if ($match[1] !== '') {
                $start = max(0, (int)$match[1]);
            }

            if ($match[2] !== '') {
                $end = min($end, (int)$match[2]);
            }
        }

        if ($start > $end || $start >= $size) {
            http_response_code(416);
            header('Content-Range: bytes */' . $size);
            exit;
        }

        $status = 206;
    }

    http_response_code($status);

    $length = $end - $start + 1;
    header('Content-Length: ' . $length);

    if ($status === 206) {
        header("Content-Range: bytes {$start}-{$end}/{$size}");
    }

    if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
        return;
    }

    $handle = fopen($file, 'rb');

    if (!$handle) {
        http_response_code(500);
        return;
    }

    fseek($handle, $start);
    $remaining = $length;

    while ($remaining > 0 && !feof($handle)) {
        $chunk = fread($handle, min(1024 * 1024, $remaining));

        if ($chunk === false) {
            break;
        }

        echo $chunk;
        $remaining -= strlen($chunk);
        flush();
    }

    fclose($handle);
}

if ($path === '/') {
    return false;
}

if (is_file($file)) {
    if (
        str_starts_with($path, '/uploads/') &&
        preg_match('/\.(mp4|webm|ogv|mov|mp3|wav|m4a|aac|flac|ogg)$/i', $file)
    ) {
        serveMediaFile($file);
        return true;
    }

    return false;
}

http_response_code(404);

if (str_starts_with($path, '/api/')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Страница не найдена'], JSON_UNESCAPED_UNICODE);
    return true;
}

readfile(__DIR__ . '/src/404.html');
return true;
