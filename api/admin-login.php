<?php
/**
 * API Endpoint - Admin Login/Logout
 *
 * Endpoints:
 * - POST /api/admin-login.php → Login
 * - POST /api/admin-login.php?action=logout → Logout
 */

define('APP_ACCESS', true);
require_once __DIR__ . '/config.php';

$authManager = new AuthManager();

// ============================================================================
// LOGOUT
// ============================================================================

if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    if (isPostRequest()) {
        $authManager->logout();
        jsonResponse([
            'success' => true,
            'message' => 'Sesión cerrada correctamente'
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'error' => 'Método no permitido'
        ], 405);
    }
}

// ============================================================================
// LOGIN
// ============================================================================

// Solo aceptar POST
if (!isPostRequest()) {
    jsonResponse([
        'success' => false,
        'error' => 'Método no permitido'
    ], 405);
}

// Leer datos del body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    jsonResponse([
        'success' => false,
        'error' => 'JSON inválido'
    ], 400);
}

// Validar que se envió la contraseña
if (!isset($data['password']) || empty($data['password'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Contraseña requerida'
    ], 400);
}

$password = $data['password'];

// Intentar login
if ($authManager->login($password)) {
    // Generar token CSRF
    $csrfToken = generateCSRFToken();

    // Verificar si está usando la contraseña por defecto
    $isDefaultPassword = $authManager->isDefaultPassword();

    jsonResponse([
        'success' => true,
        'message' => 'Login exitoso',
        'csrfToken' => $csrfToken,
        'sessionTimeout' => SESSION_TIMEOUT,
        'isDefaultPassword' => $isDefaultPassword,
        'warning' => $isDefaultPassword ? 'Estás usando la contraseña por defecto. Por favor, cámbiala lo antes posible.' : null
    ]);
} else {
    // Agregar un pequeño delay para prevenir brute force
    sleep(2);

    jsonResponse([
        'success' => false,
        'error' => 'Contraseña incorrecta'
    ], 401);
}
