# Verificación y Solución de Problemas - Facebook Events

## 🔴 Problema: El evento no se detecta en Facebook

Sigue estos pasos **en orden exacto**:

---

## PASO 1: Verifica que el Módulo de Facebook Está Cargado

1. Abre tu sitio web en navegador
2. Presiona **F12** (abre Herramientas de Desarrollador)
3. Ve a la pestaña **Console**
4. Deberías ver estos mensajes al cargar:
   ```
   [FB-DEBUG] === FACEBOOK CONVERSIONS API ===
   [FB-DEBUG] Módulo cargado
   [FB-DEBUG] Credenciales: { pixelConfigured: true, tokenConfigured: true, apiVersion: 'v19.0' }
   ```

**Si NO ves estos mensajes:**
- El módulo no se cargó
- Verifica que `/js/facebook-conversions.js` existe
- Verifica que el script está en `index.html` (línea 80-81)
- Recarga la página (Ctrl+R)

**Si VES los mensajes:**
- ✅ El módulo está cargado correctamente
- Continúa al PASO 2

---

## PASO 2: Completa un Formulario de Compra

1. En tu navegador, completa el formulario de compra (Kit Individual o Dúo)
2. Usa estos datos de prueba:
   ```
   Nombre: Test User
   Teléfono: 300 123 4567
   Email: test@test.com
   Departamento: Cundinamarca
   Ciudad: Bogotá
   Dirección: Calle 1 # 1-1
   ```
3. Haz click en **COMPRAR AHORA**

---

## PASO 3: Verifica los Logs en la Consola

Después de enviar el formulario, deberías ver en la consola:

### ✅ Si TODO está bien:
```
[FB-DEBUG] === INICIANDO ENVÍO DE EVENTO PURCHASE ===
[FB-DEBUG] Credenciales configuradas Pixel: 1142678136915324
[FB-DEBUG] Opciones validadas { phone: '3001234567', packageId: 1 }
[FB-DEBUG] Producto encontrado { name: 'Kit Detox 4 Días', price: 90000, contentId: '1' }
[FB-DEBUG] Hash SHA256 generado Entrada: 3001234567, Hash: a1b2c3d4e5f6...
[FB-DEBUG] Payload del evento construido { event_name: 'Purchase', event_time: 1705689637, ... }
[FB-DEBUG] URL del endpoint https://graph.facebook.com/v19.0/1142678136915324/events?access_token=[TOKEN_HIDDEN]
[FB-DEBUG] Enviando request POST a Facebook...
[FB-DEBUG] Respuesta recibida Status: 200 OK
✅ Evento Purchase enviado correctamente a Facebook { events_received: 1 }
[FB-DEBUG] === EVENTO ENVIADO EXITOSAMENTE ===
```

Si ves esto → **El evento se envió a Facebook correctamente** ✅

---

## PASO 4: Verifica en Facebook Events Manager

1. Abre [Facebook Events Manager](https://business.facebook.com/latest/events_manager)
2. Selecciona tu Pixel ID: **1142678136915324**
3. En la sección **Eventos recientes**, deberías ver:
   - Evento: `Purchase`
   - Timestamp: Hace menos de 5 minutos
   - Status: `Unverified` o `Verified`

**Si VES el evento:**
- ✅ **TODO FUNCIONA CORRECTAMENTE**
- Espera 24 horas para que Facebook lo procese completamente

**Si NO ves el evento:**
- Continúa al PASO 5 (debugging de errores)

---

## PASO 5: Debugging de Errores

Si algo no funciona, mira los errores en consola:

### Error: "❌ Error HTTP 400"

```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

**Solución:**
- El Access Token **expiró** o es **incorrecto**
- Ve a [Facebook Developer Dashboard](https://developers.facebook.com/apps)
- Selecciona tu app
- Ve a **Herramientas** → **Explorador de Graph API**
- Copia un nuevo token de acceso
- Reemplaza en `/js/facebook-conversions.js` línea 16

---

### Error: "❌ Error HTTP 403"

```json
{
  "error": {
    "message": "Requires ads_manage permission"
  }
}
```

**Solución:**
- El token no tiene permisos suficientes
- Genera uno nuevo con permisos: `ads_read`, `ads_manage`
- En Facebook Developer Dashboard → Tu App → Roles → Tokens de acceso

---

### Error: "❌ Error HTTP 404"

```json
{
  "error": {
    "message": "Pixel not found"
  }
}
```

**Solución:**
- El Pixel ID es incorrecto
- Verifica el ID en Facebook Ads Manager
- El ID correcto debe ser: **1142678136915324**
- Reemplaza en `/js/facebook-conversions.js` línea 15

---

### Error: "⚠️ Teléfono vacío"

El teléfono no se está pasando correctamente.

**Solución:**
- Verifica que el formulario tiene un campo de teléfono
- El teléfono debe estar en formato: 300 123 4567 o 3001234567

---

## PASO 6: Verifica en Network (Advanced)

Si los pasos anteriores no ayudan:

1. Abre Herramientas de Desarrollador (F12)
2. Ve a la pestaña **Network**
3. Filtra por `fetch` o `graph.facebook.com`
4. Completa el formulario de compra
5. En Network, busca una solicitud a `graph.facebook.com`
6. Haz click en ella
7. Ve a la pestaña **Response**
8. Copias el contenido y compártelo para debugging

---

## SOLUCIONES COMUNES

### El Access Token Expiró

**Síntoma:** Error "Invalid OAuth access token"

**Solución rápida:**
1. Ve a [Facebook App Dashboard](https://developers.facebook.com/apps)
2. Selecciona tu App
3. En **Herramientas** → **Explorador de Graph API**
4. Copia el token nuevo (en la esquina superior derecha)
5. Reemplaza en `/js/facebook-conversions.js` línea 16

---

### El Pixel ID es Incorrecto

**Síntoma:** Error "Pixel not found"

**Verificación:**
1. Ve a [Facebook Ads Manager](https://business.facebook.com/latest/ads_manager)
2. Haz click en **Configuración** (esquina inferior izquierda)
3. Ve a **Pixeles** en el menú izquierdo
4. Copia el Pixel ID exactamente
5. Reemplaza en `/js/facebook-conversions.js` línea 15

---

### El Evento Llega pero sin Valores

**Síntoma:** El evento llega a Facebook pero sin datos de usuario

**Causa probable:** Los hashes SHA256 están vacíos

**Verificación:**
1. En consola, busca: `[FB-DEBUG] Hash SHA256 generado`
2. Verifica que el hash no está vacío
3. Si está vacío, verifica que el teléfono se pasa correctamente

---

## TEST MANUAL RÁPIDO

Abre la consola y ejecuta esto:

```javascript
// Test directo
await sendFacebookPurchaseEvent({
    phone: '3001234567',
    packageId: 1,
    email: 'test@test.com',
    firstName: 'Test'
});
```

Deberías ver todos los logs en secuencia.

---

## PROBLEMA IDENTIFICADO: POSIBLE TOKEN EXPIRADO

Veo que el Access Token fue colocado hace poco en el código.

**⚠️ Es muy probable que haya expirado.**

**Solución inmediata:**

1. Ve a [Facebook Developer Dashboard](https://developers.facebook.com/apps)
2. Busca tu aplicación
3. En el menú, ve a **Herramientas** → **Explorador de Graph API**
4. En la esquina superior derecha, donde dice el token actual
5. Haz click en él y selecciona **Obtener nuevos tokens de acceso**
6. O ve a **Configuración** → **Tokens de acceso** → Genera uno nuevo
7. Cópialo (debe empezar con `EAAS...`)
8. Abre `/js/facebook-conversions.js` línea 16
9. Reemplaza completamente el valor de `FACEBOOK_ACCESS_TOKEN`
10. Recarga tu navegador
11. Intenta completar la compra de nuevo

---

## CHECKLIST DE VERIFICACIÓN FINAL

Antes de reportar problema:

- [ ] Abrí F12 → Console
- [ ] Vi `[FB-DEBUG] === FACEBOOK CONVERSIONS API ===`
- [ ] Completé el formulario de compra
- [ ] Vi `✅ Evento Purchase enviado correctamente a Facebook`
- [ ] Esperé 2 minutos
- [ ] Abrí Facebook Events Manager
- [ ] Seleccioné el Pixel **1142678136915324**
- [ ] Busqué evento "Purchase" en Eventos recientes
- [ ] Si no está: Regené un nuevo Access Token
- [ ] Si sigue sin estar: Revisé Network tab para ver el error

---

## INFORMACIÓN PARA SOPORTE

Si después de todo esto sigue sin funcionar, reporta con:

1. **Screenshot de la consola** mostrando todos los logs
2. **Error exacto** del Response en Network tab
3. **Pixel ID usado**: 1142678136915324
4. **Fecha y hora del test**
5. **Teléfono usado en el test**
6. **Resultado en Events Manager** (¿evento visible o no?)

---

## Documentación Útil

- [Facebook Conversions API Docs](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Facebook Events Manager](https://business.facebook.com/latest/events_manager)
- [Facebook Developer Dashboard](https://developers.facebook.com)
