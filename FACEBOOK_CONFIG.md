# Configuración de Facebook Conversions API

## Resumen de la Integración

Se ha integrado Facebook Conversions API al flujo de compra de Detox-2. Cuando un usuario completa una compra (después de enviar a Getform), se enviará un evento de **Purchase** a Facebook automáticamente.

---

## Pasos de Configuración

### 1. Obtener el Pixel ID

1. Ve a [Facebook Ads Manager](https://business.facebook.com/latest/ads_manager)
2. Navega a **Configuración** → **Pixeles**
3. Copia tu **Pixel ID** (ej: `1234567890`)

### 2. Crear un Access Token para Conversions API

1. Ve a [Facebook App Dashboard](https://developers.facebook.com/apps)
2. Selecciona tu aplicación (o crea una nueva)
3. En el menú izquierdo, ve a **Herramientas** → **Explorador de Graph API**
4. Selecciona **HTTP POST** y copia el token de acceso actual
5. **Importante**: Genera un token de larga duración desde **Configuración** → **Tokens de acceso** para mayor seguridad

### 3. Configurar las Credenciales

Abre el archivo `js/facebook-conversions.js` y reemplaza estas líneas:

```javascript
const FACEBOOK_PIXEL_ID = 'YOUR_PIXEL_ID_HERE';
const FACEBOOK_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE';
```

Ejemplo:
```javascript
const FACEBOOK_PIXEL_ID = '1234567890';
const FACEBOOK_ACCESS_TOKEN = 'EAABsZ...xzZ';
```

---

## Estructura del Evento Enviado

Cuando un usuario completa una compra, se envía un evento con esta estructura:

```json
{
  "event_name": "Purchase",
  "event_time": 1705689637,
  "action_source": "website",
  "user_data": {
    "ph": ["hash_sha256_del_teléfono"],
    "em": ["hash_sha256_del_email"],
    "fn": ["hash_sha256_del_nombre"]
  },
  "custom_data": {
    "currency": "COP",
    "value": "90000",
    "content_name": "Kit Detox 4 Días",
    "content_ids": ["1"],
    "num_items": 1
  }
}
```

### Detalles:
- **event_name**: "Purchase" (evento de compra)
- **event_time**: Timestamp Unix (segundos)
- **action_source**: "website" (origen del evento)
- **user_data.ph**: Hash SHA256 del teléfono (normalizado: solo números)
- **user_data.em**: Hash SHA256 del email (opcional)
- **user_data.fn**: Hash SHA256 del nombre (opcional)
- **currency**: "COP" (moneda)
- **value**: Precio en pesos colombianos (string)
- **content_name**: Nombre del producto
- **content_ids**: ID del paquete (1 o 2)
- **num_items**: Cantidad de unidades

---

## Productos Configurados

### Kit Individual (packageId: 1)
- **Nombre**: Kit Detox 4 Días
- **Precio**: $90.000 COP
- **Content ID**: "1"

### Kit Dúo (packageId: 2)
- **Nombre**: Plan Dúo: Reinicio Total
- **Precio**: $160.000 COP
- **Content ID**: "2"

---

## Cómo Probar la Integración

### 1. Usando la Consola del Navegador

```javascript
// Prueba enviar un evento manualmente
sendFacebookPurchaseEvent({
    phone: '3001234567',
    packageId: 1,
    email: 'usuario@ejemplo.com',
    firstName: 'María'
});
```

### 2. Completar un Formulario de Compra

1. Abre el sitio web en un navegador
2. Completa el formulario de compra
3. Abre la consola del navegador (F12 → Console)
4. Deberías ver un mensaje: `✅ Evento Purchase enviado correctamente a Facebook`

### 3. Verificar en Facebook Events Manager

1. Ve a [Facebook Events Manager](https://business.facebook.com/latest/events_manager)
2. Selecciona tu Pixel
3. En la sección **Últimos eventos**, deberías ver los eventos `Purchase` llegando en tiempo real

---

## Monitoreo y Debugging

### Mensajes de Consola

Abre la consola del navegador (F12 → Console) para ver:

| Mensaje | Significado |
|---------|------------|
| `✅ Hash SHA256 generado correctamente` | Hash del teléfono creado exitosamente |
| `📤 Enviando evento Purchase a Facebook...` | Evento en proceso de envío |
| `✅ Evento Purchase enviado correctamente a Facebook` | Evento enviado exitosamente |
| `⚠️ Credenciales de Facebook no configuradas` | Falta configurar Pixel ID o Access Token |
| `❌ Error al enviar evento a Facebook` | Error en la comunicación con Facebook |

### Notas Importantes

- ✅ Si hay error enviando a Facebook, **el usuario verá el modal de confirmación de todas formas**
- ✅ El flujo de compra no se ve afectado por errores de Facebook
- ✅ Los errores se registran en consola para debugging
- ✅ Los teléfonos se hashean con SHA256 antes de enviarse (privacidad)

---

## Seguridad

### Access Token Expuesto en Frontend

⚠️ **Limitación importante**: El Access Token está visible en el código JavaScript frontend.

**Recomendaciones de seguridad**:

1. **Usar un token con permisos limitados**: Crea un token solo para escribir eventos en Conversions API
2. **Considerar migración a backend**: En el futuro, migra el envío a un endpoint backend vía webhook de Getform
3. **Rotar tokens regularmente**: Cambia el token cada 60-90 días
4. **Monitorear uso**: Revisa los logs de acceso en Facebook Developer Dashboard

### Privacidad de Datos

- ✅ Los teléfonos, emails y nombres se hashean con SHA256 antes de enviarse
- ✅ Los datos hasheados no pueden ser revertidos
- ✅ Solo se envía el hash, no el valor original

---

## Troubleshooting

### El evento no llega a Facebook

1. **Verifica las credenciales**:
   - Abre la consola (F12 → Console)
   - Busca el mensaje `⚠️ Credenciales de Facebook no configuradas`
   - Si ves este mensaje, actualiza `FACEBOOK_PIXEL_ID` y `FACEBOOK_ACCESS_TOKEN`

2. **Verifica el Pixel ID**:
   - Copia directamente desde Facebook Ads Manager
   - Sin espacios ni caracteres adicionales

3. **Verifica el Access Token**:
   - Debe tener permiso `ads_read` y `ads_manage`
   - Si expiró, genera uno nuevo

### Error: "Invalid access token"

- El token expiró o es incorrecto
- Genera uno nuevo desde Facebook Developer Dashboard

### Error: "Pixel not found"

- El Pixel ID es incorrecto o el token no tiene acceso al pixel
- Verifica el ID en Facebook Ads Manager

---

## Archivos Modificados

### 1. `/js/facebook-conversions.js` (NUEVO)
- Módulo principal de Facebook Conversions API
- Contiene función `sendFacebookPurchaseEvent()`
- Implementa hashing SHA256 del teléfono

### 2. `/index.html` (MODIFICADO)
- Agregado script de Facebook Conversions API (línea 80-81)

### 3. `/js/form.js` (MODIFICADO)
- Modificada `submitFormIndividual()` (líneas 517-531)
- Modificada `submitFormDuo()` (líneas 571-585)
- Ambas llaman a `sendFacebookPurchaseEvent()` después de enviar a Getform

---

## API Reference

### sendFacebookPurchaseEvent(options)

**Parámetros:**
```javascript
{
  phone: string,           // REQUERIDO: Teléfono (ej: "3001234567")
  packageId: number,       // REQUERIDO: ID del paquete (1 o 2)
  email: string,           // OPCIONAL: Email del usuario
  firstName: string        // OPCIONAL: Nombre del usuario
}
```

**Retorna:**
```javascript
Promise<boolean>  // true si se envió exitosamente, false si hubo error
```

**Ejemplo de uso:**
```javascript
const success = await sendFacebookPurchaseEvent({
    phone: '3001234567',
    packageId: 1,
    email: 'maria@ejemplo.com',
    firstName: 'María'
});

if (success) {
    console.log('Evento enviado a Facebook');
}
```

---

## Próximos Pasos Recomendados

1. ✅ Configurar Pixel ID y Access Token
2. ✅ Probar con compras de prueba
3. ✅ Verificar eventos en Events Manager
4. ⏳ Considerar migración a backend para mayor seguridad
5. ⏳ Configurar conversiones personalizadas en Facebook Ads Manager

---

## Preguntas Frecuentes

**¿Qué pasa si Facebook no está configurado?**
- El módulo verificará las credenciales y registrará un warning
- El usuario verá el modal de confirmación de compra normalmente

**¿Los datos personales se envían a Facebook?**
- No, solo se envían hashes SHA256 (datos hasheados son irreversibles)

**¿Cuánto tiempo tarda en ver los eventos?**
- Deberían llegar en 1-2 minutos a Facebook Events Manager

**¿Se puede configurar desde el panel admin?**
- Actualmente no, se configura directamente en el código
- Se puede mejorar agregando un panel de administración

**¿Qué tan seguro es tener el token en el frontend?**
- Es una limitación conocida del enfoque frontend
- Se recomienda usar un token con permisos limitados
- Considera migración a backend en el futuro

---

## Soporte

Para más información:
- [Facebook Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Facebook Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [SubtleCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
