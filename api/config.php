<?php
/**
 * Configuración centralizada del sistema de gestión de pedidos
 *
 * Este archivo contiene:
 * - Carga de variables de entorno
 * - Definición de constantes
 * - Funciones de seguridad
 * - Headers de seguridad HTTP
 * - Configuración de sesiones
 */

// Prevenir acceso directo
if (!defined('APP_ACCESS')) {
    define('APP_ACCESS', true);
}

// Iniciar sesión con configuración segura
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1); // Requiere HTTPS
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_samesite', 'Strict');
    session_start();
}

// Headers de seguridad HTTP
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

// CORS - Ajustar según el dominio de producción
$allowedOrigins = [
    'https://detox-sabeho.herokuapp.com',
    'https://detoxsabeho.com',
    'https://www.detoxsabeho.com'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');

// Manejo de preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================================
// CONFIGURACIÓN DE VARIABLES DE ENTORNO
// ============================================================================

/**
 * Carga variables de entorno desde Heroku o archivo .env
 */
function loadEnvironmentVariables() {
    // Cargar desde .env si existe (desarrollo local)
    $envFile = dirname(__DIR__) . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            if (!getenv($key)) {
                putenv("$key=$value");
            }
        }
    }
}

loadEnvironmentVariables();

// ============================================================================
// CONSTANTES DE LA APLICACIÓN
// ============================================================================

// Rutas de archivos
define('ROOT_DIR', dirname(__DIR__));
define('DATA_DIR', ROOT_DIR . '/data');
define('LOG_DIR', ROOT_DIR . '/logs');
define('TEMPLATE_DIR', ROOT_DIR . '/templates');
define('ORDERS_FILE', DATA_DIR . '/orders.json');
define('RATE_LIMIT_FILE', DATA_DIR . '/rate_limit.json');
define('LOG_FILE', LOG_DIR . '/app.log');

// API Keys y configuración
define('RESEND_API_KEY', getenv('RESEND_API_KEY') ?: '');
define('EMAIL_FROM_DOMAIN', getenv('EMAIL_FROM_DOMAIN') ?: 'detoxsabeho.com');
define('ADMIN_PASSWORD_HASH', getenv('ADMIN_PASSWORD_HASH') ?: '$2y$10$WkqZ3vH7L.uY9rXmFpQ.6OeY8K3N2VxBwQaE1TcMdPnRsLfUhGiKm');
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost');

// Facebook Configuration
define('FACEBOOK_PIXEL_ID', getenv('FACEBOOK_PIXEL_ID') ?: '1142678136915324');
define('FACEBOOK_ACCESS_TOKEN', getenv('FACEBOOK_ACCESS_TOKEN') ?: '');
define('FACEBOOK_API_VERSION', getenv('FACEBOOK_API_VERSION') ?: 'v19.0');

// Emails
define('ADMIN_EMAIL', 'auxiliarmanuv@gmail.com');

// Configuración de rate limiting
define('RATE_LIMIT_MAX_REQUESTS', 10); // Máximo de pedidos
define('RATE_LIMIT_WINDOW', 3600); // Por hora (en segundos)

// Configuración de sesión
define('SESSION_TIMEOUT', 3600); // 1 hora

// Estados de pedidos
define('ORDER_STATUS_PENDING', 'pending');
define('ORDER_STATUS_PROCESSING', 'processing');
define('ORDER_STATUS_SHIPPED', 'shipped');
define('ORDER_STATUS_DELIVERED', 'delivered');
define('ORDER_STATUS_CANCELLED', 'cancelled');

// ============================================================================
// FUNCIONES DE SEGURIDAD
// ============================================================================

/**
 * Sanitiza un string para prevenir XSS
 *
 * @param string $str String a sanitizar
 * @return string String sanitizado
 */
function sanitizeString($str) {
    if (!is_string($str)) {
        return '';
    }
    // Eliminar tags HTML
    $str = strip_tags($str);
    // Convertir caracteres especiales
    $str = htmlspecialchars($str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // Eliminar espacios extra
    $str = trim($str);
    return $str;
}

/**
 * Valida que un string solo contenga caracteres seguros
 *
 * @param string $str String a validar
 * @param int $maxLength Longitud máxima permitida
 * @return bool True si es válido
 */
function isValidTextFormat($str, $maxLength = 100) {
    if (!is_string($str) || strlen($str) > $maxLength) {
        return false;
    }
    // Permitir letras, números, acentos y algunos símbolos
    $pattern = '/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\d\s.,\-\'()#\/]+$/u';
    return preg_match($pattern, $str) === 1;
}

/**
 * Valida formato de email
 *
 * @param string $email Email a validar
 * @return bool True si es válido
 */
function validateEmail($email) {
    if (!is_string($email) || strlen($email) > 100) {
        return false;
    }
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valida formato de teléfono colombiano (10 dígitos, empieza con 3)
 *
 * @param string $phone Teléfono a validar
 * @return bool True si es válido
 */
function validatePhone($phone) {
    if (!is_string($phone)) {
        return false;
    }
    // Limpiar caracteres no numéricos
    $cleaned = preg_replace('/\D/', '', $phone);
    // Debe tener exactamente 10 dígitos y empezar con 3
    return strlen($cleaned) === 10 && preg_match('/^3\d{9}$/', $cleaned) === 1;
}

/**
 * Valida que la dirección tenga mínimo de caracteres
 *
 * @param string $address Dirección a validar
 * @return bool True si es válida
 */
function validateAddress($address) {
    if (!is_string($address)) {
        return false;
    }
    return strlen(trim($address)) >= 10 && strlen($address) <= 200;
}

/**
 * Genera un token CSRF
 *
 * @return string Token CSRF
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Valida un token CSRF
 *
 * @param string $token Token a validar
 * @return bool True si es válido
 */
function validateCSRFToken($token) {
    if (!isset($_SESSION['csrf_token']) || !is_string($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Obtiene la IP del cliente
 *
 * @return string IP del cliente
 */
function getClientIP() {
    $ip = '';

    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        // Cloudflare
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Proxy
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }

    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

/**
 * Verifica rate limiting por IP
 *
 * @param string $ip IP del cliente
 * @return bool True si el límite no se ha excedido
 */
function checkRateLimit($ip) {
    $rateLimitFile = RATE_LIMIT_FILE;

    // Crear archivo si no existe
    if (!file_exists($rateLimitFile)) {
        file_put_contents($rateLimitFile, json_encode([]));
    }

    // Leer datos de rate limiting
    $data = json_decode(file_get_contents($rateLimitFile), true) ?: [];

    // Limpiar datos antiguos
    $currentTime = time();
    foreach ($data as $key => $value) {
        if ($currentTime - $value['timestamp'] > RATE_LIMIT_WINDOW) {
            unset($data[$key]);
        }
    }

    // Verificar límite para esta IP
    if (!isset($data[$ip])) {
        $data[$ip] = [
            'count' => 0,
            'timestamp' => $currentTime
        ];
    }

    // Incrementar contador
    $data[$ip]['count']++;
    $data[$ip]['last_request'] = $currentTime;

    // Guardar datos actualizados
    file_put_contents($rateLimitFile, json_encode($data));

    // Verificar si se excedió el límite
    return $data[$ip]['count'] <= RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Registra un mensaje en el log
 *
 * @param string $message Mensaje a registrar
 * @param string $level Nivel de log (INFO, WARNING, ERROR)
 */
function logMessage($message, $level = 'INFO') {
    $logFile = LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message\n";

    // Crear directorio de logs si no existe
    if (!file_exists(LOG_DIR)) {
        mkdir(LOG_DIR, 0755, true);
    }

    // Escribir en el log
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    // Rotar log si supera 10MB
    if (file_exists($logFile) && filesize($logFile) > 10 * 1024 * 1024) {
        rename($logFile, $logFile . '.' . date('Y-m-d-His'));
    }
}

/**
 * Envía respuesta JSON
 *
 * @param array $data Datos a enviar
 * @param int $statusCode Código de estado HTTP
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Valida que la petición sea AJAX
 *
 * @return bool True si es AJAX
 */
function isAjaxRequest() {
    return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

/**
 * Valida que la petición sea POST
 *
 * @return bool True si es POST
 */
function isPostRequest() {
    return $_SERVER['REQUEST_METHOD'] === 'POST';
}

/**
 * Valida que la petición sea GET
 *
 * @return bool True si es GET
 */
function isGetRequest() {
    return $_SERVER['REQUEST_METHOD'] === 'GET';
}

/**
 * Formatea un número como precio colombiano
 *
 * @param int|float $amount Cantidad a formatear
 * @return string Precio formateado
 */
function formatPrice($amount) {
    return '$' . number_format($amount, 0, ',', '.');
}

/**
 * Obtiene el User-Agent del cliente
 *
 * @return string User-Agent
 */
function getUserAgent() {
    return isset($_SERVER['HTTP_USER_AGENT']) ?
           substr(sanitizeString($_SERVER['HTTP_USER_AGENT']), 0, 255) :
           'Unknown';
}

// ============================================================================
// AUTOLOAD DE CLASES
// ============================================================================

/**
 * Autoload simple para las clases del proyecto
 */
spl_autoload_register(function ($className) {
    $libPath = ROOT_DIR . '/lib/' . $className . '.php';
    if (file_exists($libPath)) {
        require_once $libPath;
    }
});

// Cargar Composer autoload si existe
$composerAutoload = ROOT_DIR . '/vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
}

// ============================================================================
// VERIFICACIÓN DE CONFIGURACIÓN
// ============================================================================

// Verificar que las claves API estén configuradas en producción
if (APP_ENV === 'production') {
    if (empty(RESEND_API_KEY)) {
        logMessage('RESEND_API_KEY no está configurada', 'WARNING');
    }
    if (ADMIN_PASSWORD_HASH === '$2y$10$WkqZ3vH7L.uY9rXmFpQ.6OeY8K3N2VxBwQaE1TcMdPnRsLfUhGiKm') {
        logMessage('Usando contraseña de admin por defecto - CAMBIAR INMEDIATAMENTE', 'WARNING');
    }
}

// Crear directorios si no existen
if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}
if (!file_exists(LOG_DIR)) {
    mkdir(LOG_DIR, 0755, true);
}
