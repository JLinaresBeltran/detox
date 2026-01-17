// Scroll Animations - Bidireccionales
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observerCallback = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Scroll hacia abajo - agregar animación
                entry.target.classList.add('animate');
            } else {
                // Scroll hacia arriba - quitar animación (reversar)
                entry.target.classList.remove('animate');
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observar título y timeline items
    const animatedElements = document.querySelectorAll('.scroll-animate, .timeline-item');
    animatedElements.forEach(item => {
        observer.observe(item);
    });
});
