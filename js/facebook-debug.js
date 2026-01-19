/**
 * Facebook Conversions API - Debug Utilities
 *
 * Copia y pega en la consola (F12) para hacer debugging
 */

// Función para test rápido
window.testFacebookEvent = async function() {
    console.clear();
    console.log('%c=== FACEBOOK CONVERSIONS API TEST ===', 'font-size: 16px; font-weight: bold; color: #1877F2;');

    // Verificación 1: Módulo cargado
    console.log('\n1️⃣  Verificando módulo...');
    if (typeof sendFacebookPurchaseEvent === 'function') {
        console.log('   ✅ Función sendFacebookPurchaseEvent está disponible');
    } else {
        console.log('   ❌ Función sendFacebookPurchaseEvent NO está disponible');
        console.log('   → Recarga la página');
        return;
    }

    // Verificación 2: Credenciales
    console.log('\n2️⃣  Verificando credenciales...');
    try {
        if (FACEBOOK_PIXEL_ID && FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID_HERE') {
            console.log(`   ✅ Pixel ID: ${FACEBOOK_PIXEL_ID}`);
        } else {
            console.log('   ❌ Pixel ID no está configurado');
            return;
        }

        if (FACEBOOK_ACCESS_TOKEN && FACEBOOK_ACCESS_TOKEN !== 'YOUR_ACCESS_TOKEN_HERE') {
            console.log(`   ✅ Access Token: ${FACEBOOK_ACCESS_TOKEN.substring(0, 20)}...`);
        } else {
            console.log('   ❌ Access Token no está configurado');
            return;
        }
    } catch (e) {
        console.log('   ❌ Error al acceder a credenciales:', e.message);
        return;
    }

    // Verificación 3: SubtleCrypto
    console.log('\n3️⃣  Verificando SubtleCrypto (para SHA256)...');
    try {
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode('test'));
        console.log('   ✅ SubtleCrypto disponible');
    } catch (e) {
        console.log('   ❌ SubtleCrypto no disponible:', e.message);
        return;
    }

    // Test 4: Envío de evento de prueba
    console.log('\n4️⃣  Enviando evento de prueba...');
    const result = await sendFacebookPurchaseEvent({
        phone: '3001234567',
        packageId: 1,
        email: 'test@ejemplo.com',
        firstName: 'Test'
    });

    console.log(`\n5️⃣  Resultado: ${result ? '✅ ENVIADO' : '❌ ERROR'}`);

    if (result) {
        console.log('\n✅ EVENTO ENVIADO CORRECTAMENTE');
        console.log('📱 Próximo paso: Ve a Facebook Events Manager y busca el evento "Purchase"');
        console.log('🔗 https://business.facebook.com/latest/events_manager');
    } else {
        console.log('\n❌ ERROR AL ENVIAR');
        console.log('📋 Revisa los logs arriba para más información');
    }

    console.log('\n=== FIN DEL TEST ===\n');
};

// Función para ver el payload que se enviaría
window.showEventPayload = function() {
    console.log('%c=== PAYLOAD DEL EVENTO ===', 'font-size: 14px; font-weight: bold; color: #1877F2;');

    const eventPayload = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
            ph: ['[SHA256 DEL TELEFONO]'],
            em: ['[SHA256 DEL EMAIL]'],
            fn: ['[SHA256 DEL NOMBRE]']
        },
        custom_data: {
            currency: 'COP',
            value: '90000',
            content_name: 'Kit Detox 4 Días',
            content_ids: ['1'],
            num_items: 1
        }
    };

    console.table(eventPayload);
    console.log('\nPayload en JSON:');
    console.log(JSON.stringify({ data: [eventPayload] }, null, 2));
};

// Función para monitorear todas las requests a Facebook
window.monitorFacebookRequests = function() {
    console.log('%c=== MONITOREANDO REQUESTS A FACEBOOK ===', 'font-size: 14px; font-weight: bold; color: #1877F2;');

    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [resource, config] = args;

        if (resource.includes('graph.facebook.com')) {
            console.log('%c📤 REQUEST A FACEBOOK DETECTADO', 'color: #FF9500; font-weight: bold;');
            console.log('URL:', resource.split('?')[0] + '?[PARAMS]');
            console.log('Método:', config?.method || 'GET');
            console.log('Body:', config?.body ? JSON.parse(config.body) : 'Sin body');
        }

        return originalFetch.apply(this, args).then(response => {
            if (resource.includes('graph.facebook.com')) {
                const status = response.status;
                const statusOk = response.ok;

                console.log(`%c📥 RESPUESTA DE FACEBOOK`, `color: ${statusOk ? '#10B981' : '#EF4444'}; font-weight: bold;`);
                console.log('Status:', status, statusOk ? '✅' : '❌');

                return response.clone().json().then(data => {
                    console.log('Respuesta:', data);
                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        headers: response.headers
                    });
                });
            }
            return response;
        });
    };

    console.log('✅ Monitoreo activo. Ahora completa el formulario.');
    console.log('Ejecuta: stopMonitoringFacebookRequests() para detener');
};

// Función para detener monitoreo
window.stopMonitoringFacebookRequests = function() {
    location.reload();
};

// Función para revisar el estado actual
window.facebookStatus = function() {
    console.clear();
    console.log('%c=== FACEBOOK CONVERSIONS API - STATUS ===', 'font-size: 16px; font-weight: bold; color: #1877F2;');

    console.log('\n📋 Módulo:');
    console.log('  Cargado:', typeof sendFacebookPurchaseEvent === 'function' ? '✅' : '❌');

    console.log('\n🔐 Credenciales:');
    try {
        console.log('  Pixel ID:', FACEBOOK_PIXEL_ID || '❌ No definido');
        console.log('  Token:', FACEBOOK_ACCESS_TOKEN ? `${FACEBOOK_ACCESS_TOKEN.substring(0, 30)}...` : '❌ No definido');
        console.log('  API Version:', FACEBOOK_API_VERSION || 'v19.0');
    } catch (e) {
        console.log('  ❌ Error al acceder a credenciales');
    }

    console.log('\n⚙️  Navegador:');
    console.log('  SubtleCrypto:', !!crypto.subtle ? '✅' : '❌');
    console.log('  TextEncoder:', typeof TextEncoder !== 'undefined' ? '✅' : '❌');
    console.log('  Fetch API:', typeof fetch !== 'undefined' ? '✅' : '❌');

    console.log('\n🧪 Comandos disponibles:');
    console.log('  testFacebookEvent()              - Test completo');
    console.log('  showEventPayload()               - Ver estructura del evento');
    console.log('  monitorFacebookRequests()        - Monitorear requests');
    console.log('  facebookStatus()                 - Ver este status');
};

// Cargar automáticamente status al cargar el script
console.log('%c💙 Facebook Debug Utilities Cargado', 'font-size: 12px; color: #1877F2; font-weight: bold;');
console.log('Escribe: facebookStatus() para ver información');
console.log('Escribe: testFacebookEvent() para hacer una prueba');
