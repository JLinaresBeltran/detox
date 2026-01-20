/**
 * DUAL FORM VALIDATION & SUBMISSION
 *
 * Características:
 * - Dos formularios independientes (Kit Individual y Pack Dúo)
 * - Scroll suave al formulario seleccionado
 * - Validación de campos obligatorios
 * - Formato de teléfono colombiano
 * - Envío a Forminit/Getform con datos formateados
 */

(function () {
    'use strict';

    // Configuración de paquetes
    const PACKAGES = {
        1: {
            quantity: 1,
            productPrice: 90000,
            shippingCost: 20000,
            total: 110000,
            shippingLabel: '$20.000',
            name: 'Kit Detox 4 Días'
        },
        2: {
            quantity: 2,
            productPrice: 160000,
            shippingCost: 0,
            total: 160000,
            shippingLabel: 'GRATIS',
            name: 'Plan Dúo: Reinicio Total (2 Kits)'
        }
    };

    // Formularios
    const formIndividual = document.getElementById('orderFormIndividual');
    const formDuo = document.getElementById('orderFormDuo');
    const formSectionIndividual = document.getElementById('formIndividual');
    const formSectionDuo = document.getElementById('formDuo');

    // Banderas para prevenir múltiples envíos
    let isSubmittingIndividual = false;
    let isSubmittingDuo = false;

    // Bandera para prevenir múltiples aperturas simultáneas
    let isOpeningModal = false;

    /**
     * Función de debounce para prevenir múltiples clics
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Sanitiza strings para prevenir inyección de HTML/XSS
     */
    function sanitizeString(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Valida que un string solo contenga caracteres seguros
     */
    function isValidTextFormat(str, maxLength = 100) {
        if (str.length > maxLength) return false;
        const safePattern = /^[a-zA-Záéíóúñ\d\s.,\-'()#/]+$/;
        return safePattern.test(str);
    }

    /**
     * Limpia un string de caracteres no numéricos
     */
    function cleanPhoneNumber(phone) {
        return phone.replace(/\D/g, '');
    }

    /**
     * Valida que el teléfono tenga formato colombiano (10 dígitos)
     */
    function validatePhone(phone) {
        if (!phone || phone.trim() === '') return false;
        const cleaned = cleanPhoneNumber(phone);
        return cleaned.length === 10 && /^3\d{9}$/.test(cleaned);
    }

    /**
     * Valida que el email tenga formato válido
     */
    function validateEmail(email) {
        if (!email || email.trim() === '') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim()) && email.length <= 100;
    }

    /**
     * Valida que un campo de texto no esté vacío
     */
    function validateRequired(value) {
        return value.trim().length > 0;
    }

    /**
     * Valida que la dirección tenga un mínimo de caracteres
     */
    function validateAddress(address) {
        return address.trim().length >= 10;
    }

    /**
     * Formatea un número como precio colombiano
     */
    function formatPrice(amount) {
        return `$${amount.toLocaleString('es-CO')}`;
    }

    /**
     * Muestra un error en un campo
     */
    function showError(input, message) {
        removeError(input);
        const errorElement = document.createElement('span');
        errorElement.className = 'form-error';
        errorElement.style.color = '#BE185D';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        errorElement.style.display = 'block';
        errorElement.textContent = message;
        input.style.borderColor = '#BE185D';
        input.parentElement.appendChild(errorElement);
    }

    /**
     * Remueve el error de un campo
     */
    function removeError(input) {
        const formGroup = input.parentElement;
        const errorElement = formGroup.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
        input.style.borderColor = 'rgba(46, 125, 50, 0.2)';
    }

    /**
     * Formatea el teléfono para mostrar
     */
    function formatPhoneDisplay(phone) {
        const cleaned = cleanPhoneNumber(phone);
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        return phone;
    }

    /**
     * Formatea el teléfono mientras se escribe
     */
    function formatPhoneInput(e) {
        const input = e.target;
        const cursorPosition = input.selectionStart;
        const oldValue = input.value;
        const cleaned = cleanPhoneNumber(input.value);
        const limited = cleaned.slice(0, 10);

        if (limited.length === 0) {
            input.value = '';
            return;
        }

        const digitsBeforeCursor = cleanPhoneNumber(oldValue.slice(0, cursorPosition)).length;

        let formatted = '';
        if (limited.length >= 6) {
            formatted = `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        } else if (limited.length >= 3) {
            formatted = `${limited.slice(0, 3)} ${limited.slice(3)}`;
        } else {
            formatted = limited;
        }

        input.value = formatted;

        let newCursorPosition = 0;
        let digitCount = 0;

        for (let i = 0; i < formatted.length; i++) {
            if (digitCount >= digitsBeforeCursor) break;
            newCursorPosition++;
            if (/\d/.test(formatted[i])) {
                digitCount++;
            }
        }

        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    /**
     * ABRIR MODAL SEGÚN PAQUETE SELECCIONADO
     */
    function showFormForPackage(packageId) {
        const packageNum = parseInt(packageId);
        const pkg = PACKAGES[packageNum];

        if (!pkg) {
            console.error('Paquete no encontrado:', packageId);
            return;
        }

        // 1. DESHABILITAR TODOS LOS BOTONES INMEDIATAMENTE
        const buttons = document.querySelectorAll('.pricing-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
        });

        // 2. ABRIR EL MODAL INMEDIATAMENTE (SIN ESPERAR A FACEBOOK)
        if (packageId === '1') {
            formSectionIndividual.classList.add('show');
            formSectionDuo.classList.remove('show');
            document.body.style.overflow = 'hidden';
        } else if (packageId === '2') {
            formSectionDuo.classList.add('show');
            formSectionIndividual.classList.remove('show');
            document.body.style.overflow = 'hidden';
        }

        // 3. ENVIAR EVENTO A FACEBOOK EN BACKGROUND (SIN BLOQUEAR)
        // Se envía DESPUÉS de abrir el modal, en background
        if (typeof window.sendFacebookEvent === 'function' && pkg) {
            setTimeout(() => {
                window.sendFacebookEvent({
                    eventName: 'AddToCart',
                    packageId: packageNum,
                    value: pkg.productPrice,
                    currency: 'COP',
                    contentName: pkg.name,
                    contentType: 'product'
                }).catch(error => {
                    console.warn('No se pudo enviar evento AddToCart a Facebook:', error);
                });
            }, 0); // setTimeout con 0 para enviar al final del event loop
        }

        // 4. REACTIVAR BOTONES después de un delay
        setTimeout(() => {
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '';
                btn.style.cursor = '';
            });
        }, 1000); // 1 segundo de bloqueo
    }

    /**
     * CERRAR MODAL INDIVIDUAL
     */
    function closeIndividualModal() {
        formSectionIndividual.classList.remove('show');
        document.body.style.overflow = '';
        // Resetear formulario
        if (formIndividual) formIndividual.reset();
        isSubmittingIndividual = false;
    }

    /**
     * CERRAR MODAL DÚO
     */
    function closeDuoModal() {
        formSectionDuo.classList.remove('show');
        document.body.style.overflow = '';
        // Resetear formulario
        if (formDuo) formDuo.reset();
        isSubmittingDuo = false;
    }

    /**
     * VALIDAR FORMULARIO INDIVIDUAL
     */
    function validateFormIndividual() {
        let isValid = true;
        const nombre = document.getElementById('nombre-individual');
        const telefono = document.getElementById('telefono-individual');
        const correo = document.getElementById('correo-individual');
        const departamento = document.getElementById('departamento-individual');
        const ciudad = document.getElementById('ciudad-individual');
        const direccion = document.getElementById('direccion-individual');

        if (!validateRequired(nombre.value)) {
            showError(nombre, 'Por favor ingresa tu nombre completo');
            isValid = false;
        } else if (!isValidTextFormat(nombre.value, 100)) {
            showError(nombre, 'El nombre contiene caracteres no permitidos');
            isValid = false;
        } else {
            removeError(nombre);
        }

        if (!validatePhone(telefono.value)) {
            showError(telefono, 'Ingresa un número de celular válido (10 dígitos, ej: 300 123 4567)');
            isValid = false;
        } else {
            removeError(telefono);
        }

        if (!validateEmail(correo.value)) {
            showError(correo, 'Por favor ingresa un correo válido (ej: maria@ejemplo.com)');
            isValid = false;
        } else {
            removeError(correo);
        }

        if (!validateRequired(departamento.value)) {
            showError(departamento, 'Por favor selecciona tu departamento');
            isValid = false;
        } else {
            removeError(departamento);
        }

        if (!validateRequired(ciudad.value)) {
            showError(ciudad, 'Por favor ingresa tu ciudad');
            isValid = false;
        } else if (!isValidTextFormat(ciudad.value, 100)) {
            showError(ciudad, 'La ciudad contiene caracteres no permitidos');
            isValid = false;
        } else {
            removeError(ciudad);
        }

        if (!validateAddress(direccion.value)) {
            showError(direccion, 'Por favor ingresa una dirección más detallada (mínimo 10 caracteres)');
            isValid = false;
        } else if (!isValidTextFormat(direccion.value, 200)) {
            showError(direccion, 'La dirección contiene caracteres no permitidos');
            isValid = false;
        } else {
            removeError(direccion);
        }

        return isValid;
    }

    /**
     * VALIDAR FORMULARIO DÚO
     */
    function validateFormDuo() {
        let isValid = true;
        const nombre = document.getElementById('nombre-duo');
        const telefono = document.getElementById('telefono-duo');
        const correo = document.getElementById('correo-duo');
        const departamento = document.getElementById('departamento-duo');
        const ciudad = document.getElementById('ciudad-duo');
        const direccion = document.getElementById('direccion-duo');

        if (!validateRequired(nombre.value)) {
            showError(nombre, 'Por favor ingresa tu nombre completo');
            isValid = false;
        } else if (!isValidTextFormat(nombre.value, 100)) {
            showError(nombre, 'El nombre contiene caracteres no permitidos');
            isValid = false;
        } else {
            removeError(nombre);
        }

        if (!validatePhone(telefono.value)) {
            showError(telefono, 'Ingresa un número de celular válido (10 dígitos, ej: 300 123 4567)');
            isValid = false;
        } else {
            removeError(telefono);
        }

        if (!validateEmail(correo.value)) {
            showError(correo, 'Por favor ingresa un correo válido (ej: maria@ejemplo.com)');
            isValid = false;
        } else {
            removeError(correo);
        }

        if (!validateRequired(departamento.value)) {
            showError(departamento, 'Por favor selecciona tu departamento');
            isValid = false;
        } else {
            removeError(departamento);
        }

        if (!validateRequired(ciudad.value)) {
            showError(ciudad, 'Por favor ingresa tu ciudad');
            isValid = false;
        } else if (!isValidTextFormat(ciudad.value, 100)) {
            showError(ciudad, 'La ciudad contiene caracteres no permitidos');
            isValid = false;
        } else {
            removeError(ciudad);
        }

        if (!validateAddress(direccion.value)) {
            showError(direccion, 'Por favor ingresa una dirección más detallada (mínimo 10 caracteres)');
            isValid = false;
        } else if (!isValidTextFormat(direccion.value, 200)) {
            showError(direccion, 'La dirección contiene caracteres no permitidos');
            isValid = false;
        } else {
            removeError(direccion);
        }

        return isValid;
    }

    /**
     * Envía los datos al backend propio
     */
    async function sendToBackend(formData, packageId) {
        try {
            const pkg = PACKAGES[packageId];
            if (!pkg) {
                console.error('❌ Paquete inválido:', packageId);
                return false;
            }

            const sanitizedData = {
                nombre: sanitizeString(formData.nombre),
                telefono: sanitizeString(formData.telefono),
                correo: sanitizeString(formData.correo),
                departamento: sanitizeString(formData.departamento),
                ciudad: sanitizeString(formData.ciudad),
                direccion: sanitizeString(formData.direccion),
                observaciones: sanitizeString(formData.observaciones)
            };

            const payload = {
                product: {
                    id: packageId,
                    name: pkg.name,
                    quantity: pkg.quantity,
                    price: pkg.productPrice,
                    shipping: pkg.shippingCost,
                    total: pkg.total
                },
                customer: sanitizedData
            };

            console.log('📤 Enviando pedido al backend...');

            const response = await fetch('/api/submit-order.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error('❌ Error HTTP:', response.status);
                return false;
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Pedido enviado:', result.orderId);
                return true;
            } else {
                console.error('❌ Error:', result.error);
                return false;
            }

        } catch (error) {
            console.error('❌ Error al enviar:', error);
            return false;
        }
    }

    /**
     * Muestra modal de confirmación
     */
    function showSuccessMessage(formData, packageId) {
        // Cerrar modales de formularios primero
        formSectionIndividual.classList.remove('show');
        formSectionDuo.classList.remove('show');

        const modal = document.getElementById('confirmationModal');
        const pkg = PACKAGES[packageId];

        if (!pkg) {
            console.error('No hay paquete seleccionado');
            return;
        }

        const unitPrice = pkg.productPrice / pkg.quantity;

        const unitsEl = document.getElementById('invoice-units');
        const unitPriceEl = document.getElementById('invoice-unit-price');
        const subtotalEl = document.getElementById('invoice-product-subtotal');
        const totalSubtotalEl = document.getElementById('invoice-subtotal');
        const shippingEl = document.getElementById('invoice-shipping');
        const totalEl = document.getElementById('invoice-total');

        if (unitsEl) unitsEl.textContent = pkg.quantity;
        if (unitPriceEl) unitPriceEl.textContent = formatPrice(unitPrice);
        if (subtotalEl) subtotalEl.textContent = formatPrice(pkg.productPrice);
        if (totalSubtotalEl) totalSubtotalEl.textContent = formatPrice(pkg.productPrice);

        if (shippingEl) {
            shippingEl.textContent = pkg.shippingLabel;
            if (pkg.shippingLabel === 'GRATIS') {
                shippingEl.style.color = '#059669';
                shippingEl.style.fontWeight = '700';
            } else {
                shippingEl.style.color = 'inherit';
                shippingEl.style.fontWeight = '500';
            }
        }

        if (totalEl) totalEl.textContent = formatPrice(pkg.total);

        // Mostrar modal de confirmación
        modal.classList.add('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Cierra la modal de confirmación
     */
    function closeConfirmationModal() {
        const modal = document.getElementById('confirmationModal');
        modal.classList.remove('show');

        // Cerrar también los formularios modales
        closeIndividualModal();
        closeDuoModal();
    }

    /**
     * SUBMIT FORMULARIO INDIVIDUAL
     */
    async function submitFormIndividual(e) {
        e.preventDefault();

        if (isSubmittingIndividual) return;

        // 1. DESHABILITAR BOTÓN INMEDIATAMENTE
        const submitButton = formIndividual.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Procesando...';
            submitButton.style.opacity = '0.6';
            submitButton.style.cursor = 'not-allowed';
        }

        isSubmittingIndividual = true;

        // 2. VALIDAR FORMULARIO
        if (!validateFormIndividual()) {
            // Si la validación falla, reactivar botón
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'COMPRAR AHORA';
                submitButton.style.opacity = '';
                submitButton.style.cursor = '';
            }
            isSubmittingIndividual = false;
            return;
        }

        // 3. RECOPILAR DATOS
        const formData = {
            nombre: document.getElementById('nombre-individual').value.trim(),
            telefono: formatPhoneDisplay(document.getElementById('telefono-individual').value),
            correo: document.getElementById('correo-individual').value.trim(),
            departamento: document.getElementById('departamento-individual').value.trim(),
            ciudad: document.getElementById('ciudad-individual').value.trim(),
            direccion: document.getElementById('direccion-individual').value.trim(),
            observaciones: document.getElementById('observaciones-individual').value.trim()
        };

        // 4. RASTREAR COMPRA EN META PIXEL (ANTES de mostrar modal)
        if (typeof fbq === 'function') {
            fbq('track', 'Purchase', {
                value: 110000,
                currency: 'COP',
                content_name: 'Kit Detox 4 Días'
            });
        }

        // 5. MOSTRAR CONFIRMACIÓN INMEDIATAMENTE (SIN ESPERAR AL BACKEND)
        showSuccessMessage(formData, 1);

        // 6. ENVIAR AL BACKEND EN BACKGROUND (sin bloquear)
        // Fire and forget - no esperamos respuesta
        sendToBackend(formData, 1).catch(error => {
            console.error('⚠️ Error al enviar pedido en background:', error);
        });
    }

    /**
     * SUBMIT FORMULARIO DÚO
     */
    async function submitFormDuo(e) {
        e.preventDefault();

        if (isSubmittingDuo) return;

        // 1. DESHABILITAR BOTÓN INMEDIATAMENTE
        const submitButton = formDuo.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Procesando...';
            submitButton.style.opacity = '0.6';
            submitButton.style.cursor = 'not-allowed';
        }

        isSubmittingDuo = true;

        // 2. VALIDAR FORMULARIO
        if (!validateFormDuo()) {
            // Si la validación falla, reactivar botón
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'COMPRAR AHORA';
                submitButton.style.opacity = '';
                submitButton.style.cursor = '';
            }
            isSubmittingDuo = false;
            return;
        }

        // 3. RECOPILAR DATOS
        const formData = {
            nombre: document.getElementById('nombre-duo').value.trim(),
            telefono: formatPhoneDisplay(document.getElementById('telefono-duo').value),
            correo: document.getElementById('correo-duo').value.trim(),
            departamento: document.getElementById('departamento-duo').value.trim(),
            ciudad: document.getElementById('ciudad-duo').value.trim(),
            direccion: document.getElementById('direccion-duo').value.trim(),
            observaciones: document.getElementById('observaciones-duo').value.trim()
        };

        // 4. RASTREAR COMPRA EN META PIXEL (ANTES de mostrar modal)
        if (typeof fbq === 'function') {
            fbq('track', 'Purchase', {
                value: 160000,
                currency: 'COP',
                content_name: 'Plan Dúo: Reinicio Total'
            });
        }

        // 5. MOSTRAR CONFIRMACIÓN INMEDIATAMENTE (SIN ESPERAR AL BACKEND)
        showSuccessMessage(formData, 2);

        // 6. ENVIAR AL BACKEND EN BACKGROUND (sin bloquear)
        // Fire and forget - no esperamos respuesta
        sendToBackend(formData, 2).catch(error => {
            console.error('⚠️ Error al enviar pedido en background:', error);
        });
    }

    /**
     * Event Listeners
     */
    function setupEventListeners() {
        // Submit formularios
        if (formIndividual) {
            formIndividual.addEventListener('submit', submitFormIndividual);
        }
        if (formDuo) {
            formDuo.addEventListener('submit', submitFormDuo);
        }

        // Formatear teléfonos
        const telefonoIndividual = document.getElementById('telefono-individual');
        const telefonoDuo = document.getElementById('telefono-duo');

        if (telefonoIndividual) {
            telefonoIndividual.addEventListener('input', formatPhoneInput);
        }
        if (telefonoDuo) {
            telefonoDuo.addEventListener('input', formatPhoneInput);
        }

        // Remover errores al escribir (Formulario Individual)
        const inputsIndividual = [
            'nombre-individual',
            'telefono-individual',
            'correo-individual',
            'departamento-individual',
            'ciudad-individual',
            'direccion-individual'
        ];

        inputsIndividual.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => removeError(input));
                if (input.tagName === 'SELECT') {
                    input.addEventListener('change', () => removeError(input));
                }
            }
        });

        // Remover errores al escribir (Formulario Dúo)
        const inputsDuo = [
            'nombre-duo',
            'telefono-duo',
            'correo-duo',
            'departamento-duo',
            'ciudad-duo',
            'direccion-duo'
        ];

        inputsDuo.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => removeError(input));
                if (input.tagName === 'SELECT') {
                    input.addEventListener('change', () => removeError(input));
                }
            }
        });

        // Botón cerrar modal
        const closeButtonX = document.getElementById('closeButtonX');
        if (closeButtonX) {
            closeButtonX.addEventListener('click', closeConfirmationModal);
        }

        // Botones cerrar formularios modales
        const closeIndividualBtn = document.getElementById('closeIndividual');
        const closeDuoBtn = document.getElementById('closeDuo');

        if (closeIndividualBtn) {
            closeIndividualBtn.addEventListener('click', closeIndividualModal);
        }

        if (closeDuoBtn) {
            closeDuoBtn.addEventListener('click', closeDuoModal);
        }

        // Cerrar modal al hacer clic fuera
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeConfirmationModal();
                }
            });
        }

        // Cerrar formularios al hacer clic en el overlay
        if (formSectionIndividual) {
            formSectionIndividual.addEventListener('click', (e) => {
                if (e.target === formSectionIndividual) {
                    closeIndividualModal();
                }
            });
        }

        if (formSectionDuo) {
            formSectionDuo.addEventListener('click', (e) => {
                if (e.target === formSectionDuo) {
                    closeDuoModal();
                }
            });
        }

        // Event listeners para botones de pricing cards - SIN DEBOUNCE (instantáneo)
        const pricingButtons = document.querySelectorAll('.pricing-btn');
        pricingButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();

                // Prevenir apertura múltiple - check instantáneo
                if (isOpeningModal) {
                    console.log('Modal ya está abriéndose, ignorando clic');
                    return;
                }

                isOpeningModal = true;
                const packageId = button.getAttribute('data-package');
                if (packageId) {
                    showFormForPackage(packageId);
                }

                // Reset después de 500ms para permitir nuevos clics
                setTimeout(() => {
                    isOpeningModal = false;
                }, 500);
            });
        });
    }

    /**
     * Envía evento ViewContent para los productos disponibles
     */
    function trackProductViews() {
        if (typeof window.sendFacebookEvent !== 'function') {
            return; // Facebook no está listo
        }

        // Rastrear cada producto visible en la página
        Object.entries(PACKAGES).forEach(([packageId, pkg]) => {
            window.sendFacebookEvent({
                eventName: 'ViewContent',
                packageId: parseInt(packageId),
                contentName: pkg.name,
                contentType: 'product'
            }).catch(error => {
                console.warn(`No se pudo enviar ViewContent para producto ${packageId}:`, error);
            });
        });
    }

    /**
     * Inicializa el manejo de formularios
     */
    function init() {
        setupEventListeners();

        // Enviar eventos ViewContent después de un pequeño delay
        // para permitir que los scripts de Facebook se carguen
        setTimeout(trackProductViews, 500);
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
