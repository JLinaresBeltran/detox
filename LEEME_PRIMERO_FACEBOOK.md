# 🔴 El evento NO se detecta en Facebook - SOLUCIÓN RÁPIDA

## 🎯 Problema Identificado

Ya detecté el **problema más probable**: El **Access Token probablemente expiró**.

El Access Token que está configurado en el código fue colocado hace tiempo y **los tokens de Facebook expiran**.

---

## ⚡ SOLUCIÓN INMEDIATA (5 minutos)

### Paso 1: Genera un Nuevo Access Token

1. Ve a **[Facebook Developer Dashboard](https://developers.facebook.com/apps)**
2. Selecciona tu App
3. En el menú, busca **Herramientas** → **Explorador de Graph API**
4. En la esquina superior derecha, donde ves el token actual, haz click
5. Selecciona **Obtener nuevos tokens de acceso**
6. Si te pide permisos, asegúrate de seleccionar:
   - ✅ `ads_read`
   - ✅ `ads_manage`
7. Copia el token completo (empieza con `EAAS...`)

### Paso 2: Reemplaza el Token en el Código

1. Abre el archivo: `/js/facebook-conversions.js`
2. Ve a la **línea 16**
3. Busca: `const FACEBOOK_ACCESS_TOKEN = 'EAASfnFwPqrI...'`
4. Reemplaza TODO el token viejo con el nuevo
5. **Ejemplo:**
   ```javascript
   // Antes (INCORRECTO):
   const FACEBOOK_ACCESS_TOKEN = 'EAASfnFwPqrIBQTnSNKiZB7Xey...';

   // Después (CORRECTO):
   const FACEBOOK_ACCESS_TOKEN = 'EAAS[TU_TOKEN_NUEVO_AQUI]';
   ```

### Paso 3: Recarga tu Sitio

1. Ve a tu sitio web
2. Presiona **Ctrl+R** (Windows) o **Cmd+R** (Mac)
3. Espera a que cargue completamente
4. Abre **F12 → Console**

### Paso 4: Realiza una Prueba

En la consola (F12), ejecuta:
```javascript
testFacebookEvent()
```

**Resultado esperado:**
```
✅ EVENTO ENVIADO CORRECTAMENTE
```

Si ves eso → **¡Todo funciona!**

---

## 🔍 Verificación en Facebook Events Manager

Después de hacer el test:

1. Ve a **[Facebook Events Manager](https://business.facebook.com/latest/events_manager)**
2. Selecciona tu Pixel: **1142678136915324**
3. En **Eventos recientes**, busca un evento **Purchase**
4. Debería tener timestamp **hace menos de 5 minutos**

Si ves el evento → **¡Sistema funciona correctamente!**

---

## 📊 Si Aún No Funciona

Si después de cambiar el token sigue sin funcionar, sigue estos documentos en orden:

1. **Primero:** Lee `VERIFICACION_FACEBOOK.md`
   - Guía paso a paso para identificar exactamente dónde está el problema

2. **Luego:** Lee `USAR_DEBUG_TOOLS.md`
   - Cómo usar las herramientas de debugging que incluí

3. **Finalmente:** Lee `FACEBOOK_DEBUGGING.md`
   - Guía avanzada de troubleshooting

---

## 🛠️ Herramientas de Debug Disponibles

En la consola (F12), puedes ejecutar:

```javascript
// Ver estado actual
facebookStatus()

// Hacer test completo
testFacebookEvent()

// Ver estructura del evento
showEventPayload()

// Monitorear requests (avanzado)
monitorFacebookRequests()
```

---

## 📋 Checklist Rápido

- [ ] Generé nuevo Access Token
- [ ] Reemplacé el token en `/js/facebook-conversions.js` línea 16
- [ ] Recargué la página (Ctrl+R)
- [ ] Abrí F12 → Console
- [ ] Ejecuté `testFacebookEvent()`
- [ ] Vi mensaje `✅ EVENTO ENVIADO CORRECTAMENTE`
- [ ] Fui a Facebook Events Manager
- [ ] Seleccioné Pixel 1142678136915324
- [ ] Vi evento "Purchase" en Eventos recientes

Si completaste todo esto con ✅ → **¡Sistema funciona!**

---

## ⚠️ Posibles Errores y Soluciones

### Error: "Invalid OAuth access token"
```
Significa: El token expiró o es incorrecto
Solución: Genera un nuevo token (ver "Solución Inmediata" arriba)
```

### Error: "Pixel not found"
```
Significa: El Pixel ID es incorrecto
Verificación: Abre Facebook Ads Manager → Configuración → Pixeles
Asegúrate de que usas: 1142678136915324
```

### Error: "Requires ads_manage permission"
```
Significa: El token no tiene permisos suficientes
Solución: Genera un nuevo token con permisos ads_read y ads_manage
```

### No veo ningún log en la consola
```
Significa: El módulo no se cargó
Solución: Recarga la página con Ctrl+R
```

---

## 📞 Información de Soporte

Cuando reportes un problema, incluye:

1. **Screenshot de la consola** (F12 → Console)
2. **Output de:** `facebookStatus()`
3. **Output de:** `testFacebookEvent()`
4. **Error específico** que ves

---

## 🎓 Documentación Completa

Archivos incluidos:

| Archivo | Para Qué |
|---------|----------|
| `LEEME_PRIMERO_FACEBOOK.md` | Este documento (solución rápida) |
| `FACEBOOK_CONFIG.md` | Configuración inicial y conceptos |
| `VERIFICACION_FACEBOOK.md` | Paso a paso de verificación |
| `USAR_DEBUG_TOOLS.md` | Cómo usar herramientas de debug |
| `FACEBOOK_DEBUGGING.md` | Troubleshooting avanzado |
| `/js/facebook-conversions.js` | Módulo principal |
| `/js/facebook-debug.js` | Herramientas de debug |

---

## 🚀 Próximos Pasos (Una Vez Todo Funcione)

Después de verificar que el sistema funciona:

1. ✅ Realiza pruebas con varios teléfonos
2. ✅ Verifica que los eventos llegan a Facebook dentro de 1-2 minutos
3. ✅ En Facebook Ads Manager, crea una audiencia personalizada basada en compras
4. ⏳ Considera migrar el envío a backend para mayor seguridad (futuro)

---

## 💡 Resumen

**TL;DR (Muy Resumido):**

1. Tu Access Token probablemente expiró
2. Genera uno nuevo en Facebook Developer Dashboard
3. Reemplázalo en `/js/facebook-conversions.js` línea 16
4. Recarga tu sitio
5. En consola, ejecuta: `testFacebookEvent()`
6. Deberías ver ✅ EVENTO ENVIADO CORRECTAMENTE
7. Verifica en Facebook Events Manager

¿Necesitas más ayuda? Consulta los otros documentos de debugging.

---

**Última actualización:** 2026-01-19
**Status:** Sistema listo, requiere validación de credenciales
