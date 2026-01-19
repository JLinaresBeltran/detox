# Guía de Debugging - Facebook Conversions API

## 🔍 Checklist de Verificación Rápida

Sigue estos pasos en orden para identificar el problema:

### 1️⃣ Verifica que las Credenciales Estén Configuradas

```javascript
// Abre la consola (F12 → Console) y ejecuta esto:
console.log('Pixel ID:', FACEBOOK_PIXEL_ID);
console.log('Access Token:', FACEBOOK_ACCESS_TOKEN?.substring(0, 20) + '...');
```

**Si ves:**
- `Pixel ID: YOUR_PIXEL_ID_HERE` → ❌ **No está configurado**
- `Access Token: YOUR_ACCESS_TOKEN_HERE` → ❌ **No está configurado**

**Solución:** Abre `/js/facebook-conversions.js` líneas 15-16 y reemplaza con valores reales.

---

### 2️⃣ Verifica que el Módulo se Cargó

```javascript
// Ejecuta en consola:
typeof sendFacebookPurchaseEvent
```

**Resultado esperado:** `"function"`

**Si ves:**
- `"undefined"` → ❌ El módulo no se cargó
- `"function"` → ✅ Está cargado correctamente

---

### 3️⃣ Prueba Manual el Envío del Evento

```javascript
// Ejecuta en consola (reemplaza con valores reales):
await sendFacebookPurchaseEvent({
    phone: '3001234567',
    packageId: 1,
    email: 'test@ejemplo.com',
    firstName: 'Test'
});
```

**Mira la consola para estos mensajes:**

| Mensaje | Significado |
|---------|------------|
| `✅ Hash SHA256 generado correctamente` | El teléfono se hashea bien |
| `📤 Enviando evento Purchase a Facebook...` | Se está intentando enviar |
| `✅ Evento Purchase enviado correctamente a Facebook` | ✅ **Éxito** - Llega a Facebook |
| `❌ Error al enviar evento a Facebook: 400` | Error en el request |
| `⚠️ Credenciales de Facebook no configuradas` | Credenciales no están configuradas |

---

## 🐛 Solución de Problemas por Error

### Error: "⚠️ Credenciales de Facebook no configuradas"

```
Causa: Las constantes tienen valores placeholder
```

**Solución:**
1. Abre `/js/facebook-conversions.js`
2. Ve a líneas 15-16
3. Reemplaza:
   ```javascript
   // ❌ INCORRECTO
   const FACEBOOK_PIXEL_ID = 'YOUR_PIXEL_ID_HERE';
   const FACEBOOK_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE';

   // ✅ CORRECTO
   const FACEBOOK_PIXEL_ID = '1234567890';
   const FACEBOOK_ACCESS_TOKEN = 'EAABsZ...xzZ';
   ```
4. Recarga la página

---

### Error: "❌ Error al enviar evento a Facebook: 400"

```
Causa: El formato del evento es incorrecto o faltan permisos
```

**Pasos para debuggear:**

1. Abre Herramientas de Desarrollo (F12)
2. Ve a la pestaña **Network**
3. Completa un formulario de compra
4. En Network, busca una solicitud POST a `graph.facebook.com`
5. Haz click en ella y ve a **Response**
6. Deberías ver el error de Facebook

**Errores comunes:**

```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```
→ El Access Token expiró o es incorrecto. Genera uno nuevo.

```json
{
  "error": {
    "message": "Pixel not found",
    "type": "Exception",
    "code": 100
  }
}
```
→ El Pixel ID es incorrecto o el token no tiene acceso. Verifica el ID.

---

### Error: "❌ Error al enviar evento a Facebook: 403"

```
Causa: El Access Token no tiene los permisos necesarios
```

**Solución:**
1. Ve a [Facebook Developer Dashboard](https://developers.facebook.com/apps)
2. Selecciona tu app
3. Ve a **Roles** → **Tokens de acceso**
4. Genera un nuevo token con permisos:
   - `ads_read`
   - `ads_manage`

---

### Error: "❌ Error al enviar evento a Facebook: 404"

```
Causa: La URL de la API es incorrecta o el endpoint cambió
```

**Verificación:**
La URL debe ser:
```
https://graph.facebook.com/v19.0/{PIXEL_ID}/events?access_token={TOKEN}
```

Esto ya está configurado correctamente en el módulo.

---

## 📊 Verificar en Facebook Events Manager

Después de completar una compra:

1. Ve a [Facebook Events Manager](https://business.facebook.com/latest/events_manager)
2. Selecciona tu Pixel
3. En **Eventos recientes**, deberías ver:
   - Evento: `Purchase`
   - Timestamp: Hace 1-2 minutos
   - Status: `Verified` o `Unverified`

**Si no ves nada:**
- El evento nunca llegó (problema de envío)
- El Pixel ID es incorrecto
- El evento se envió a otro Pixel

---

## 🔧 Herramienta de Debug Interactiva

Abre la consola y ejecuta esto para ver toda la información:

```javascript
// Crear función de debug
async function debugFacebook() {
    console.clear();
    console.log('=== FACEBOOK CONVERSIONS API - DEBUG ===\n');

    // Verificar módulo
    console.log('1. Módulo Cargado:', typeof sendFacebookPurchaseEvent === 'function' ? '✅' : '❌');

    // Verificar credenciales
    console.log('2. Pixel ID Configurado:', FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID_HERE' ? '✅' : '❌', FACEBOOK_PIXEL_ID);
    console.log('3. Access Token Configurado:', FACEBOOK_ACCESS_TOKEN !== 'YOUR_ACCESS_TOKEN_HERE' ? '✅' : '❌', FACEBOOK_ACCESS_TOKEN?.substring(0, 30) + '...');

    // Probar hash
    console.log('\n4. Probando Hash SHA256...');
    try {
        const testHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('3001234567'));
        console.log('   ✅ SHA256 disponible');
    } catch (e) {
        console.log('   ❌ SHA256 no disponible:', e.message);
    }

    // Probar evento
    console.log('\n5. Intentando enviar evento de prueba...');
    const result = await sendFacebookPurchaseEvent({
        phone: '3001234567',
        packageId: 1,
        email: 'debug@test.com'
    });
    console.log('   Resultado:', result ? '✅ Enviado' : '❌ Error');

    console.log('\n=== FIN DEBUG ===');
}

// Ejecutar
debugFacebook();
```

---

## 📝 Monitorear Todos los Eventos

Para ver **cada intento** de envío, abre la consola y ejecuta:

```javascript
// Interceptar logs de Facebook
const originalLog = console.log;
console.log = function(...args) {
    if (args[0]?.includes?.('Facebook') || args[0]?.includes?.('evento')) {
        originalLog('%c[FACEBOOK]', 'color: blue; font-weight: bold', ...args);
    }
    originalLog(...args);
};
```

Ahora todos los logs de Facebook tendrán un prefijo azul.

---

## 🌐 Verificar Conectividad

Si el evento no se envía en absoluto:

```javascript
// Probar conectividad a Facebook
async function testFacebookConnection() {
    try {
        const response = await fetch('https://graph.facebook.com/v19.0/me?access_token=test');
        console.log('Conectividad: ✅ OK');
    } catch (error) {
        console.log('Conectividad: ❌ Error', error.message);
    }
}

testFacebookConnection();
```

---

## 📋 Información para Reportar Problemas

Si el problema persiste, reúne esta información:

1. **Mensajes de consola exactos** (copia y pega)
2. **Pixel ID**: `console.log(FACEBOOK_PIXEL_ID)`
3. **Access Token primeros 30 caracteres**: `console.log(FACEBOOK_ACCESS_TOKEN?.substring(0, 30))`
4. **Módulo cargado**: `console.log(typeof sendFacebookPurchaseEvent)`
5. **Response del servidor**: (de Network → Facebook request → Response)
6. **¿El evento se ve en consola?**: Sí/No
7. **¿El evento llega a Facebook?**: Sí/No

---

## ✅ Checklist Final

Antes de contactar soporte:

- [ ] Configuré FACEBOOK_PIXEL_ID con valor real
- [ ] Configuré FACEBOOK_ACCESS_TOKEN con valor real
- [ ] Recargué la página (Ctrl+R o Cmd+R)
- [ ] Abrí la consola (F12 → Console)
- [ ] Completé un formulario de compra
- [ ] Vi el mensaje `✅ Evento Purchase enviado correctamente a Facebook` en consola
- [ ] Revisé Facebook Events Manager después de 2 minutos
- [ ] Usé la función `debugFacebook()` para verificar todo
