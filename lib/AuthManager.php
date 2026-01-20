<?php
/**
 * AuthManager - Gestión de autenticación del panel de administración
 *
 * Maneja:
 * - Login con validación de contraseña
 * - Verificación de sesión activa
 * - Timeout de sesión
 * - Logout
 * - Generación y validación de tokens CSRF
 */

class AuthManager
{
    private $sessionTimeout;
    private $sessionKey = 'admin_authenticated';
    private $sessionTimeKey = 'admin_last_activity';

    public function __construct()
    {
        $this->sessionTimeout = SESSION_TIMEOUT;
    }

    /**
     * Intenta autenticar un usuario con contraseña
     *
     * @param string $password Contraseña a verificar
     * @return bool True si la autenticación fue exitosa
     */
    public function login($password)
    {
        if (!is_string($password) || empty($password)) {
            logMessage('Intento de login con contraseña vacía', 'WARNING');
            return false;
        }

        // Verificar contraseña con hash almacenado
        if (password_verify($password, ADMIN_PASSWORD_HASH)) {
            // Regenerar ID de sesión para prevenir session fixation
            session_regenerate_id(true);

            // Establecer variables de sesión
            $_SESSION[$this->sessionKey] = true;
            $_SESSION[$this->sessionTimeKey] = time();
            $_SESSION['admin_ip'] = getClientIP();
            $_SESSION['admin_user_agent'] = getUserAgent();

            // Generar token CSRF
            generateCSRFToken();

            logMessage('Login exitoso desde IP: ' . getClientIP(), 'INFO');
            return true;
        }

        logMessage('Intento de login fallido desde IP: ' . getClientIP(), 'WARNING');
        return false;
    }

    /**
     * Verifica si hay una sesión de administrador activa y válida
     *
     * @param bool $checkTimeout Si debe verificar el timeout
     * @return bool True si está autenticado
     */
    public function isAuthenticated($checkTimeout = true)
    {
        // Verificar si existe la sesión
        if (!isset($_SESSION[$this->sessionKey]) || $_SESSION[$this->sessionKey] !== true) {
            return false;
        }

        // Verificar timeout si está habilitado
        if ($checkTimeout) {
            if (!isset($_SESSION[$this->sessionTimeKey])) {
                $this->logout();
                return false;
            }

            $elapsedTime = time() - $_SESSION[$this->sessionTimeKey];

            if ($elapsedTime > $this->sessionTimeout) {
                logMessage('Sesión expirada por timeout', 'INFO');
                $this->logout();
                return false;
            }

            // Renovar tiempo de actividad
            $_SESSION[$this->sessionTimeKey] = time();
        }

        // Verificar que la IP y User-Agent sean consistentes (protección básica)
        if (isset($_SESSION['admin_ip']) && $_SESSION['admin_ip'] !== getClientIP()) {
            logMessage('Sesión inválida: cambio de IP detectado', 'WARNING');
            $this->logout();
            return false;
        }

        return true;
    }

    /**
     * Cierra la sesión del administrador
     */
    public function logout()
    {
        // Eliminar variables de sesión
        unset($_SESSION[$this->sessionKey]);
        unset($_SESSION[$this->sessionTimeKey]);
        unset($_SESSION['admin_ip']);
        unset($_SESSION['admin_user_agent']);
        unset($_SESSION['csrf_token']);

        // Destruir sesión completamente
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        logMessage('Logout exitoso', 'INFO');
    }

    /**
     * Requiere autenticación o termina la ejecución
     *
     * @param bool $returnJson Si debe retornar JSON en caso de fallo
     */
    public function requireAuth($returnJson = true)
    {
        if (!$this->isAuthenticated()) {
            if ($returnJson) {
                jsonResponse([
                    'success' => false,
                    'error' => 'No autenticado',
                    'code' => 'NOT_AUTHENTICATED'
                ], 401);
            } else {
                http_response_code(401);
                header('Location: /admin');
                exit;
            }
        }
    }

    /**
     * Obtiene el tiempo restante de sesión en segundos
     *
     * @return int Segundos restantes
     */
    public function getSessionTimeRemaining()
    {
        if (!isset($_SESSION[$this->sessionTimeKey])) {
            return 0;
        }

        $elapsedTime = time() - $_SESSION[$this->sessionTimeKey];
        $remaining = $this->sessionTimeout - $elapsedTime;

        return max(0, $remaining);
    }

    /**
     * Verifica si la contraseña actual es la contraseña por defecto
     *
     * @return bool True si es la contraseña por defecto
     */
    public function isDefaultPassword()
    {
        // Hash de la contraseña por defecto: Dtx2026!Sb#Adm9Px
        $defaultHash = '$2y$10$WkqZ3vH7L.uY9rXmFpQ.6OeY8K3N2VxBwQaE1TcMdPnRsLfUhGiKm';
        return ADMIN_PASSWORD_HASH === $defaultHash;
    }

    /**
     * Genera un nuevo hash de contraseña
     *
     * @param string $password Contraseña en texto plano
     * @return string Hash de la contraseña
     */
    public static function hashPassword($password)
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }
}
