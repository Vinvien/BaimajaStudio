<?php
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

if (str_starts_with($path, '/storage/') || $path === '/storage'
    || preg_match('~(?:^|/)\.~', $path)) {
    http_response_code(404);
    exit;
}

return false;