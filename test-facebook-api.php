<?php
/**
 * Script para testear la API de Facebook Conversions
 */

define('APP_ACCESS', true);
require 'api/config.php';

echo "========================================\n";
echo "   TEST FACEBOOK CONVERSIONS API\n";
echo "========================================\n\n";

// Verificar configuración
echo "1️⃣ Verificando configuración...\n";
echo "Pixel ID: " . FACEBOOK_PIXEL_ID . "\n";
echo "API Version: " . FACEBOOK_API_VERSION . "\n";
echo "Token: " . (strlen(FACEBOOK_ACCESS_TOKEN) > 0 ? "Configurado ✅" : "NO ❌") . "\n";
echo "Token Length: " . strlen(FACEBOOK_ACCESS_TOKEN) . " caracteres\n\n";

// Eventos de prueba
$testEvents = [
    [
        'name' => 'ViewContent',
        'payload' => [
            'eventName' => 'ViewContent',
            'userData' => ['ph' => ['3001234567']],
            'customData' => ['content_name' => 'Kit Detox 4 Días', 'content_type' => 'product']
        ]
    ],
    [
        'name' => 'AddToCart',
        'payload' => [
            'eventName' => 'AddToCart',
            'userData' => ['ph' => ['3001234567'], 'em' => ['test@example.com']],
            'customData' => ['value' => '90000', 'currency' => 'COP', 'content_name' => 'Kit Detox']
        ]
    ],
    [
        'name' => 'Purchase',
        'payload' => [
            'eventName' => 'Purchase',
            'userData' => ['ph' => ['3001234567'], 'em' => ['test@example.com']],
            'customData' => ['value' => '110000', 'currency' => 'COP', 'content_name' => 'Kit Detox']
        ]
    ]
];

$url = "https://graph.facebook.com/" . FACEBOOK_API_VERSION . "/" . FACEBOOK_PIXEL_ID . "/events?access_token=" . FACEBOOK_ACCESS_TOKEN;

$successCount = 0;
$errorCount = 0;

foreach ($testEvents as $event) {
    echo "2️⃣ Enviando evento: {$event['name']}\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['data' => [$event['payload']]]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    $data = json_decode($response, true);

    if ($curlError) {
        echo "   ❌ Error cURL: {$curlError}\n";
        $errorCount++;
    } elseif ($httpCode === 200) {
        echo "   ✅ {$event['name']} enviado correctamente\n";
        echo "   📊 Event ID: " . ($data['events'][0]['event_id'] ?? 'N/A') . "\n";
        $successCount++;
    } else {
        $errorMsg = $data['error']['message'] ?? 'Desconocido';
        $errorCode = $data['error']['code'] ?? $httpCode;
        echo "   ❌ Error HTTP {$errorCode}: {$errorMsg}\n";
        $errorCount++;
    }
    echo "\n";
}

echo "========================================\n";
echo "📊 RESUMEN DE TESTS\n";
echo "========================================\n";
echo "✅ Exitosos: {$successCount}\n";
echo "❌ Fallidos: {$errorCount}\n";
echo "========================================\n\n";

if ($successCount === 3) {
    echo "🎉 ¡EXCELENTE! Todos los eventos se enviaron correctamente.\n\n";
    echo "Ahora verifica en Events Manager:\n";
    echo "📱 https://business.facebook.com/events_manager\n";
    echo "   1. Selecciona tu Pixel (1142678136915324)\n";
    echo "   2. Ve a la pestaña 'Test Events' (Eventos de prueba)\n";
    echo "   3. Deberías ver los 3 eventos enviados\n";
} else {
    echo "⚠️ Hubo algunos errores. Revisa los mensajes arriba.\n";
}

echo "\n========================================\n";
?>
