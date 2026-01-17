document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('unboxing-video');
    if (!video) return;

    const section = video.closest('.solution');
    let hasPlayed = false;

    function checkAndPlayVideo() {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible && !hasPlayed) {
            video.currentTime = 0; // Comenzar desde el segundo 0
            video.play();
            hasPlayed = true;
        } else if (!isVisible && hasPlayed) {
            // Si se sale de pantalla, permitir que se reproduzca de nuevo cuando vuelva
            hasPlayed = false;
        }
    }

    // Cuando el video termina, volver al segundo 1 y pausar
    video.addEventListener('ended', function() {
        video.currentTime = 1;
        video.pause();
    });

    window.addEventListener('scroll', checkAndPlayVideo);
    checkAndPlayVideo(); // Verificar en caso de que esté visible al cargar
});
