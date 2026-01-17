# Landing Page - Detox Sabeho 🌟

Landing page profesional para el producto **Detox Sabeho** con diseño responsive mobile-first.

## 📋 Características Implementadas

✅ **8 Secciones completas:**
1. Hero con CTA principal
2. El Problema (empatía con el cliente)
3. La Solución (4 componentes del protocolo)
4. Cronograma de transformación (4 días)
5. Prueba Social (carrusel de testimonios)
6. Precios y Garantía (con contador de urgencia)
7. FAQ (acordeón expandible)
8. Formulario de pedido con validación

✅ **Funcionalidades interactivas:**
- Contador de urgencia en tiempo real (45 minutos, con reinicio automático)
- Carrusel de testimonios con navegación, auto-play y soporte táctil
- Formulario con validación completa
- Integración con WhatsApp
- Botón flotante de WhatsApp
- FAQ con acordeón
- Smooth scroll

✅ **Diseño responsive:**
- Mobile-first
- Breakpoints: 640px, 768px, 1024px, 1280px
- Optimizado para todos los dispositivos

## 🎨 Paleta de Colores

- **Blanco Hueso** (#FAF9F6) - Fondo principal
- **Rosa Pitaya** (#BE185D) - Botones y acentos
- **Verde Esmeralda** (#059669) - Confianza/salud
- **Gris Carbón** (#374151) - Texto principal
- **Rosa Pálido** (#FDF2F8) - Fondos de secciones

## 📁 Estructura de Archivos

```
Detox/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Todos los estilos
├── js/
│   ├── countdown.js        # Contador de urgencia
│   ├── carousel.js         # Carrusel de testimonios
│   └── form.js             # Validación del formulario
└── images/
    └── placeholders/       # Imágenes temporales (SVG)
        ├── kit-product.jpg
        ├── before-after.jpg
        ├── woman-mirror.jpg
        ├── unboxing.jpg
        ├── testimonio-1.jpg
        ├── testimonio-2.jpg
        └── testimonio-3.jpg
```

## 🚀 Cómo Usar

### 1. Abrir la página
Simplemente abre el archivo `index.html` en tu navegador web favorito.

### 2. Personalización IMPORTANTE

**A. Actualizar número de WhatsApp:**

Debes actualizar el número de WhatsApp en **3 lugares**:

1. **index.html** (línea ~37):
```html
<a href="https://wa.me/57XXXXXXXXXX?text=...
```

2. **index.html** (línea ~574):
```html
<a href="https://wa.me/57XXXXXXXXXX" target="_blank">WhatsApp</a>
```

3. **js/form.js** (línea ~16):
```javascript
const WHATSAPP_NUMBER = '57XXXXXXXXXX'; // Reemplazar con tu número
```

**Formato del número:** 57 + número celular (10 dígitos)
**Ejemplo:** `573001234567`

**B. Reemplazar imágenes placeholder:**

Las imágenes en `images/placeholders/` son SVG temporales. Reemplázalas con tus fotos reales:
- `kit-product.jpg` - Foto del kit completo
- `before-after.jpg` - Foto antes/después de resultados
- `woman-mirror.jpg` - Foto de mujer frente al espejo
- `unboxing.jpg` - Foto del kit abierto mostrando los 4 componentes
- `testimonio-1.jpg`, `testimonio-2.jpg`, `testimonio-3.jpg` - Fotos de testimonios reales

**Importante:** Mantén los mismos nombres de archivo o actualiza las referencias en `index.html`.

### 3. Ajustes Opcionales

**Cambiar duración del contador de urgencia:**
En `js/countdown.js`, línea 16:
```javascript
const COUNTDOWN_DURATION = 45 * 60; // Cambiar 45 por los minutos deseados
```

**Cambiar velocidad del carrusel:**
En `js/carousel.js`, línea 29:
```javascript
const AUTO_PLAY_INTERVAL = 5000; // Tiempo en milisegundos (5000 = 5 segundos)
```

**Modificar textos:**
Todos los textos están en `index.html` y son fácilmente editables.

## 📱 Testing Responsive

Para probar en diferentes dispositivos:

1. Abre Chrome DevTools (F12 o Cmd+Option+I en Mac)
2. Activa el modo responsive (icono de dispositivo móvil)
3. Prueba en:
   - iPhone SE (375px)
   - iPhone 12/13 Pro (390px)
   - iPad (768px)
   - Desktop (1280px+)

## ✅ Checklist de Personalización

Antes de publicar, verifica:

- [ ] Actualizar número de WhatsApp en los 3 lugares
- [ ] Reemplazar todas las imágenes placeholder
- [ ] Revisar todos los textos y precios
- [ ] Probar el formulario de pedido
- [ ] Verificar que el contador funcione
- [ ] Probar el carrusel de testimonios
- [ ] Revisar el FAQ y actualizar respuestas si es necesario
- [ ] Probar en móvil y desktop
- [ ] Verificar que los botones de WhatsApp funcionen

## 🌐 Hosting/Publicación

Puedes publicar esta landing page en:

1. **Netlify** (Gratis, recomendado):
   - Arrastra la carpeta `Detox` a netlify.com/drop
   - ¡Listo! Tendrás una URL pública

2. **Vercel** (Gratis):
   - Crea una cuenta en vercel.com
   - Conecta tu carpeta del proyecto
   - Deploy automático

3. **GitHub Pages** (Gratis):
   - Sube los archivos a un repositorio de GitHub
   - Activa GitHub Pages en la configuración
   - Tu página estará en `usuario.github.io/nombre-repo`

4. **Servidor tradicional**:
   - Sube todos los archivos por FTP
   - Asegúrate de que `index.html` esté en la raíz

## 🔧 Solución de Problemas

**El contador no funciona:**
- Verifica que `js/countdown.js` esté cargando correctamente
- Abre la consola del navegador (F12) y busca errores

**El carrusel no se mueve:**
- Verifica que `js/carousel.js` esté cargando
- Comprueba que los elementos tengan las clases correctas

**El formulario no envía a WhatsApp:**
- Verifica que hayas actualizado `WHATSAPP_NUMBER` en `js/form.js`
- El formato debe ser: `57` + 10 dígitos (ej: `573001234567`)

**Las imágenes no cargan:**
- Verifica que las rutas de las imágenes sean correctas
- Asegúrate de que los archivos estén en `images/placeholders/`

## 📊 Analytics (Opcional)

Para agregar Google Analytics:
1. Crea una cuenta en analytics.google.com
2. Obtén tu código de seguimiento
3. Pégalo antes del `</head>` en `index.html`

Para agregar Facebook Pixel:
1. Crea un Pixel en Facebook Business
2. Copia el código del Pixel
3. Pégalo antes del `</head>` en `index.html`

## 💡 Mejoras Futuras Sugeridas

- Agregar más testimonios al carrusel
- Integrar con un sistema de pagos online
- Agregar chat en vivo
- Implementar seguimiento de conversiones
- Crear versiones A/B para testing
- Agregar video del producto

## 📞 Soporte

Si tienes problemas o preguntas:
- Revisa este README completo
- Verifica la consola del navegador para errores
- Asegúrate de haber seguido todos los pasos de personalización

---

**Desarrollado con:** HTML5, CSS3, JavaScript vanilla
**Diseño:** Mobile-first, responsive, accesible
**Optimizado para:** Conversión y experiencia de usuario

¡Buena suerte con tu landing page! 🚀
