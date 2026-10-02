<?php
declare(strict_types=1);

const STORAGE_DIR = __DIR__ . '/../storage';
const PROJECTS_FILE = STORAGE_DIR . '/projects.json';
const ADMIN_FILE = STORAGE_DIR . '/admin.json';

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('baimaja_admin');
    session_set_cookie_params([
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Strict',
        'path' => '/',
    ]);
    session_start();
    $_SESSION['csrf_token'] ??= bin2hex(random_bytes(32));
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function request_data(): array
{
    $body = file_get_contents('php://input');
    $data = json_decode($body ?: '', true);
    return is_array($data) ? $data : [];
}

function require_csrf(string $token): void
{
    if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        json_response(['error' => 'Sesi tidak valid. Muat ulang halaman admin lalu coba lagi.'], 403);
    }
}

function require_admin(): void
{
    if (empty($_SESSION['admin_authenticated'])) {
        json_response(['error' => 'Silakan login sebagai admin terlebih dahulu.'], 401);
    }
}

function read_admin_record(): ?array
{
    if (!is_file(ADMIN_FILE)) {
        return null;
    }

    $record = json_decode((string) file_get_contents(ADMIN_FILE), true);
    return is_array($record) ? $record : null;
}

function read_projects(): array
{
    $projects = json_decode((string) file_get_contents(PROJECTS_FILE), true);
    return is_array($projects) ? $projects : [];
}

function write_projects(array $projects): void
{
    $json = json_encode($projects, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false || file_put_contents(PROJECTS_FILE, $json . PHP_EOL, LOCK_EX) === false) {
        throw new RuntimeException('Data portfolio tidak dapat disimpan. Periksa izin folder storage.');
    }
}

function remove_uploaded_project_images(array $project): void
{
    foreach (($project['images'] ?? []) as $image) {
        if (!is_string($image) || !str_starts_with($image, 'assets/img/uploads/')) {
            continue;
        }

        $filename = basename($image);
        $path = __DIR__ . '/../assets/img/uploads/' . $filename;
        if (is_file($path)) {
            unlink($path);
        }
    }
}