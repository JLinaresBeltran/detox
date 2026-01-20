<?php
/**
 * API Endpoint - Send Facebook Event
 *
 * Envía eventos a Facebook Conversions API desde el backend de forma segura.
 * El access token se mantiene en el servidor (.env), nunca se expone al frontend.
 *
 * Flujo:
 * 1. Validar método POST y Content-Type JSON
 * 2. Validar que el token esté configurado
 * 3. Validar el payload del evento
 * 4. Enviar a Facebook Graph API
 * 5. Retornar respuesta JSON
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
// VALIDAR CONFIGURACIÓN DE FACEBOOK
// ============================================================================

$pixelId = FACEBOOK_PIXEL_ID;
$accessToken = FACEBOOK_ACCESS_TOKEN;
$apiVersion = FACEBOOK_API_VERSION;

if (!$pixelId || !$accessToken) {
    logMessage('Facebook no configurado: Pixel ID o Access Token faltante', 'ERROR');
    jsonResponse([
        'success' => false,
        'error' => 'Configuración de Facebook no disponible'
    ], 500);
}

logMessage("Facebook configurado: Pixel={$pixelId}, API Version={$apiVersion}", 'DEBUG');

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
// VALIDAR ESTRUCTURA DEL EVENTO
// ============================================================================

if (!isset($payload['eventName'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Campo requerido: eventName'
    ], 400);
}

$eventName = sanitizeString($payload['eventName']);

// Validar que sea un evento permitido
$allowedEvents = ['Purchase', 'AddToCart', 'ViewContent', 'InitiateCheckout', 'CompleteRegistration', 'Lead'];
if (!in_array($eventName, $allowedEvents)) {
    logMessage("Evento no permitido: {$eventName}", 'WARNING');
    jsonResponse([
        'success' => false,
        'error' => 'Tipo de evento no permitido'
    ], 400);
}

// ============================================================================
// VALIDAR DATOS DEL USUARIO
// ============================================================================

if (!isset($payload['userData']) || !is_array($payload['userData'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Campo requerido: userData'
    ], 400);
}

$userData = $payload['userData'];

// Al menos uno de estos campos debe estar presente
if (empty($userData['ph']) && empty($userData['em']) && empty($userData['fn'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Se requiere al menos uno de: teléfono, email o nombre'
    ], 400);
}

// ============================================================================
// VALIDAR DATOS PERSONALIZADOS DEL EVENTO
// ============================================================================

$customData = isset($payload['customData']) ? $payload['customData'] : [];

// Validar campos obligatorios según tipo de evento
if ($eventName === 'Purchase') {
    if (!isset($customData['value']) || !isset($customData['currency'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Para evento Purchase se requiere: value y currency'
        ], 400);
    }

    // Validar que el valor sea numérico
    if (!is_numeric($customData['value']) || (float)$customData['value'] < 0) {
        jsonResponse([
            'success' => false,
            'error' => 'Valor inválido'
        ], 400);
    }
}

// ============================================================================
// CONSTRUIR EVENTO PARA FACEBOOK
// ============================================================================

$eventData = [
    'event_name' => $eventName,
    'event_time' => isset($payload['eventTime']) ? (int)$payload['eventTime'] : time(),
    'action_source' => 'website',
    'user_data' => $userData,
];

// Agregar custom_data si está presente
if (!empty($customData)) {
    $eventData['custom_data'] = $customData;
}

// Agregar test_event_code si está configurado (útil para debugging)
if (isset($payload['testEventCode'])) {
    $eventData['test_event_code'] = sanitizeString($payload['testEventCode']);
}

logMessage('Evento a enviar a Facebook: ' . json_encode($eventData), 'DEBUG');

// ============================================================================
// ENVIAR A FACEBOOK GRAPH API
// ============================================================================

$url = "https://graph.facebook.com/{$apiVersion}/{$pixelId}/events?access_token={$accessToken}";

$postData = json_encode([
    'data' => [$eventData]
]);

// Usar cURL para enviar a Facebook (más seguro que file_get_contents)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($postData)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    logMessage("Error cURL al enviar a Facebook: {$curlError}", 'ERROR');
    jsonResponse([
        'success' => false,
        'error' => 'Error al conectar con Facebook'
    ], 500);
}

// ============================================================================
// PROCESAR RESPUESTA DE FACEBOOK
// ============================================================================

$facebookResponse = json_decode($response, true);

logMessage("Respuesta de Facebook (HTTP {$httpCode}): " . $response, 'DEBUG');

if ($httpCode === 200 || $httpCode === 201) {
    logMessage("Evento {$eventName} enviado exitosamente a Facebook", 'INFO');

    jsonResponse([
        'success' => true,
        'message' => "Evento {$eventName} registrado correctamente",
        'facebookEventId' => $facebookResponse['events'][0]['event_id'] ?? null
    ], 200);
} else {
    $errorMessage = $facebookResponse['error']['message'] ?? 'Error desconocido';
    $errorCode = $facebookResponse['error']['code'] ?? $httpCode;

    logMessage(
        "Error al enviar evento a Facebook: [{$errorCode}] {$errorMessage}",
        'ERROR'
    );

    jsonResponse([
        'success' => false,
        'error' => "Facebook API Error: {$errorMessage}",
        'facebookErrorCode' => $errorCode
    ], $httpCode);
}
