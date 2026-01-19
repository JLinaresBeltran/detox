# Herramientas de Debug para Facebook Conversions API

## 📚 Descripción

Incluyo herramientas de debugging JavaScript que te ayudan a identificar exactamente por qué el evento no llega a Facebook.

---

## 🚀 Cómo Usar

### Opción 1: Usar las Herramientas Directamente (Recomendado)

**PASO 1**: Abre tu sitio web
**PASO 2**: Presiona F12 (abre Developer Tools)
**PASO 3**: Ve a la pestaña **Console**
**PASO 4**: Ejecuta uno de estos comandos:

#### A. Test Completo
```javascript
testFacebookEvent()
```

Este comando hace lo siguiente:
1. Verifica que el módulo está cargado
2. Verifica credenciales (Pixel ID y Access Token)
3. Verifica que SubtleCrypto está disponible
4. Envía un evento de prueba a Facebook
5. Te muestra el resultado

**Resultado esperado:**
```
✅ EVENTO ENVIADO CORRECTAMENTE
📱 Próximo paso: Ve a Facebook Events Manager y busca el evento "Purchase"
```

---

#### B. Ver el Payload del Evento
```javascript
showEventPayload()
```

Este comando te muestra exactamente qué datos se envían a Facebook.

**Resultado esperado:**
```
=== PAYLOAD DEL EVENTO ===

event_name: "Purchase"
event_time: 1705689637
action_source: "website"
user_data: {ph: Array(1), em: Array(1), fn: Array(1)}
custom_data: {...}
```

---

#### C. Ver el Status Actual
```javascript
facebookStatus()
```

Este comando muestra:
- Si el módulo está cargado
- Credenciales configuradas
- Estado del navegador (SubtleCrypto, Fetch, etc.)
- Comandos disponibles

**Resultado esperado:**
```
=== FACEBOOK CONVERSIONS API - STATUS ===

📋 Módulo:
  Cargado: ✅

🔐 Credenciales:
  Pixel ID: 1142678136915324
  Token: EAASfnFwPqrIBQT...
  API Version: v19.0

⚙️  Navegador:
  SubtleCrypto: ✅
  TextEncoder: ✅
  Fetch API: ✅
```

---

#### D. Monitorear Todas las Requests (Avanzado)
```javascript
monitorFacebookRequests()
```

Este comando intercepta TODAS las requests que se envían a Facebook Graph API.

**Pasos:**
1. Ejecuta `monitorFacebookRequests()` en consola
2. Verás: `✅ Monitoreo activo. Ahora completa el formulario.`
3. Completa el formulario de compra
4. En consola verás cada request y response detallada

**Resultado esperado:**
```
📤 REQUEST A FACEBOOK DETECTADO
URL: https://graph.facebook.com/v19.0/1142678136915324/events?[PARAMS]
Método: POST
Body: { data: [ { event_name: 'Purchase', ... } ] }

📥 RESPUESTA DE FACEBOOK
Status: 200 ✅
Respuesta: { events_received: 1 }
```

Para detener el monitoreo:
```javascript
stopMonitoringFacebookRequests()
```

---

## 🔍 Guía Paso a Paso de Debugging

### Escenario 1: Evento No Se Envía (No ves logs)

```javascript
// Paso 1: Verifica status
facebookStatus()

// Si ves "❌ No definido" en credenciales:
// → El Pixel ID o Token no está configurado
// → Ve a: /js/facebook-conversions.js línea 15-16
// → Reemplaza con valores reales

// Paso 2: Intenta enviar manualmente
testFacebookEvent()

// Paso 3: Si sigue sin enviar, verifica el payload
showEventPayload()
```

---

### Escenario 2: Evento Se Envía pero No Llega a Facebook

```javascript
// Paso 1: Haz test
testFacebookEvent()

// Deberías ver: "✅ EVENTO ENVIADO CORRECTAMENTE"

// Paso 2: Monitorea requests
monitorFacebookRequests()

// Paso 3: Completa el formulario

// Paso 4: Revisa la consola
// Si ves: "Status: 401" → Token expirado
// Si ves: "Status: 404" → Pixel ID incorrecto
// Si ves: "Status: 200" → Evento sí llegó a Facebook
```

---

### Escenario 3: Error Específico en Consola

#### Error: "Invalid OAuth access token"
```
Causa: Access Token expiró o es incorrecto

Solución:
1. Ve a https://developers.facebook.com/apps
2. Selecciona tu app
3. Ve a Herramientas → Explorador de Graph API
4. Copia el nuevo token
5. Edita /js/facebook-conversions.js línea 16
6. Reemplaza FACEBOOK_ACCESS_TOKEN
7. Recarga la página
```

#### Error: "Pixel not found"
```
Causa: Pixel ID incorrecto

Solución:
1. Ve a https://business.facebook.com/latest/ads_manager
2. Haz click en Configuración (esquina inferior izquierda)
3. Ve a Pixeles
4. Copia exactamente tu Pixel ID
5. Edita /js/facebook-conversions.js línea 15
6. Reemplaza FACEBOOK_PIXEL_ID
7. Recarga la página
```

#### Error: "Requires ads_manage permission"
```
Causa: Token sin permisos suficientes

Solución:
1. Genera un nuevo token con permisos: ads_read y ads_manage
2. Reemplaza en /js/facebook-conversions.js línea 16
3. Recarga la página
```

---

## 📋 Checklist de Debugging

Usa este checklist para identificar el problema:

```
□ Abrí F12 y fui a Console
□ Ejecuté: facebookStatus()
□ Vi que Pixel ID está configurado
□ Vi que Token está configurado
□ Vi que SubtleCrypto está disponible
□ Completé el formulario de compra
□ Ejecuté: testFacebookEvent()
□ Vi "✅ EVENTO ENVIADO CORRECTAMENTE"
□ Esperé 2 minutos
□ Fui a Facebook Events Manager
□ Vi el evento "Purchase" en Eventos recientes
□ Si todo ✅: El sistema funciona correctamente
□ Si algo ❌: Revisa el error específico arriba
```

---

## 🛠️ Casos de Uso de Each Tool

### `testFacebookEvent()`
**Cuándo usar:** Cuando quieres hacer una prueba rápida
**Resultado:** Simula todo el flujo de compra y envío a Facebook
**Tiempo:** ~2-3 segundos

### `facebookStatus()`
**Cuándo usar:** Cuando no sabes qué está mal
**Resultado:** Diagnóstico rápido de configuración
**Tiempo:** Inmediato

### `showEventPayload()`
**Cuándo usar:** Cuando quieres ver exactamente qué se envía
**Resultado:** JSON formateado del evento
**Tiempo:** Inmediato

### `monitorFacebookRequests()`
**Cuándo usar:** Cuando necesitas ver cada request/response
**Resultado:** Logs detallados de comunicación
**Tiempo:** Mientras se ejecutan las requests

---

## 💡 Tips Útiles

### Copy to Clipboard (Copiar logs)
En la consola, haz click derecho en un log y selecciona "Copy Object" o "Copy Value"

### Clear Console
Ejecuta en consola:
```javascript
console.clear()
```

### Multiple Tests
Puedes hacer varios tests seguidos:
```javascript
facebookStatus()
testFacebookEvent()
showEventPayload()
```

### Refrescar Todo
Si algo se ve raro:
```javascript
location.reload()  // Recarga la página
```

---

## 📱 Móvil / Tablet

Si usas móvil:

1. **iPhone/iPad:**
   - Safari → Menú (⋯) → Desarrollador → Consola

2. **Android:**
   - Chrome → ⋯ → Más herramientas → Herramientas para desarrolladores

3. **En ambos, luego:**
   - Copia y pega los comandos en Console
   - El resultado aparecerá en la consola del navegador

---

## 🔐 Seguridad

### Los comandos de debug hacen lo siguiente:
✅ Pueden ver tu Pixel ID (es público)
❌ NO exponen tu Access Token completo (solo primeros 30 caracteres)
✅ Realizan requests reales a Facebook
✅ Logs informativos (sin datos sensibles)

### No ejecutes estos comandos:
❌ En un navegador de terceros
❌ Si no confías en la fuente
❌ En dispositivos públicos con datos sensibles

---

## 📞 Reporte de Errores

Si después de todo esto sigue sin funcionar, reporta con:

1. Output de `facebookStatus()`
2. Output de `testFacebookEvent()`
3. Errores específicos que ves
4. Screenshot de la consola

Copia esto en tu editor de texto para reportar:

```
=== REPORTE DE ERROR ===

1. Status:
[Pega aquí el output de facebookStatus()]

2. Test:
[Pega aquí el output de testFacebookEvent()]

3. Error específico:
[Describe el error que ves]

4. Timestamp:
[Escribe la hora del test]
```

---

## 📚 Referencia Rápida

| Comando | Para Qué | Resultado |
|---------|----------|-----------|
| `facebookStatus()` | Ver estado | Reporte completo |
| `testFacebookEvent()` | Probar evento | ✅ o ❌ |
| `showEventPayload()` | Ver JSON | Estructura del evento |
| `monitorFacebookRequests()` | Ver requests | Request/response logs |

---

## ✅ Cuando TODO Funciona

Después de ejecutar `testFacebookEvent()` deberías ver:

```
✅ EVENTO ENVIADO CORRECTAMENTE
📱 Próximo paso: Ve a Facebook Events Manager y busca el evento "Purchase"
🔗 https://business.facebook.com/latest/events_manager
```

Luego:
1. Abre Facebook Events Manager
2. Busca tu Pixel (1142678136915324)
3. En "Últimos eventos" ve el evento "Purchase"
4. ✅ Todo funciona

---

¡Espero que estos tools te ayuden! Si tienes preguntas, revisa la documentación en FACEBOOK_DEBUGGING.md o VERIFICACION_FACEBOOK.md
