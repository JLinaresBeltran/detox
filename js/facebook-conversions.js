/**
 * Facebook Conversions API Integration (SEGURO - Backend)
 *
 * Envía eventos a Facebook Conversions API de forma segura a través del backend.
 * El access token se mantiene privado en el servidor (.env).
 *
 * CAMBIOS DE SEGURIDAD:
 * - El access token ya NO está en el frontend
 * - Las llamadas a Facebook se hacen desde PHP (api/send-facebook-event.php)
 * - El frontend solo prepara los datos del evento y los envía al backend
 */

(function () {
    'use strict';

    // ============================================================
    // CONFIGURACIÓN
    // ============================================================
    // El Pixel ID se mantiene aquí (es público)
    // El Access Token está SOLO en el servidor (.env)
    const FACEBOOK_PIXEL_ID = '1142678136915324';

    // Configuración de productos
    const PRODUCTS = {
        1: {
            name: 'Kit Detox 4 Días',
            price: 90000,
            contentId: '1',
            contentType: 'product'
        },
        2: {
            name: 'Plan Dúo: Reinicio Total',
            price: 160000,
            contentId: '2',
            contentType: 'product'
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
     * Genera hash SHA256 usando SubtleCrypto
     * Se envía al backend, que también lo valida
     *
     * @param {string} value - Valor a hashear (teléfono, email, nombre)
     * @returns {Promise<string>} - Hash SHA256 en hexadecimal
     */
    async function sha256Hash(value) {
        try {
            // Limpiar: solo números/caracteres válidos
            let cleanValue = value.toString().toLowerCase().trim();

            // Para teléfono: solo números
            if (cleanValue.length <= 15 && /^\d+$/.test(cleanValue)) {
                cleanValue = cleanValue.replace(/\D/g, '');
            }

            if (!cleanValue || cleanValue.length === 0) {
                logWarning('Valor vacío, no se puede crear hash');
                return null;
            }

            // Calcular hash SHA256
            const encoder = new TextEncoder();
            const data = encoder.encode(cleanValue);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);

            // Convertir a hexadecimal
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            logDebug('Hash SHA256 generado', hashHex.substring(0, 16) + '...');
            return hashHex;
        } catch (error) {
            logError('Error al generar hash SHA256', error.message);
            return null;
        }
    }

    /**
     * Obtiene timestamp Unix actual
     */
    function getUnixTimestamp() {
        return Math.floor(Date.now() / 1000);
    }

    // ============================================================
    // FUNCIÓN PRINCIPAL: ENVIAR EVENTO A FACEBOOK (VÍA BACKEND)
    // ============================================================

    /**
     * Envía evento a Facebook Conversions API a través del backend
     *
     * @param {Object} options - Opciones del evento
     * @param {string} options.eventName - Nombre del evento (Purchase, AddToCart, etc)
     * @param {string} [options.phone] - Teléfono del usuario
     * @param {string} [options.email] - Email del usuario
     * @param {string} [options.firstName] - Nombre del usuario
     * @param {string} [options.lastName] - Apellido del usuario
     * @param {number} [options.packageId] - ID del paquete (1 o 2)
     * @param {number} [options.value] - Valor del evento (para Purchase)
     * @param {string} [options.currency] - Moneda (COP, USD, etc)
     * @param {string} [options.contentName] - Nombre del contenido
     * @param {string} [options.contentType] - Tipo de contenido (product, etc)
     * @returns {Promise<boolean>} - true si se envió, false si hubo error
     */
    window.sendFacebookEvent = async function(options = {}) {
        try {
            logDebug('=== INICIANDO ENVÍO DE EVENTO A FACEBOOK ===');
            logDebug('Evento:', options.eventName);

            // Validar evento
            if (!options.eventName) {
                logError('eventName es requerido');
                return false;
            }

            // Validar que al menos haya datos de usuario
            if (!options.phone && !options.email && !options.firstName) {
                logError('Se requiere al menos uno: teléfono, email o nombre');
                return false;
            }

            // Construir datos del usuario (con hashes)
            const userData = {};

            if (options.phone) {
                const phoneHash = await sha256Hash(options.phone);
                if (phoneHash) {
                    userData.ph = [phoneHash];
                }
            }

            if (options.email) {
                const emailHash = await sha256Hash(options.email);
                if (emailHash) {
                    userData.em = [emailHash];
                }
            }

            if (options.firstName || options.lastName) {
                const fullName = `${options.firstName || ''} ${options.lastName || ''}`.trim();
                if (fullName) {
                    const nameHash = await sha256Hash(fullName);
                    if (nameHash) {
                        userData.fn = [nameHash];
                    }
                }
            }

            logDebug('User data hasheado', userData);

            // Construir custom_data según tipo de evento
            const customData = {};

            if (options.eventName === 'Purchase') {
                if (!options.value || !options.currency) {
                    logError('Para Purchase se requiere: value y currency');
                    return false;
                }
                customData.value = String(options.value);
                customData.currency = options.currency;
                customData.content_name = options.contentName || 'Purchase';
                if (options.packageId) {
                    customData.content_ids = [String(options.packageId)];
                }
                customData.num_items = 1;
            } else if (options.eventName === 'AddToCart') {
                if (options.value) {
                    customData.value = String(options.value);
                }
                if (options.currency) {
                    customData.currency = options.currency;
                }
                customData.content_name = options.contentName || 'Product Added to Cart';
                customData.content_type = options.contentType || 'product';
                if (options.packageId) {
                    customData.content_ids = [String(options.packageId)];
                }
                customData.num_items = 1;
            } else if (options.eventName === 'ViewContent') {
                customData.content_name = options.contentName || 'Content Viewed';
                customData.content_type = options.contentType || 'product';
                if (options.packageId) {
                    customData.content_ids = [String(options.packageId)];
                }
            }

            // Construir payload para enviar al backend
            const payload = {
                eventName: options.eventName,
                eventTime: options.eventTime || getUnixTimestamp(),
                userData: userData,
                customData: customData
            };

            logDebug('Payload a enviar al backend:', JSON.stringify(payload, null, 2));

            // Enviar al backend
            logDebug('Enviando a /api/send-facebook-event.php...');

            const response = await fetch('/api/send-facebook-event.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload)
            });

            logDebug('Respuesta recibida', `Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json();
                logError(`Error HTTP ${response.status}`, errorData);
                return false;
            }

            const result = await response.json();

            if (result.success) {
                logSuccess(`Evento ${options.eventName} enviado correctamente`, result);
                logDebug('=== EVENTO ENVIADO EXITOSAMENTE ===');
                return true;
            } else {
                logError('Error en respuesta del backend', result);
                return false;
            }

        } catch (error) {
            logError('Error inesperado', {
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    };

    // ============================================================
    // FUNCIÓN ESPECIAL PARA PURCHASE (COMPATIBILIDAD)
    // ============================================================

    /**
     * Envía evento Purchase (función especial para compatibilidad con código existente)
     */
    window.sendFacebookPurchaseEvent = async function(options = {}) {
        return window.sendFacebookEvent({
            eventName: 'Purchase',
            phone: options.phone,
            email: options.email,
            firstName: options.firstName,
            lastName: options.lastName,
            packageId: options.packageId,
            value: PRODUCTS[options.packageId]?.price || options.value,
            currency: 'COP',
            contentName: PRODUCTS[options.packageId]?.name || options.contentName,
            ...options
        });
    };

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================

    logDebug('=== FACEBOOK CONVERSIONS API (SEGURO) ===');
    logDebug('Módulo cargado - Versión con backend seguro');
    logDebug('Configuración:', {
        pixelId: FACEBOOK_PIXEL_ID,
        hasProducts: Object.keys(PRODUCTS).length,
        apiEndpoint: '/api/send-facebook-event.php'
    });
    logWarning('NOTA', 'Access token NO está en el frontend (almacenado en servidor)');

})();
