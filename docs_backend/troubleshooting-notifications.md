# 🔧 Troubleshooting - Flujo de Notificaciones

Guía completa para diagnosticar y solucionar problemas con el sistema de notificaciones automáticas.

## 📋 Índice

- [🔍 Diagnóstico Rápido](#-diagnóstico-rápido)
- [📊 Búsqueda de Logs](#-búsqueda-de-logs)
- [🚨 Problemas Comunes](#-problemas-comunes)
- [📱 Troubleshooting Telegram](#-troubleshooting-telegram)
- [📧 Troubleshooting Email](#-troubleshooting-email)
- [🔗 Troubleshooting Webhooks](#-troubleshooting-webhooks)
- [⚡ Soluciones Rápidas](#-soluciones-rápidas)

---

## 🔍 Diagnóstico Rápido

### ✅ Verificación del Estado Actual

**1. Revisar logs de inicio:**
```bash
# En Render.com o en tu servidor
grep "NotificationService.*Inicializando" logs/*.log
grep "Telegram notification channel initialized" logs/*.log
grep "Email.*configurado" logs/*.log
```

**Salida esperada:**
```
🔍 [NotificationService] Inicializando canales. ActiveChannels: email, telegram
✅ [NotificationService] Telegram notification channel initialized
Servicio de Email (gmail) configurado para enviar desde laivetta@gmail.com
```

**2. Verificar que lleguen webhooks:**
```bash
grep "Webhook recibido" logs/*.log
```

**3. Verificar pagos aprobados:**
```bash
grep "PAGO APROBADO DETECTADO" logs/*.log
```

---

## 📊 Búsqueda de Logs

### 🔖 Por Trace ID

Cada webhook tiene un ID único. Para seguir un pago específico:

```bash
# Buscar por trace ID
grep "webhook-1720223845123-k7m9p2x" logs/*.log

# Buscar por ID de pago de MercadoPago
grep "paymentId.*12345678901" logs/*.log

# Buscar por ID de orden
grep "orderId.*ORD123456789" logs/*.log
```

### 📅 Por Fecha/Hora

```bash
# Logs de hoy con pagos aprobados
grep "$(date +%Y-%m-%d)" logs/*.log | grep "PAGO APROBADO"

# Logs de una hora específica
grep "2025-07-05T20:" logs/*.log | grep "NOTIFICACIÓN"
```

### 🔄 Flujo Completo

Para rastrear un pago específico desde webhook hasta notificación:

```bash
# 1. Encontrar el webhook
grep "paymentId.*12345678901" logs/*.log | grep "Webhook recibido"

# 2. Verificar si fue aprobado
grep "paymentId.*12345678901" logs/*.log | grep "PAGO APROBADO"

# 3. Verificar envío de notificaciones
grep "paymentId.*12345678901" logs/*.log | grep "sendOrderNotification"

# 4. Verificar finalización
grep "paymentId.*12345678901" logs/*.log | grep "NOTIFICACIÓN COMPLETADA"
```

---

## 🚨 Problemas Comunes

### ❌ **Problema: No se envían notificaciones**

**Diagnóstico:**
```bash
grep -A5 -B5 "PAGO APROBADO DETECTADO" logs/*.log
```

**Posibles causas:**
1. **Estado no es 'approved'**
2. **Order no encontrada**
3. **NotificationService no disponible**
4. **Error en datos de notificación**

### ❌ **Problema: Webhook no llega**

**Diagnóstico:**
```bash
# Verificar si el endpoint recibe requests
grep "POST /api/payments/webhook" logs/*.log

# Verificar configuración de MercadoPago
grep "URL_RESPONSE_WEBHOOK" logs/*.log
```

**Solución:**
- Verificar URL del webhook en MercadoPago
- Comprobar que el dominio sea accesible públicamente

### ❌ **Problema: Telegram falla, Email funciona**

**Diagnóstico:**
```bash
grep "TelegramAdapter.*error" logs/*.log
grep "EMAIL.*enviado" logs/*.log
```

**Posibles causas:**
1. **Token inválido**
2. **Chat ID incorrecto**
3. **Bot bloqueado**

### ❌ **Problema: Email falla, Telegram funciona**

**Diagnóstico:**
```bash
grep "EMAIL.*error" logs/*.log
grep "SMTP.*error" logs/*.log
grep "TelegramAdapter.*enviado" logs/*.log
```

**Posibles causas:**
1. **App Password incorrecto**
2. **Cuenta Gmail bloqueada**
3. **2FA no configurado**

---

## 📱 Troubleshooting Telegram

### 🔧 Verificación del Bot

**1. Verificar que el bot esté activo:**
```bash
curl "https://api.telegram.org/bot7905392744:AAHVobZq3mQtSOW41xd8js7RJSg2aOOl9Tk/getMe"
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "result": {
    "id": 7905392744,
    "is_bot": true,
    "first_name": "Tu Bot",
    "username": "tu_bot_username"
  }
}
```

**2. Verificar configuración en logs:**
```bash
grep "TelegramAdapter.*Constructor" logs/*.log
```

**Salida esperada:**
```json
{
  "botTokenPresent": true,
  "botTokenLength": 46,
  "chatIdPresent": true,
  "chatId": "736207422"
}
```

### 🔧 Test Manual

```bash
# Enviar mensaje de prueba
curl -X POST "https://api.telegram.org/bot7905392744:AAHVobZq3mQtSOW41xd8js7RJSg2aOOl9Tk/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "736207422",
    "text": "🔧 Test desde troubleshooting"
  }'
```

### 🚨 Errores Comunes de Telegram

| Error | Causa | Solución |
|-------|-------|-----------|
| `400 Bad Request` | Token inválido | Verificar `TELEGRAM_BOT_TOKEN` |
| `400 chat not found` | Chat ID incorrecto | Verificar `TELEGRAM_CHAT_ID` |
| `403 Forbidden` | Bot bloqueado/removido | Re-agregar bot al chat |
| `429 Too Many Requests` | Rate limiting | Esperar y reintentar |

---

## 📧 Troubleshooting Email

### 🔧 Verificación SMTP

**En logs de inicio buscar:**
```bash
grep "Conexión SMTP verificada" logs/*.log
```

**Si falla:**
```bash
grep "SMTP.*error" logs/*.log
```

### 🔧 Test Manual Gmail

```bash
# Verificar credenciales
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'laivetta@gmail.com',
    pass: 'tu-app-password'
  }
});
transporter.verify((error, success) => {
  if (error) console.log('ERROR:', error);
  else console.log('✅ SMTP OK');
});
"
```

### 🚨 Errores Comunes de Email

| Error | Causa | Solución |
|-------|-------|-----------|
| `535 Authentication failed` | App password incorrecto | Regenerar app password |
| `534 Please log in via web` | 2FA no habilitado | Habilitar 2FA en Gmail |
| `550 Access denied` | Cuenta suspendida | Revisar estado de cuenta |
| `Connection timeout` | Firewall/red | Verificar conectividad |

---

## 🔗 Troubleshooting Webhooks

### 🔧 Verificar Recepción

```bash
# Webhooks recibidos hoy
grep "$(date +%Y-%m-%d)" logs/*.log | grep "Webhook recibido"

# Verificar formato
grep "topic.*payment" logs/*.log
grep "data.*id" logs/*.log
```

### 🔧 Verificar Procesamiento

```bash
# Consultas a MercadoPago
grep "Consultando pago en MercadoPago" logs/*.log

# Estados recibidos
grep "Información del pago MP" logs/*.log

# Pagos encontrados localmente
grep "Pago encontrado en DB" logs/*.log
```

### 🚨 Problemas de Webhook

| Problema | Diagnóstico | Solución |
|----------|-------------|-----------|
| No llegan webhooks | URL incorrecta en MP | Verificar configuración |
| Webhooks duplicados | Logs de "duplicado" | Normal, se ignoran |
| Pago no encontrado | "no encontrado en DB" | Verificar external_reference |
| Estado no aprobado | Status diferente | Normal para otros estados |

---

## ⚡ Soluciones Rápidas

### 🔄 Reiniciar Servicios

```bash
# En desarrollo
npm run dev

# En producción (Render se reinicia automáticamente)
# Hacer push de un cambio pequeño
```

### 🔧 Verificar Variables

```bash
# Verificar que estén configuradas
grep "Environment variables loaded" logs/*.log
grep "Configuration.*hasTelegramToken.*true" logs/*.log
```

### 📝 Logs en Tiempo Real

```bash
# En tu servidor/Render
tail -f logs/combined-*.log | grep -E "(PAGO APROBADO|NOTIFICACIÓN|ERROR)"
```

### 🧪 Test de Notificación Manual

Si necesitas probar manualmente:

```bash
# Llamar directamente al endpoint (requiere auth)
curl -X POST "https://tu-backend.onrender.com/api/admin/notifications/test" \
  -H "Authorization: Bearer tu-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST123",
    "customerName": "Test User",
    "total": 1000,
    "items": [{"name": "Test", "quantity": 1, "price": 1000}]
  }'
```

---

## 🔍 Checklist de Diagnóstico

Para problemas de notificaciones, verificar en orden:

- [ ] **Logs de inicio** - NotificationService inicializado
- [ ] **Variables de entorno** - Telegram y Email configurados
- [ ] **Webhook recibido** - MercadoPago envía correctamente
- [ ] **Estado approved** - Pago realmente aprobado
- [ ] **Orden encontrada** - external_reference correcto
- [ ] **Datos válidos** - orderId, customerName, total presentes
- [ ] **Servicios disponibles** - Email y Telegram funcionando
- [ ] **Logs de envío** - Notificaciones procesadas
- [ ] **Logs de finalización** - Proceso completado

**🎯 Con este flujo de diagnóstico puedes identificar exactamente dónde está fallando el sistema de notificaciones.**
