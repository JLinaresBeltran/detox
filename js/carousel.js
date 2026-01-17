/**
 * CAROUSEL - Carrusel de Testimonios
 *
 * Características:
 * - Navegación prev/next
 * - Auto-play con pausa on hover
 * - Touch swipe support para móviles
 * - Indicadores clickeables
 * - Responsive (1 slide en móvil, 2 en tablet, 3 en desktop)
 */

(function() {
    'use strict';

    // Elementos del DOM
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');
    const indicators = Array.from(document.querySelectorAll('.indicator'));

    if (!track || slides.length === 0) {
        console.warn('Carrusel no encontrado o sin slides');
        return;
    }

    // Configuración
    const AUTO_PLAY_INTERVAL = 5000; // 5 segundos
    let currentIndex = 0;
    let autoPlayTimer = null;
    let isAutoPlaying = true;

    // Variables para touch swipe
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    /**
     * Obtiene el número de slides visibles según el ancho de pantalla
     */
    function getSlidesPerView() {
        const width = window.innerWidth;
        if (width >= 1024) return 3;
        if (width >= 768) return 2;
        return 1;
    }

    /**
     * Calcula el índice máximo permitido
     */
    function getMaxIndex() {
        const slidesPerView = getSlidesPerView();
        return Math.max(0, slides.length - slidesPerView);
    }

    /**
     * Actualiza la posición del carrusel
     */
    function updateCarousel() {
        const slideWidth = 100 / getSlidesPerView();
        const translateX = -(currentIndex * slideWidth);
        track.style.transform = `translateX(${translateX}%)`;
        updateIndicators();
    }

    /**
     * Actualiza los indicadores activos
     */
    function updateIndicators() {
        indicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    /**
     * Va al siguiente slide
     */
    function nextSlide() {
        const maxIndex = getMaxIndex();
        currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        updateCarousel();
    }

    /**
     * Va al slide anterior
     */
    function prevSlide() {
        const maxIndex = getMaxIndex();
        currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        updateCarousel();
    }

    /**
     * Va a un slide específico
     */
    function goToSlide(index) {
        const maxIndex = getMaxIndex();
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        updateCarousel();
    }

    /**
     * Inicia el auto-play
     */
    function startAutoPlay() {
        if (!isAutoPlaying) return;
        stopAutoPlay(); // Limpiar timer anterior si existe
        autoPlayTimer = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    }

    /**
     * Detiene el auto-play
     */
    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }

    /**
     * Pausa temporal el auto-play (reanuda después)
     */
    function pauseAutoPlay() {
        stopAutoPlay();
        setTimeout(() => {
            if (isAutoPlaying) startAutoPlay();
        }, 1000);
    }

    /**
     * Maneja el inicio del touch
     */
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        isSwiping = true;
        stopAutoPlay();
    }

    /**
     * Maneja el movimiento del touch
     */
    function handleTouchMove(e) {
        if (!isSwiping) return;
        touchEndX = e.touches[0].clientX;
    }

    /**
     * Maneja el fin del touch
     */
    function handleTouchEnd() {
        if (!isSwiping) return;
        isSwiping = false;

        const swipeThreshold = 50; // Mínimo de píxeles para considerar un swipe
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe izquierda -> siguiente
                nextSlide();
            } else {
                // Swipe derecha -> anterior
                prevSlide();
            }
        }

        if (isAutoPlaying) startAutoPlay();
    }

    /**
     * Event Listeners
     */
    function setupEventListeners() {
        // Botones de navegación
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                pauseAutoPlay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                pauseAutoPlay();
            });
        }

        // Indicadores
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                goToSlide(index);
                pauseAutoPlay();
            });
        });

        // Touch events para swipe
        track.addEventListener('touchstart', handleTouchStart, { passive: true });
        track.addEventListener('touchmove', handleTouchMove, { passive: true });
        track.addEventListener('touchend', handleTouchEnd);

        // Pausar auto-play al hacer hover
        const carousel = document.querySelector('.carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', stopAutoPlay);
            carousel.addEventListener('mouseleave', () => {
                if (isAutoPlaying) startAutoPlay();
            });
        }

        // Actualizar carrusel al cambiar tamaño de ventana
        window.addEventListener('resize', () => {
            const maxIndex = getMaxIndex();
            if (currentIndex > maxIndex) {
                currentIndex = maxIndex;
            }
            updateCarousel();
        });
    }

    /**
     * Inicializa el carrusel
     */
    function init() {
        updateCarousel();
        setupEventListeners();
        startAutoPlay();
    }

    // Iniciar el carrusel cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
