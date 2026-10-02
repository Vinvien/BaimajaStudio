<?php
declare(strict_types=1);

require __DIR__ . '/common.php';
start_app_session();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(['projects' => read_projects()]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Metode tidak didukung.'], 405);
}

require_admin();
require_csrf((string) ($_POST['csrfToken'] ?? ''));
$projects = read_projects();
$action = (string) ($_POST['action'] ?? '');

if ($action === 'delete') {
    $id = (string) ($_POST['id'] ?? '');
    $index = array_search($id, array_column($projects, 'id'), true);
    if ($index === false) {
        json_response(['error' => 'Project tidak ditemukan.'], 404);
    }

    $removed = $projects[$index];
    array_splice($projects, $index, 1);
    write_projects($projects);
    remove_uploaded_project_images($removed);
    json_response(['projects' => $projects]);
}

if ($action !== 'save') {
    json_response(['error' => 'Aksi tidak dikenal.'], 400);
}

$id = (string) ($_POST['id'] ?? '');
$existingIndex = $id === '' ? false : array_search($id, array_column($projects, 'id'), true);
if ($id !== '' && $existingIndex === false) {
    json_response(['error' => 'Project yang akan diedit tidak ditemukan.'], 404);
}

$title = trim((string) ($_POST['title'] ?? ''));
$category = (string) ($_POST['category'] ?? '');
$description = trim((string) ($_POST['description'] ?? ''));
$allowedCategories = ['illustration', 'branding', 't-shirt', 'logo', 'cover', 'poster', 'other'];
if ($title === '' || strlen($title) > 120) {
    json_response(['error' => 'Judul wajib diisi dan maksimal 120 karakter.'], 422);
}
if (!in_array($category, $allowedCategories, true)) {
    json_response(['error' => 'Kategori tidak valid.'], 422);
}
if (strlen($description) > 3000) {
    json_response(['error' => 'Deskripsi maksimal 3000 karakter.'], 422);
}

$slug = trim((string) ($_POST['slug'] ?? ''));
if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
    json_response(['error' => 'Judul tidak dapat dijadikan slug project.'], 422);
}

$newImages = [];
try {
    if (isset($_FILES['images'])) {
        $files = $_FILES['images'];
        $names = is_array($files['name']) ? $files['name'] : [$files['name']];
        $temporaryPaths = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];
        $errors = is_array($files['error']) ? $files['error'] : [$files['error']];
        $sizes = is_array($files['size']) ? $files['size'] : [$files['size']];

        if (count($names) > 8) {
            throw new RuntimeException('Maksimal 8 gambar untuk satu project.');
        }

        $uploadDirectory = __DIR__ . '/../assets/img/uploads';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
            throw new RuntimeException('Folder upload tidak dapat dibuat.');
        }

        foreach ($names as $index => $name) {
            if (($errors[$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE || $name === '') {
                continue;
            }
            if (($errors[$index] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Upload gagal. Coba gambar yang lebih kecil.');
            }
            if (($sizes[$index] ?? 0) > 8 * 1024 * 1024) {
                throw new RuntimeException('Ukuran setiap gambar maksimal 8 MB.');
            }

            $imageInfo = @getimagesize($temporaryPaths[$index]);
            $mime = $imageInfo['mime'] ?? '';
            $extensions = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
            ];
            if (!isset($extensions[$mime])) {
                throw new RuntimeException('Format gambar harus JPG, PNG, GIF, atau WebP.');
            }
            if (($imageInfo[0] * $imageInfo[1]) > 40000000) {
                throw new RuntimeException('Resolusi gambar terlalu besar.');
            }

            $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
            if (!move_uploaded_file($temporaryPaths[$index], $uploadDirectory . '/' . $filename)) {
                throw new RuntimeException('Gambar tidak dapat dipindahkan ke folder upload.');
            }
            $newImages[] = 'assets/img/uploads/' . $filename;
        }
    }

    if ($existingIndex === false && count($newImages) === 0) {
        throw new RuntimeException('Project baru wajib memiliki minimal satu gambar.');
    }

    $existing = $existingIndex === false ? null : $projects[$existingIndex];
    $savedProject = [
        'id' => $existing['id'] ?? bin2hex(random_bytes(8)),
        'title' => $title,
        'slug' => $slug,
        'category' => $category,
        'description' => $description,
        'featured' => ($_POST['featured'] ?? '') === 'true',
        'images' => count($newImages) > 0 ? $newImages : ($existing['images'] ?? []),
    ];

    if ($existingIndex === false) {
        array_unshift($projects, $savedProject);
    } else {
        $projects[$existingIndex] = $savedProject;
    }
    write_projects($projects);

    if ($existing && count($newImages) > 0) {
        remove_uploaded_project_images($existing);
    }
    json_response(['projects' => $projects]);
} catch (Throwable $error) {
    foreach ($newImages as $image) {
        remove_uploaded_project_images(['images' => [$image]]);
    }
    json_response(['error' => $error->getMessage()], 422);
}
