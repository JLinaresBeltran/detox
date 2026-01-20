<?php
/**
 * API Endpoint - Admin Orders Management
 *
 * Endpoints (todos requieren autenticación):
 * - GET ?action=list → Obtener lista de pedidos
 * - GET ?action=stats → Obtener estadísticas
 * - POST action=updateStatus → Actualizar estado de pedido
 * - GET ?action=export&format=csv → Exportar a CSV
 */

define('APP_ACCESS', true);
require_once __DIR__ . '/config.php';

$authManager = new AuthManager();
$orderManager = new OrderManager();

// ============================================================================
// VERIFICAR AUTENTICACIÓN
// ============================================================================

$authManager->requireAuth(true);

// ============================================================================
// DETERMINAR ACCIÓN
// ============================================================================

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

if (empty($action)) {
    jsonResponse([
        'success' => false,
        'error' => 'Acción no especificada'
    ], 400);
}

// ============================================================================
// LISTAR PEDIDOS
// ============================================================================

if ($action === 'list' && isGetRequest()) {
    try {
        // Obtener filtros opcionales
        $filters = [];

        if (isset($_GET['status']) && $_GET['status'] !== '') {
            $filters['status'] = sanitizeString($_GET['status']);
        }

        if (isset($_GET['productId']) && $_GET['productId'] !== '') {
            $filters['productId'] = (int)$_GET['productId'];
        }

        if (isset($_GET['search']) && $_GET['search'] !== '') {
            $filters['search'] = sanitizeString($_GET['search']);
        }

        // Obtener pedidos
        $orders = $orderManager->getOrders($filters);

        jsonResponse([
            'success' => true,
            'orders' => $orders,
            'count' => count($orders)
        ]);

    } catch (Exception $e) {
        logMessage("Error al listar pedidos: " . $e->getMessage(), 'ERROR');
        jsonResponse([
            'success' => false,
            'error' => 'Error al obtener pedidos'
        ], 500);
    }
}

// ============================================================================
// OBTENER ESTADÍSTICAS
// ============================================================================

elseif ($action === 'stats' && isGetRequest()) {
    try {
        $stats = $orderManager->getStatistics();

        jsonResponse([
            'success' => true,
            'stats' => $stats
        ]);

    } catch (Exception $e) {
        logMessage("Error al obtener estadísticas: " . $e->getMessage(), 'ERROR');
        jsonResponse([
            'success' => false,
            'error' => 'Error al obtener estadísticas'
        ], 500);
    }
}

// ============================================================================
// ACTUALIZAR ESTADO DE PEDIDO
// ============================================================================

elseif ($action === 'updateStatus' && isPostRequest()) {
    try {
        // Leer datos del body
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            jsonResponse([
                'success' => false,
                'error' => 'JSON inválido'
            ], 400);
        }

        // Validar CSRF token
        if (!isset($data['csrfToken']) || !validateCSRFToken($data['csrfToken'])) {
            logMessage('Intento de actualización de pedido con token CSRF inválido', 'WARNING');
            jsonResponse([
                'success' => false,
                'error' => 'Token CSRF inválido'
            ], 403);
        }

        // Validar datos requeridos
        if (!isset($data['orderId']) || !isset($data['status'])) {
            jsonResponse([
                'success' => false,
                'error' => 'Datos incompletos (orderId y status requeridos)'
            ], 400);
        }

        $orderId = sanitizeString($data['orderId']);
        $newStatus = sanitizeString($data['status']);

        // Actualizar estado
        $result = $orderManager->updateOrderStatus($orderId, $newStatus);

        if ($result) {
            jsonResponse([
                'success' => true,
                'message' => 'Estado actualizado correctamente'
            ]);
        } else {
            jsonResponse([
                'success' => false,
                'error' => 'No se pudo actualizar el estado'
            ], 500);
        }

    } catch (Exception $e) {
        logMessage("Error al actualizar estado: " . $e->getMessage(), 'ERROR');
        jsonResponse([
            'success' => false,
            'error' => 'Error al actualizar estado'
        ], 500);
    }
}

// ============================================================================
// EXPORTAR A CSV
// ============================================================================

elseif ($action === 'export' && isGetRequest()) {
    try {
        $format = isset($_GET['format']) ? $_GET['format'] : 'csv';

        if ($format !== 'csv') {
            jsonResponse([
                'success' => false,
                'error' => 'Formato no soportado. Solo CSV está disponible.'
            ], 400);
        }

        // Obtener filtros opcionales
        $filters = [];

        if (isset($_GET['status']) && $_GET['status'] !== '') {
            $filters['status'] = sanitizeString($_GET['status']);
        }

        if (isset($_GET['productId']) && $_GET['productId'] !== '') {
            $filters['productId'] = (int)$_GET['productId'];
        }

        // Generar CSV
        $csv = $orderManager->exportToCSV($filters);
        $filename = 'pedidos_' . date('Y-m-d_His') . '.csv';

        // Enviar headers para descarga
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');

        // Agregar BOM para Excel
        echo "\xEF\xBB\xBF";
        echo $csv;
        exit;

    } catch (Exception $e) {
        logMessage("Error al exportar CSV: " . $e->getMessage(), 'ERROR');
        jsonResponse([
            'success' => false,
            'error' => 'Error al exportar CSV'
        ], 500);
    }
}

// ============================================================================
// ACCIÓN NO RECONOCIDA
// ============================================================================

else {
    jsonResponse([
        'success' => false,
        'error' => 'Acción no reconocida o método incorrecto'
    ], 400);
}
