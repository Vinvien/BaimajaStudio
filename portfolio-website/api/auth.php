<?php
declare(strict_types=1);

require __DIR__ . '/common.php';
start_app_session();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response([
        'authenticated' => !empty($_SESSION['admin_authenticated']),
        'setupRequired' => read_admin_record() === null,
        'csrfToken' => $_SESSION['csrf_token'],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Metode tidak didukung.'], 405);
}

$data = request_data();
require_csrf((string) ($data['csrfToken'] ?? ''));
$action = (string) ($data['action'] ?? '');

if ($action === 'setup') {
    $remoteAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($remoteAddress, ['127.0.0.1', '::1'], true)) {
        json_response(['error' => 'Setup admin pertama hanya dapat dilakukan dari komputer ini.'], 403);
    }
    if (read_admin_record() !== null) {
        json_response(['error' => 'Akun admin sudah dibuat. Silakan login.'], 409);
    }

    $username = trim((string) ($data['username'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    if (strlen($username) < 3 || strlen($username) > 64) {
        json_response(['error' => 'Username harus berisi 3 sampai 64 karakter.'], 422);
    }
    if (strlen($password) < 12 || strlen($password) > 200) {
        json_response(['error' => 'Password harus berisi minimal 12 karakter.'], 422);
    }

    $record = [
        'username' => $username,
        'passwordHash' => password_hash($password, PASSWORD_DEFAULT),
    ];
    if (file_put_contents(ADMIN_FILE, json_encode($record, JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
        json_response(['error' => 'Akun admin tidak dapat disimpan. Periksa izin folder storage.'], 500);
    }

    session_regenerate_id(true);
    $_SESSION['admin_authenticated'] = true;
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    json_response(['authenticated' => true, 'csrfToken' => $_SESSION['csrf_token']]);
}

if ($action === 'login') {
    if (!empty($_SESSION['login_locked_until']) && $_SESSION['login_locked_until'] > time()) {
        json_response(['error' => 'Terlalu banyak percobaan. Coba lagi sebentar.'], 429);
    }

    $record = read_admin_record();
    $username = (string) ($data['username'] ?? '');
    $password = (string) ($data['password'] ?? '');
    if (!$record || !hash_equals((string) ($record['username'] ?? ''), $username)
        || !password_verify($password, (string) ($record['passwordHash'] ?? ''))) {
        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
        if ($_SESSION['login_attempts'] >= 5) {
            $_SESSION['login_attempts'] = 0;
            $_SESSION['login_locked_until'] = time() + 30;
        }
        json_response(['error' => 'Username atau password tidak sesuai.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['admin_authenticated'] = true;
    $_SESSION['login_attempts'] = 0;
    unset($_SESSION['login_locked_until']);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    json_response(['authenticated' => true, 'csrfToken' => $_SESSION['csrf_token']]);
}

if ($action === 'logout') {
    require_admin();
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    json_response(['authenticated' => false, 'csrfToken' => $_SESSION['csrf_token']]);
}

json_response(['error' => 'Aksi tidak dikenal.'], 400);