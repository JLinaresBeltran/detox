<?php
/**
 * API Endpoint - Submit Order
 *
 * Maneja el envío de pedidos desde el frontend.
 *
 * Flujo completo:
 * 1. Validar método POST y Content-Type JSON
 * 2. Decodificar y sanitizar payload
 * 3. Validar todos los campos
 * 4. Verificar rate limiting por IP
 * 5. Capturar metadata (IP, User-Agent)
 * 6. Guardar pedido en JSON
 * 7. Enviar email al cliente
 * 8. Enviar email al admin
 * 9. Enviar backup del JSON por email
 * 10. Retornar respuesta JSON
 */

define('APP_ACCESS', true);
require_once __DIR__ . '/config.php';

// ============================================================================
// VALIDACIÓN INICIAL
// ============================================================================

// Solo aceptar POST
if (!isPostRequest()) {
    jsonResponse([
        'success' => false,
        'error' => 'Método no permitido'
    ], 405);
}

// Verificar que sea AJAX
if (!isAjaxRequest()) {
    jsonResponse([
        'success' => false,
        'error' => 'Solo se aceptan peticiones AJAX'
    ], 400);
}

// Verificar Content-Type
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
if (strpos($contentType, 'application/json') === false) {
    jsonResponse([
        'success' => false,
        'error' => 'Content-Type debe ser application/json'
    ], 400);
}

// ============================================================================
// DECODIFICAR PAYLOAD
// ============================================================================

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    logMessage('Error al decodificar JSON: ' . json_last_error_msg(), 'ERROR');
    jsonResponse([
        'success' => false,
        'error' => 'JSON inválido'
    ], 400);
}

// ============================================================================
// VALIDAR ESTRUCTURA DEL PAYLOAD
// ============================================================================

if (!isset($payload['product']) || !isset($payload['customer'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Datos incompletos'
    ], 400);
}

$product = $payload['product'];
$customer = $payload['customer'];

// ============================================================================
// VALIDAR DATOS DEL PRODUCTO
// ============================================================================

$requiredProductFields = ['id', 'name', 'quantity', 'price', 'shipping', 'total'];
foreach ($requiredProductFields as $field) {
    if (!isset($product[$field])) {
        jsonResponse([
            'success' => false,
            'error' => "Campo requerido faltante: product.{$field}"
        ], 400);
    }
}

// Validar que el producto sea válido (1 o 2)
if (!in_array($product['id'], [1, 2])) {
    logMessage('Producto inválido recibido: ' . $product['id'], 'WARNING');
    jsonResponse([
        'success' => false,
        'error' => 'Producto inválido'
    ], 400);
}

// Validar que los valores numéricos sean correctos
if (!is_numeric($product['quantity']) || $product['quantity'] < 1) {
    jsonResponse([
        'success' => false,
        'error' => 'Cantidad inválida'
    ], 400);
}

if (!is_numeric($product['price']) || $product['price'] < 0) {
    jsonResponse([
        'success' => false,
        'error' => 'Precio inválido'
    ], 400);
}

if (!is_numeric($product['shipping']) || $product['shipping'] < 0) {
    jsonResponse([
        'success' => false,
        'error' => 'Costo de envío inválido'
    ], 400);
}

if (!is_numeric($product['total']) || $product['total'] < 0) {
    jsonResponse([
        'success' => false,
        'error' => 'Total inválido'
    ], 400);
}

// ============================================================================
// VALIDAR DATOS DEL CLIENTE
// ============================================================================

$requiredCustomerFields = ['nombre', 'telefono', 'correo', 'departamento', 'ciudad', 'direccion'];
foreach ($requiredCustomerFields as $field) {
    if (!isset($customer[$field]) || trim($customer[$field]) === '') {
        jsonResponse([
            'success' => false,
            'error' => "Campo requerido faltante: {$field}"
        ], 400);
    }
}

// Sanitizar datos del cliente
$customer['nombre'] = sanitizeString($customer['nombre']);
$customer['telefono'] = sanitizeString($customer['telefono']);
$customer['correo'] = sanitizeString($customer['correo']);
$customer['departamento'] = sanitizeString($customer['departamento']);
$customer['ciudad'] = sanitizeString($customer['ciudad']);
$customer['direccion'] = sanitizeString($customer['direccion']);
$customer['observaciones'] = isset($customer['observaciones']) ? sanitizeString($customer['observaciones']) : '';

// Validar nombre
if (!isValidTextFormat($customer['nombre'], 100)) {
    jsonResponse([
        'success' => false,
        'error' => 'Nombre contiene caracteres inválidos o es demasiado largo'
    ], 400);
}

// Validar teléfono
if (!validatePhone($customer['telefono'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Teléfono inválido (debe ser un número de 10 dígitos que comience con 3)'
    ], 400);
}

// Validar email
if (!validateEmail($customer['correo'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Email inválido'
    ], 400);
}

// Validar departamento
if (!isValidTextFormat($customer['departamento'], 100)) {
    jsonResponse([
        'success' => false,
        'error' => 'Departamento inválido'
    ], 400);
}

// Validar ciudad
if (!isValidTextFormat($customer['ciudad'], 100)) {
    jsonResponse([
        'success' => false,
        'error' => 'Ciudad inválida'
    ], 400);
}

// Validar dirección
if (!validateAddress($customer['direccion'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Dirección inválida (mínimo 10 caracteres)'
    ], 400);
}

// Validar observaciones (opcional)
if (strlen($customer['observaciones']) > 500) {
    jsonResponse([
        'success' => false,
        'error' => 'Observaciones demasiado largas (máximo 500 caracteres)'
    ], 400);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

$clientIP = getClientIP();

if (!checkRateLimit($clientIP)) {
    logMessage("Rate limit excedido para IP: {$clientIP}", 'WARNING');
    jsonResponse([
        'success' => false,
        'error' => 'Has excedido el límite de pedidos por hora. Por favor, intenta más tarde.'
    ], 429);
}

// ============================================================================
// PREPARAR DATOS DEL PEDIDO
// ============================================================================

$orderData = [
    'product' => [
        'id' => (int)$product['id'],
        'name' => sanitizeString($product['name']),
        'quantity' => (int)$product['quantity'],
        'price' => (int)$product['price'],
        'shipping' => (int)$product['shipping'],
        'total' => (int)$product['total']
    ],
    'customer' => $customer,
    'metadata' => [
        'ip' => $clientIP,
        'userAgent' => getUserAgent()
    ]
];

// ============================================================================
// GUARDAR PEDIDO
// ============================================================================

try {
    $orderManager = new OrderManager();
    $order = $orderManager->addOrder($orderData);

    logMessage("Pedido creado exitosamente: {$order['id']}", 'INFO');

} catch (Exception $e) {
    logMessage("Error al guardar pedido: " . $e->getMessage(), 'ERROR');
    jsonResponse([
        'success' => false,
        'error' => 'Error al guardar el pedido. Por favor, intenta nuevamente.'
    ], 500);
}

// ============================================================================
// ENVIAR EMAILS EN BACKGROUND (Sin bloquear respuesta)
// ============================================================================

// IMPORTANTE: Registrar shutdown function ANTES de responder al cliente
// Se ejecuta DESPUÉS de que jsonResponse() llame a exit()
// No bloquea la experiencia del usuario

register_shutdown_function(function() use ($order, $orderManager, $customer, $emailService) {
    try {
        // Inicializar servicio de email si no existe
        if (!isset($emailService)) {
            $emailService = new EmailService();
        }

        // Enviar email al cliente
        try {
            $customerEmailSent = $emailService->sendCustomerEmail($order);
            if (!$customerEmailSent) {
                logMessage("No se pudo enviar email al cliente: {$customer['correo']}", 'WARNING');
            }
        } catch (Exception $e) {
            logMessage("Error al enviar email al cliente: " . $e->getMessage(), 'WARNING');
        }

        // Enviar email al admin
        try {
            $adminEmailSent = $emailService->sendAdminEmail($order);
            if (!$adminEmailSent) {
                logMessage("No se pudo enviar email al admin", 'WARNING');
            }
        } catch (Exception $e) {
            logMessage("Error al enviar email al admin: " . $e->getMessage(), 'WARNING');
        }

        // Enviar backup
        try {
            $orderManager->backupToEmail($emailService);
        } catch (Exception $e) {
            logMessage("Error al enviar backup: " . $e->getMessage(), 'WARNING');
        }

        logMessage("Emails procesados en background para pedido: {$order['id']}", 'INFO');
    } catch (Exception $e) {
        logMessage("Error al procesar emails en background: " . $e->getMessage(), 'ERROR');
    }
});

// ============================================================================
// RESPUESTA INMEDIATA (SIN ESPERAR EMAILS)
// ============================================================================

// Responder INMEDIATAMENTE al frontend con el pedido guardado
// Los emails se enviarán en background (shutdown function registrada arriba)
jsonResponse([
    'success' => true,
    'orderId' => $order['id'],
    'orderNumber' => $order['orderNumber'],
    'timestamp' => $order['timestamp'],
    'message' => '¡Pedido recibido correctamente! Pronto nos pondremos en contacto contigo.'
], 200);
