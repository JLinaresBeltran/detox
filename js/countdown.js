/**
 * COUNTDOWN TIMER - Contador de Urgencia
 *
 * Características:
 * - Cuenta regresiva desde 45 minutos
 * - Formato: HH:MM:SS
 * - Reinicio automático al llegar a 0
 * - Persistencia con localStorage para mantener el tiempo entre recargas
 */

(function() {
    'use strict';

    // Configuración
    const COUNTDOWN_DURATION = 45 * 60; // 45 minutos en segundos
    const STORAGE_KEY = 'detox_countdown_end';
    const countdownElement = document.getElementById('countdown');

    if (!countdownElement) {
        console.warn('Elemento countdown no encontrado');
        return;
    }

    /**
     * Obtiene el tiempo restante en segundos
     * Si existe un contador guardado en localStorage, lo usa
     * Si no, crea uno nuevo
     */
    function getTimeRemaining() {
        const now = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
        let endTime = localStorage.getItem(STORAGE_KEY);

        // Si no hay contador guardado o ya expiró, crear uno nuevo
        if (!endTime || parseInt(endTime) <= now) {
            endTime = now + COUNTDOWN_DURATION;
            localStorage.setItem(STORAGE_KEY, endTime);
        }

        const remaining = parseInt(endTime) - now;
        return Math.max(0, remaining);
    }

    /**
     * Formatea segundos a formato HH:MM:SS
     * @param {number} totalSeconds - Total de segundos
     * @returns {string} Tiempo formateado (ej: "00:45:00")
     */
    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [hours, minutes, seconds]
            .map(num => String(num).padStart(2, '0'))
            .join(':');
    }

    /**
     * Actualiza el display del contador
     */
    function updateDisplay() {
        const remaining = getTimeRemaining();
        countdownElement.textContent = formatTime(remaining);

        // Si llegó a 0, reiniciar el contador
        if (remaining === 0) {
            resetCountdown();
        }
    }

    /**
     * Reinicia el contador creando un nuevo tiempo de finalización
     */
    function resetCountdown() {
        const now = Math.floor(Date.now() / 1000);
        const newEndTime = now + COUNTDOWN_DURATION;
        localStorage.setItem(STORAGE_KEY, newEndTime);
        updateDisplay();
    }

    /**
     * Inicializa el contador
     */
    function init() {
        // Actualizar inmediatamente
        updateDisplay();

        // Actualizar cada segundo
        setInterval(updateDisplay, 1000);
    }

    // Iniciar el contador cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
