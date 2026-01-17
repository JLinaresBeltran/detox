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

    // Configuración
    const FORM_ID = 'y23sdazrtoy'; // ID del formulario Forminit

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
        if (packageId === '1') {
            formSectionIndividual.classList.add('show');
            formSectionDuo.classList.remove('show');
            // Prevenir scroll en el body
            document.body.style.overflow = 'hidden';
        } else if (packageId === '2') {
            formSectionDuo.classList.add('show');
            formSectionIndividual.classList.remove('show');
            // Prevenir scroll en el body
            document.body.style.overflow = 'hidden';
        }
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
     * Envía los datos a Getform usando Forminit SDK
     */
    async function sendToGetform(formData, packageId) {
        try {
            if (typeof Forminit === 'undefined') {
                console.error('❌ Forminit SDK no está cargado');
                return false;
            }

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

            // Combinar campos para reducir a máximo 10 campos (Forminit limit)
            const ubicacion = `${sanitizedData.departamento}, ${sanitizedData.ciudad}`;
            const resumenPrecio = `Producto: ${formatPrice(pkg.productPrice)} | Envío: ${pkg.shippingLabel} | Total: ${formatPrice(pkg.total)}`;

            const data = new FormData();
            // 9 campos en total (dentro del límite de 10)
            data.append('fi-text-nombre', sanitizedData.nombre);
            data.append('fi-text-telefono', sanitizedData.telefono);
            data.append('fi-text-correo', sanitizedData.correo);
            data.append('fi-text-ubicacion', ubicacion); // Departamento + Ciudad combinados
            data.append('fi-text-direccion', sanitizedData.direccion);
            data.append('fi-text-observaciones', sanitizedData.observaciones);
            data.append('fi-text-producto', `${pkg.name} (${pkg.quantity} unidad${pkg.quantity > 1 ? 'es' : ''})`);
            data.append('fi-text-resumen-precio', resumenPrecio); // Precios combinados
            data.append('fi-text-fecha', new Date().toLocaleString('es-CO'));

            const forminit = new Forminit();
            const { data: response, error } = await forminit.submit(FORM_ID, data);

            if (error) {
                console.error('❌ Error al enviar a Getform:', error.message);
                return false;
            }

            console.log('✅ Pedido enviado correctamente:', pkg.name);
            return true;
        } catch (error) {
            console.error('❌ Error al enviar a Getform:', error);
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
        if (!validateFormIndividual()) return;

        isSubmittingIndividual = true;
        const submitButton = formIndividual.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Procesando...';
        }

        const formData = {
            nombre: document.getElementById('nombre-individual').value.trim(),
            telefono: formatPhoneDisplay(document.getElementById('telefono-individual').value),
            correo: document.getElementById('correo-individual').value.trim(),
            departamento: document.getElementById('departamento-individual').value.trim(),
            ciudad: document.getElementById('ciudad-individual').value.trim(),
            direccion: document.getElementById('direccion-individual').value.trim(),
            observaciones: document.getElementById('observaciones-individual').value.trim()
        };

        const sendSuccess = await sendToGetform(formData, 1);

        if (!sendSuccess && submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'COMPRAR AHORA';
            isSubmittingIndividual = false;
            return;
        }

        showSuccessMessage(formData, 1);
    }

    /**
     * SUBMIT FORMULARIO DÚO
     */
    async function submitFormDuo(e) {
        e.preventDefault();

        if (isSubmittingDuo) return;
        if (!validateFormDuo()) return;

        isSubmittingDuo = true;
        const submitButton = formDuo.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Procesando...';
        }

        const formData = {
            nombre: document.getElementById('nombre-duo').value.trim(),
            telefono: formatPhoneDisplay(document.getElementById('telefono-duo').value),
            correo: document.getElementById('correo-duo').value.trim(),
            departamento: document.getElementById('departamento-duo').value.trim(),
            ciudad: document.getElementById('ciudad-duo').value.trim(),
            direccion: document.getElementById('direccion-duo').value.trim(),
            observaciones: document.getElementById('observaciones-duo').value.trim()
        };

        const sendSuccess = await sendToGetform(formData, 2);

        if (!sendSuccess && submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'COMPRAR AHORA';
            isSubmittingDuo = false;
            return;
        }

        showSuccessMessage(formData, 2);
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

        // Event listeners para botones de pricing cards
        const pricingButtons = document.querySelectorAll('.pricing-btn');
        pricingButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const packageId = button.getAttribute('data-package');
                if (packageId) {
                    showFormForPackage(packageId);
                }
            });
        });
    }

    /**
     * Inicializa el manejo de formularios
     */
    function init() {
        setupEventListeners();
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
