# 📱 Notificaciones de Telegram

Sistema completo de notificaciones usando Telegram Bot API para alertas en tiempo real.

## 📑 Índice

- [🔧 Configuración](#-configuración)
- [🚀 Funcionalidades](#-funcionalidades)
- [📋 API Endpoints](#-api-endpoints)
- [🔔 Tipos de Notificaciones](#-tipos-de-notificaciones)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [⚙️ Configuración Avanzada](#-configuración-avanzada)

## 🔧 Configuración

### Variables de Entorno

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_ADMIN_CHAT_ID=admin_chat_id_here
```

### Crear Bot de Telegram

1. **Contacta a @BotFather** en Telegram
2. **Ejecuta** `/newbot` y sigue las instrucciones
3. **Obtén el token** del bot
4. **Agrega el bot** a tu grupo/chat
5. **Obtén el Chat ID** usando `/start` o herramientas online

### Configuración del Adapter

```typescript
// src/infrastructure/adapters/telegram.adapter.ts
const telegramAdapter = TelegramAdapter.getInstance();
```

## 🚀 Funcionalidades

### ✅ Implementadas

- **Envío de mensajes** de texto
- **Mensajes con formato** (HTML/Markdown)
- **Notificaciones de pedidos** automáticas
- **Alertas de pagos** en tiempo real
- **Notificaciones de errores** críticos
- **Mensajes a múltiples chats** (admin, general)
- **Rate limiting** para evitar spam
- **Retry automático** en caso de fallo

### 🚧 En Desarrollo

- Envío de archivos/imágenes
- Botones interactivos (InlineKeyboard)
- Comandos del bot
- Webhooks de Telegram

## 📋 API Endpoints

### Envío de Notificaciones

#### `POST /api/notifications/telegram/send`
Enviar mensaje de Telegram (solo admins).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Mensaje a enviar",
  "chatId": "optional_chat_id",
  "parseMode": "HTML"
}
```

**Respuesta:**
```json
{
  "success": true,
  "messageId": 123,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### `POST /api/notifications/telegram/order`
Notificación automática de nuevo pedido.

**Body:**
```json
{
  "orderId": "ORDER_123",
  "customerName": "Juan Pérez",
  "total": 2500.00,
  "items": [
    {
      "name": "Producto 1",
      "quantity": 2,
      "price": 1250.00
    }
  ]
}
```

#### `POST /api/notifications/telegram/payment`
Notificación de pago recibido.

**Body:**
```json
{
  "paymentId": "PAY_123",
  "orderId": "ORDER_123",
  "amount": 2500.00,
  "method": "MercadoPago",
  "status": "approved"
}
```

## 🔔 Tipos de Notificaciones

### 📦 Nuevo Pedido

**Trigger:** Cuando se crea un nuevo pedido
**Destinatario:** Chat de administración
**Formato:**
```
🛒 NUEVO PEDIDO #ORDER_123

👤 Cliente: Juan Pérez
📧 Email: juan@email.com
💰 Total: $2,500.00

📋 Productos:
• Producto A × 2 - $1,250.00
• Producto B × 1 - $1,250.00

🚚 Dirección: Av. Corrientes 1234, CABA
⏰ Fecha: 15/01/2025 10:30
```

### 💳 Pago Confirmado

**Trigger:** Cuando se confirma un pago via webhook
**Destinatario:** Chat de administración
**Formato:**
```
✅ PAGO CONFIRMADO

💳 ID MercadoPago: 123456789
📝 Pedido: #ORDER_123
💰 Monto: $2,500.00
🏦 Método: Visa ****3704
👤 Cliente: Juan Pérez

⏰ 15/01/2025 10:30
```

### ⚠️ Error Crítico

**Trigger:** Errores en el sistema que requieren atención
**Destinatario:** Chat de administración
**Formato:**
```
🚨 ERROR CRÍTICO

📍 Módulo: PaymentController
💥 Error: Database connection timeout
📄 Detalles: Error al procesar pago ORDER_123

⏰ 15/01/2025 10:30
🔧 Requiere atención inmediata
```

### 📊 Resumen Diario

**Trigger:** Automático todos los días a las 23:59
**Destinatario:** Chat de administración
**Formato:**
```
📊 RESUMEN DEL DÍA - 15/01/2025

🛒 Pedidos: 25 nuevos
💰 Ventas: $62,500.00
📦 Productos vendidos: 150 unidades
👥 Clientes nuevos: 8

🔝 Producto más vendido: Producto A (25 unidades)
💳 Pagos procesados: 23/25
⏳ Pendientes: 2
```

## 💡 Ejemplos de Uso

### Notificación Manual

```typescript
// Enviar notificación manual desde cualquier parte del código
await telegramService.sendMessage({
  message: '🎉 Promoción especial activada!',
  chatId: process.env.TELEGRAM_CHAT_ID
});
```

### Notificación de Pedido (Automática)

```typescript
// En el OrderController después de crear pedido
const orderNotification = {
  orderId: newOrder.id,
  customerName: customer.name,
  total: newOrder.totalWithTax,
  items: newOrder.items.map(item => ({
    name: item.productName,
    quantity: item.quantity,
    price: item.price
  })),
  shippingAddress: newOrder.shippingDetails.address
};

await telegramService.sendOrderNotification(orderNotification);
```

### Notificación de Pago (Webhook)

```typescript
// En el webhook handler después de confirmar pago
await telegramService.sendPaymentNotification({
  paymentId: payment.id,
  orderId: payment.external_reference,
  amount: payment.transaction_amount,
  method: payment.payment_method_id,
  status: payment.status,
  customerEmail: payment.payer.email
});
```

### Notificación de Error

```typescript
// En cualquier catch block crítico
await telegramService.sendErrorNotification({
  module: 'PaymentController',
  error: error.message,
  details: `Error al procesar pago ${orderId}`,
  timestamp: new Date().toISOString()
});
```

## ⚙️ Configuración Avanzada

### Rate Limiting

```typescript
// Configuración para evitar spam
const rateLimitConfig = {
  maxMessagesPerMinute: 20,
  burstLimit: 5,
  cooldownPeriod: 60000 // 1 minuto
};
```

### Retry Logic

```typescript
// Configuración de reintentos
const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  backoffMultiplier: 2 // Incremento exponencial
};
```

### Formateo de Mensajes

```typescript
// Usar HTML para formato rico
const htmlMessage = `
<b>🛒 NUEVO PEDIDO</b> #${orderId}

<b>👤 Cliente:</b> ${customerName}
<b>💰 Total:</b> $${total.toFixed(2)}

<b>📋 Productos:</b>
${items.map(item => `• ${item.name} × ${item.quantity}`).join('\n')}

<i>⏰ ${new Date().toLocaleString('es-AR')}</i>
`;

await telegramService.sendMessage({
  message: htmlMessage,
  parseMode: 'HTML'
});
```

### Múltiples Chats

```typescript
// Configurar diferentes chats para diferentes tipos
const chatConfig = {
  admin: process.env.TELEGRAM_ADMIN_CHAT_ID,    // Errores críticos
  sales: process.env.TELEGRAM_SALES_CHAT_ID,    // Ventas y pedidos
  general: process.env.TELEGRAM_GENERAL_CHAT_ID // Notificaciones generales
};

// Enviar a chat específico
await telegramService.sendMessage({
  message: 'Nueva venta confirmada!',
  chatId: chatConfig.sales
});
```

### Logging y Monitoreo

```typescript
// Todas las notificaciones se loguean
logger.info('Telegram notification sent', {
  type: 'order',
  orderId,
  chatId,
  messageId: response.message_id,
  timestamp: new Date().toISOString()
});

// Métricas de notificaciones
await metrics.increment('telegram.notifications.sent', {
  type: 'order',
  status: 'success'
});
```

## 🔧 Troubleshooting

### Problemas Comunes

**Bot no envía mensajes:**
- Verificar que el token sea válido
- Confirmar que el bot esté agregado al chat
- Revisar que el chat ID sea correcto

**Mensajes con formato incorrecto:**
- Verificar sintaxis HTML/Markdown
- Escapar caracteres especiales
- Usar `parseMode` correcto

**Rate limiting de Telegram:**
- Implementar delays entre mensajes
- Usar rate limiting local
- Agrupar notificaciones cuando sea posible

### Testing

```typescript
// Test de conectividad
await telegramService.testConnection();

// Test de mensaje
await telegramService.sendMessage({
  message: '🧪 Test message from backend',
  chatId: process.env.TELEGRAM_CHAT_ID
});
```

---

Para más información sobre otros sistemas de notificación:
- [📧 Notificaciones por Email](./email.md)
- [💳 Integración MercadoPago](./mercadopago.md)
- [📊 Sistema de Monitoreo](./monitoring.md)
