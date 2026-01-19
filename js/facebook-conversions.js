/**
 * Facebook Conversions API Integration
 *
 * Envía eventos de Purchase a Facebook Conversions API desde el frontend
 * Se integra con el flujo de compra de Detox-2
 */

(function () {
    'use strict';

    // ============================================================
    // CONFIGURACIÓN
    // ============================================================
    // Reemplaza estos valores con tus credenciales de Facebook
    const FACEBOOK_PIXEL_ID = '1142678136915324';
    const FACEBOOK_ACCESS_TOKEN = 'EAASfnFwPqrIBQTnSNKiZB7XeyetERJhoclcNN8vvIjnp3AZBrOdY3n2ZBMvNNvzibsdPMK6EoP2T2WkpHevQaHkEjnBtuZAUMK3tlOrSc8kONVv5GVLxdHewzuhw2vcAMqlpyulaiIMJZC45MOxIJ6ksq8vOod98MBVr4EeTFUT7RwlZBaPg047IgqLBg5ZC9V9JAZDZD';
    const FACEBOOK_API_VERSION = 'v19.0';

    // Configuración de productos
    const PRODUCTS = {
        1: {
            name: 'Kit Detox 4 Días',
            price: 90000,
            contentId: '1'
        },
        2: {
            name: 'Plan Dúo: Reinicio Total',
            price: 160000,
            contentId: '2'
        }
    };

    // ============================================================
    // FUNCIONES DE LOGGING CON COLOR
    // ============================================================

    function logDebug(title, data) {
        console.log(`%c[FB-DEBUG] ${title}`, 'color: #6B7280; font-weight: bold;', data || '');
    }

    function logSuccess(title, data) {
        console.log(`%c✅ ${title}`, 'color: #10B981; font-weight: bold;', data || '');
    }

    function logError(title, data) {
        console.error(`%c❌ ${title}`, 'color: #EF4444; font-weight: bold;', data || '');
    }

    function logWarning(title, data) {
        console.warn(`%c⚠️ ${title}`, 'color: #F59E0B; font-weight: bold;', data || '');
    }

    // ============================================================
    // FUNCIONES AUXILIARES
    // ============================================================

    /**
     * Convierte un teléfono a hash SHA256 usando SubtleCrypto
     * El teléfono debe estar limpio (solo números)
     *
     * @param {string} phone - Teléfono sin formato (ej: "3001234567")
     * @returns {Promise<string>} - Hash SHA256 en hexadecimal
     */
    async function sha256Hash(phone) {
        try {
            // Normalizar: solo números, sin espacios
            const cleanPhone = phone.replace(/\D/g, '');

            if (!cleanPhone || cleanPhone.length === 0) {
                logWarning('Teléfono vacío, no se puede crear hash');
                return null;
            }

            // Convertir a Uint8Array
            const encoder = new TextEncoder();
            const data = encoder.encode(cleanPhone);

            // Calcular hash SHA256 usando SubtleCrypto API
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);

            // Convertir a hexadecimal
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            logDebug('Hash SHA256 generado', `Entrada: ${cleanPhone}, Hash: ${hashHex.substring(0, 16)}...`);
            return hashHex;
        } catch (error) {
            logError('Error al generar hash SHA256', error.message);
            return null;
        }
    }

    /**
     * Obtiene el timestamp Unix actual
     * @returns {number} - Timestamp Unix en segundos
     */
    function getUnixTimestamp() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Valida que las credenciales estén configuradas
     * @returns {boolean}
     */
    function validateCredentials() {
        if (FACEBOOK_PIXEL_ID === 'YOUR_PIXEL_ID_HERE' ||
            FACEBOOK_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
            logWarning('Credenciales de Facebook no configuradas');
            return false;
        }
        return true;
    }

    // ============================================================
    // FUNCIÓN PRINCIPAL: ENVIAR EVENTO DE PURCHASE
    // ============================================================

    /**
     * Envía evento de Purchase a Facebook Conversions API
     *
     * @param {Object} options - Opciones del evento
     * @param {string} options.phone - Teléfono (será hasheado)
     * @param {number} options.packageId - ID del paquete (1 o 2)
     * @param {string} [options.email] - Email del usuario (opcional)
     * @param {string} [options.firstName] - Nombre del usuario (opcional)
     * @param {string} [options.lastName] - Apellido del usuario (opcional)
     * @returns {Promise<boolean>} - true si se envió correctamente, false si hubo error
     */
    window.sendFacebookPurchaseEvent = async function(options = {}) {
        try {
            logDebug('=== INICIANDO ENVÍO DE EVENTO PURCHASE ===');

            // Validar credenciales
            if (!validateCredentials()) {
                logWarning('No se envió evento a Facebook: credenciales no configuradas');
                return false;
            }

            logDebug('Credenciales configuradas', `Pixel: ${FACEBOOK_PIXEL_ID}`);

            // Validar opciones
            if (!options.phone || !options.packageId) {
                logError('Teléfono y packageId son requeridos', { phone: options.phone, packageId: options.packageId });
                return false;
            }

            logDebug('Opciones validadas', { phone: options.phone, packageId: options.packageId });

            // Obtener información del producto
            const product = PRODUCTS[options.packageId];
            if (!product) {
                logError('Paquete inválido', options.packageId);
                return false;
            }

            logDebug('Producto encontrado', product);

            // Generar hash SHA256 del teléfono
            const phoneHash = await sha256Hash(options.phone);
            if (!phoneHash) {
                logError('No se pudo generar hash del teléfono');
                return false;
            }

            // Construir payload del evento
            const eventData = {
                event_name: 'Purchase',
                event_time: getUnixTimestamp(),
                action_source: 'website',
                user_data: {
                    ph: [phoneHash] // Array con hash SHA256 del teléfono
                },
                custom_data: {
                    currency: 'COP',
                    value: String(product.price), // Valor debe ser string
                    content_name: product.name,
                    content_ids: [product.contentId],
                    num_items: 1
                }
            };

            // Agregar datos opcionales del usuario si están disponibles
            if (options.email) {
                const emailHash = await sha256Hash(options.email);
                if (emailHash) {
                    eventData.user_data.em = [emailHash];
                }
            }

            if (options.firstName || options.lastName) {
                const fullName = `${options.firstName || ''} ${options.lastName || ''}`.trim();
                if (fullName) {
                    const nameHash = await sha256Hash(fullName);
                    if (nameHash) {
                        eventData.user_data.fn = [nameHash];
                    }
                }
            }

            logDebug('Payload del evento construido', JSON.stringify(eventData, null, 2));

            // Construir URL de Graph API
            const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${FACEBOOK_PIXEL_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}`;

            logDebug('URL del endpoint', `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${FACEBOOK_PIXEL_ID}/events?access_token=[TOKEN_HIDDEN]`);

            // Enviar evento a Facebook
            logDebug('Enviando request POST a Facebook...');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: [eventData]
                })
            });

            logDebug('Respuesta recibida', `Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json();
                logError(`Error HTTP ${response.status}`, errorData);
                return false;
            }

            const result = await response.json();
            logSuccess('Evento Purchase enviado correctamente a Facebook', result);
            logDebug('=== EVENTO ENVIADO EXITOSAMENTE ===');
            return true;

        } catch (error) {
            logError('Error inesperado al enviar evento a Facebook', {
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    };

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================

    // Mostrar información de configuración al cargar
    logDebug('=== FACEBOOK CONVERSIONS API ===');
    logDebug('Módulo cargado');
    logDebug('Credenciales:', {
        pixelConfigured: FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID_HERE',
        tokenConfigured: FACEBOOK_ACCESS_TOKEN !== 'YOUR_ACCESS_TOKEN_HERE',
        apiVersion: FACEBOOK_API_VERSION
    });

})();
