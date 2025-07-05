# 📱 Sistema de Notificaciones por Telegram

## 📋 Índice

- [🔧 Configuración](#-configuración)
- [🤖 Bot de Telegram](#-bot-de-telegram)
- [📬 Tipos de Notificaciones](#-tipos-de-notificaciones)
- [🛠️ API Endpoints](#-api-endpoints)
- [📊 Monitoreo y Logs](#-monitoreo-y-logs)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_ADMIN_CHAT_ID=-1234567890
TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### 🤖 Crear Bot de Telegram

1. **Hablar con @BotFather** en Telegram
2. **Crear nuevo bot:**
   ```
   /newbot
   Nombre: Mi E-commerce Bot
   Username: mi_ecommerce_bot
   ```
3. **Obtener token** y configurar en `TELEGRAM_BOT_TOKEN`
4. **Obtener Chat ID** del grupo/canal admin

### 📋 Obtener Chat ID

```javascript
// Método 1: Agregar bot al grupo y enviar mensaje
// Luego consultar: https://api.telegram.org/bot<TOKEN>/getUpdates

// Método 2: Usar endpoint del sistema
GET /api/admin/telegram/chat-info
```

---

## 🤖 Bot de Telegram

## 🎯 Flujo de Notificaciones de Pedidos

### ⚡ Momento Exacto de Envío

Las notificaciones de Telegram para pedidos siguen este flujo preciso:

1. **🛒 Cliente crea orden** → ❌ **NO se envía Telegram** (solo se crea la orden)
2. **💳 Cliente va a pagar** → ❌ **NO se envía Telegram** (redirection a MercadoPago)
3. **🔄 MercadoPago procesa pago** → ❌ **NO se envía Telegram** (esperando confirmación)
4. **✅ Webhook: pago = "approved"** → **🚀 SÍ SE ENVÍA TELEGRAM** (pago confirmado)

### 🔒 ¿Por qué este flujo?

- **Evita spam**: No notifica por órdenes que nunca se pagan
- **Garantiza veracidad**: Solo notifica pagos realmente confirmados
- **Mejora confiabilidad**: Usa el webhook oficial de MercadoPago
- **Previene duplicados**: Control automático de idempotencia

### 🎯 Funcionalidades del Bot

- **📦 Notificaciones de Pedidos** - Nuevos pedidos en tiempo real
- **💳 Alertas de Pagos** - Confirmaciones y fallos de pago
- **⚠️ Alertas de Sistema** - Errores críticos y eventos importantes
- **📊 Reportes** - Estadísticas diarias/semanales
- **🔧 Comandos Admin** - Gestión básica desde Telegram

### 📱 Comandos Disponibles

| Comando | Descripción | Acceso |
|---------|-------------|--------|
| `/start` | Inicializar bot | Todos |
| `/help` | Mostrar ayuda | Todos |
| `/stats` | Estadísticas del día | Admin |
| `/orders` | Pedidos recientes | Admin |
| `/status` | Estado del sistema | Admin |
| `/alerts` | Configurar alertas | Admin |

---

## 📬 Tipos de Notificaciones

### 🛒 Notificaciones de Pedidos

#### � Pedido Pagado (Pago Aprobado)

**⚡ MOMENTO DE ENVÍO:** Cuando MercadoPago confirma el pago como "approved" vía webhook

```
💰 PAGO CONFIRMADO - NUEVO PEDIDO #1234

✅ Pago aprobado por MercadoPago
👤 Cliente: Juan Pérez
📧 Email: juan@email.com
� Total: $2,500.00
📦 Items: 3 productos

🏠 Dirección:
Av. Corrientes 1234
Villa Crespo, CABA

🔗 ID Pago MP: 123456789
⏰ 15/01/2025 - 10:32 AM

[Ver Pedido] [Procesar]
```

#### ✅ Pedido Confirmado (Estados posteriores)

```
✅ PEDIDO ACTUALIZADO #1234

Estado: En preparación
Tiempo estimado: 30-45 min

[Ver Pedido] [Cambiar Estado]
```

### 💳 Notificaciones de Pagos

#### 💰 Pago Aprobado

```
💰 PAGO RECIBIDO

💳 Monto: $2,500.00
🆔 MP ID: 123456789
📋 Pedido: #1234
👤 Cliente: Juan Pérez

✅ Estado: Aprobado
⏰ 15/01/2025 - 10:32 AM

[Ver Detalles]
```

#### ❌ Pago Rechazado

```
❌ PAGO RECHAZADO

💳 Monto: $2,500.00
📋 Pedido: #1234
👤 Cliente: Juan Pérez

❌ Motivo: Tarjeta sin fondos
⏰ 15/01/2025 - 10:35 AM

[Revisar] [Contactar Cliente]
```

### ⚠️ Alertas de Sistema

#### 🚨 Error Crítico

```
🚨 ERROR CRÍTICO

🔧 Sistema: Base de Datos
📝 Error: Connection timeout
⏰ 15/01/2025 - 10:40 AM

[Ver Logs] [Revisar Sistema]
```

#### 📉 Stock Bajo

```
📉 STOCK BAJO

📦 Producto: Pizza Margherita
📊 Stock actual: 2 unidades
⚠️ Límite mínimo: 5 unidades

[Actualizar Stock] [Ver Producto]
```

### 📊 Reportes Automáticos

#### 📈 Resumen Diario

```
📈 RESUMEN DEL DÍA
📅 15/01/2025

📦 Pedidos: 25 (+15%)
💰 Ventas: $45,500 (+20%)
👥 Clientes: 23 (3 nuevos)
📱 Pagos MP: 22 exitosos, 1 fallido

[Ver Detalle] [Exportar]
```

---

## 🛠️ API Endpoints

### 📱 Gestión de Notificaciones

#### 📤 Enviar Notificación Manual

```http
POST /api/admin/telegram/send-notification
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "message": "🎉 ¡Nueva promoción disponible!",
  "chatId": "-1234567890",
  "parseMode": "HTML",
  "disablePreview": true
}
```

#### 📊 Enviar Reporte

```http
POST /api/admin/telegram/send-report
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "type": "daily",
  "date": "2025-01-15"
}
```

#### ⚙️ Configurar Alertas

```http
POST /api/admin/telegram/configure-alerts
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "newOrders": true,
  "paymentUpdates": true,
  "systemErrors": true,
  "stockAlerts": true,
  "dailyReports": true,
  "reportTime": "09:00"
}
```

### 📋 Información del Bot

#### 🤖 Estado del Bot

```http
GET /api/admin/telegram/bot-info
Authorization: Bearer <admin-jwt-token>
```

**Respuesta:**
```json
{
  "botInfo": {
    "id": 123456789,
    "username": "mi_ecommerce_bot",
    "firstName": "Mi E-commerce Bot",
    "canJoinGroups": true,
    "canReadAllGroupMessages": false
  },
  "status": "active",
  "chatId": "-1234567890",
  "lastMessage": "2025-01-15T10:30:00Z"
}
```

#### 📊 Estadísticas de Mensajes

```http
GET /api/admin/telegram/message-stats
Authorization: Bearer <admin-jwt-token>
```

**Respuesta:**
```json
{
  "today": {
    "sent": 15,
    "failed": 0,
    "types": {
      "newOrders": 8,
      "payments": 5,
      "alerts": 2
    }
  },
  "week": {
    "sent": 125,
    "failed": 3,
    "averagePerDay": 17.9
  }
}
```

---

## 📊 Monitoreo y Logs

### 📝 Sistema de Logging

```typescript
// Log de mensaje enviado
logger.info('Telegram message sent', {
  chatId: chatId,
  messageType: 'new_order',
  messageId: result.message_id,
  orderId: orderId
});

// Log de error
logger.error('Telegram message failed', {
  chatId: chatId,
  error: error.message,
  messageType: 'payment_notification'
});
```

### 🔍 Debugging

```bash
# Ver logs de Telegram
tail -f logs/combined-*.log | grep "telegram"

# Ver errores de bot
tail -f logs/error-*.log | grep "TelegramAdapter"
```

### 📈 Métricas Importantes

- **Tasa de entrega:** % de mensajes enviados exitosamente
- **Tiempo de respuesta:** Latencia de la API de Telegram
- **Tipos de mensaje:** Distribución por categoría
- **Errores:** Rate limits, chat no encontrado, bot bloqueado

---

## 🔧 Troubleshooting

### ❌ Problemas Comunes

#### 🔴 "Unauthorized" Error

**Causa:** Token de bot inválido
**Solución:**
1. Verificar `TELEGRAM_BOT_TOKEN` en `.env`
2. Regenerar token con @BotFather si necesario
3. Reiniciar aplicación

#### 🔴 "Chat not found"

**Causa:** `TELEGRAM_ADMIN_CHAT_ID` incorrecto
**Solución:**
1. Agregar bot al grupo/canal
2. Obtener chat ID correcto:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```
3. Actualizar variable de entorno

#### 🔴 "Too Many Requests"

**Causa:** Rate limiting de Telegram (30 mensajes/segundo)
**Solución:**
- Implementar cola de mensajes
- Agregar delays entre envíos
- Agrupar notificaciones similares

#### 🔴 Bot no responde comandos

**Causa:** Permisos o configuración del bot
**Solución:**
1. Verificar que el bot tenga permisos en el grupo
2. Configurar comandos con @BotFather:
   ```
   /setcommands
   stats - Ver estadísticas del día
   orders - Pedidos recientes
   status - Estado del sistema
   ```

### 🛠️ Testing

#### 🧪 Test de Conectividad

```http
POST /api/admin/telegram/test-connection
Authorization: Bearer <admin-jwt-token>
```

#### 📱 Mensaje de Prueba

```http
POST /api/admin/telegram/send-test
Authorization: Bearer <admin-jwt-token>

{
  "message": "🧪 Test de conectividad - OK"
}
```

---

## 🚀 Configuración Avanzada

### 🎯 Múltiples Chats

```env
# Diferentes canales para diferentes tipos
TELEGRAM_ORDERS_CHAT_ID=-1001234567890    # Canal de pedidos
TELEGRAM_PAYMENTS_CHAT_ID=-1001234567891  # Canal de pagos
TELEGRAM_ALERTS_CHAT_ID=-1001234567892    # Canal de alertas
```

### ⏰ Programación de Reportes

```javascript
// Configurar reporte automático diario
{
  "dailyReport": {
    "enabled": true,
    "time": "09:00",
    "timezone": "America/Argentina/Buenos_Aires",
    "includeCharts": true
  }
}
```

### 🎨 Personalización de Mensajes

```javascript
// Templates personalizables
const templates = {
  newOrder: `
🆕 NUEVO PEDIDO #{{orderNumber}}

👤 {{customerName}}
💰 ${{total}}
📦 {{itemCount}} productos

{{#if isUrgent}}⚡ URGENTE{{/if}}
{{#if isFirstTime}}🌟 CLIENTE NUEVO{{/if}}
  `,
  
  paymentApproved: `
💰 PAGO RECIBIDO

💳 ${{amount}}
🆔 {{paymentId}}
📋 Pedido #{{orderNumber}}
  `
};
```

---

## 🔐 Seguridad

### 🛡️ Mejores Prácticas

1. **Token seguro:** Mantener token en variables de entorno
2. **Chat ID privado:** No exponer chat IDs públicamente
3. **Validación:** Verificar origen de updates
4. **Rate limiting:** Respetar límites de API
5. **Logs:** Registrar todas las interacciones

### 📊 Monitoreo de Seguridad

- Intentos de acceso no autorizados
- Cambios en configuración del bot
- Mensajes sospechosos o spam
- Rate limiting excedido

---

## 🎯 Integración con Otros Sistemas

### 📧 Combinación con Email

```javascript
// Enviar tanto email como Telegram
await Promise.all([
  emailService.sendOrderConfirmation(order),
  telegramService.notifyNewOrder(order)
]);
```

### 📊 Dashboard en Tiempo Real

- Métricas de mensajes enviados
- Estado del bot en tiempo real
- Configuración de alertas
- Historial de notificaciones

---

**💡 Tip:** Usa Telegram para notificaciones críticas en tiempo real y email para comunicación formal con clientes.
