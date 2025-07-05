# 🔗 Sistema de Webhooks - Captura y Análisis Completo

Sistema robusto para capturar, almacenar y consultar webhooks de MercadoPago con trazabilidad total y obtención de información real desde la API.

## 📑 Índice

- [🎯 Propósito](#-propósito)
- [🏗️ Arquitectura](#-arquitectura)
- [📋 Endpoints Disponibles](#-endpoints-disponibles)
- [🔍 Endpoint Estrella](#-endpoint-estrella)
- [💡 Casos de Uso](#-casos-de-uso)
- [🔧 Configuración](#-configuración)
- [📊 Monitoreo](#-monitoreo)

## 🎯 Propósito

El sistema de webhooks permite:

- **🔄 Captura automática** de todos los webhooks recibidos
- **💾 Almacenamiento completo** de datos crudos para auditoría
- **🔍 Consulta directa** a MercadoPago para información real
- **🔗 Trazabilidad total** para vincular pagos con ventas
- **📊 Análisis** de duplicados y problemas
- **⚠️ Transparencia** sin romper el funcionamiento actual

## 🏗️ Arquitectura

### Flujo de Captura

```
Webhook MercadoPago → Middleware Logger → Base de Datos → Consulta API → Análisis
```

1. **Webhook llega** al endpoint configurado
2. **Middleware captura** automáticamente todos los datos
3. **Se almacena** en MongoDB con datos crudos
4. **Consulta opcional** a la API de MercadoPago
5. **Análisis** de trazabilidad y duplicados

### Componentes

- **`WebhookLogModel`**: Modelo MongoDB para almacenar webhooks
- **`WebhookLoggerMiddleware`**: Captura automática de webhooks
- **`WebhookController`**: Endpoints de administración y consulta
- **`MercadoPagoAdapter`**: Integración con API de MercadoPago

## 📋 Endpoints Disponibles

### 🔐 Autenticación
**Todos los endpoints requieren:**
- Token JWT válido
- Rol de ADMIN

### 1️⃣ `GET /api/webhooks` - Listar Webhooks

**Propósito:** Ver todos los webhooks capturados con paginación y filtros

**Query Parameters:**
```
page=1               # Página (default: 1)
limit=10            # Elementos por página (default: 10)
source=mercadopago  # Filtrar por fuente
eventType=payment   # Filtrar por tipo de evento
processed=false     # Filtrar por procesados (true/false)
```

**Ejemplo:**
```bash
GET /api/webhooks?page=1&limit=20&source=mercadopago&processed=false
```

**Respuesta:**
```json
{
  "total": 150,
  "webhooks": [
    {
      "_id": "65a1b2c3d4e5f6789012345",
      "source": "mercadopago",
      "eventType": "payment",
      "httpMethod": "POST",
      "url": "/webhook",
      "headers": {...},
      "queryParams": { "topic": "payment", "id": "123456" },
      "body": {
        "action": "payment.updated",
        "data": { "id": "123456" }
      },
      "ipAddress": "200.115.53.25",
      "userAgent": "MercadoPago/1.0",
      "processed": false,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### 2️⃣ `GET /api/webhooks/stats` - Estadísticas

**Propósito:** Panorama general del estado de webhooks

**Respuesta:**
```json
{
  "general": {
    "total": 1250,
    "processed": 1100,
    "successful": 1050,
    "pending": 150,
    "failed": 50
  },
  "bySource": [
    { "_id": "mercadopago", "count": 1000, "processed": 900 },
    { "_id": "stripe", "count": 250, "processed": 200 }
  ],
  "byEventType": [
    { "_id": "payment", "count": 800, "processed": 750 },
    { "_id": "refund", "count": 200, "processed": 180 }
  ]
}
```

### 3️⃣ `GET /api/webhooks/:id` - Detalle de Webhook

**Propósito:** Ver información completa y cruda de un webhook específico

**Parámetros:**
- `id`: ID del webhook en MongoDB

**Respuesta:**
```json
{
  "webhook": {
    "_id": "65a1b2c3d4e5f6789012345",
    "source": "mercadopago",
    "eventType": "payment",
    "httpMethod": "POST",
    "url": "/webhook",
    "headers": {
      "content-type": "application/json",
      "user-agent": "MercadoPago/1.0",
      "x-signature": "signature-hash"
    },
    "queryParams": { "topic": "payment", "id": "123456" },
    "body": {
      "action": "payment.updated",
      "api_version": "v1",
      "data": { "id": "123456" },
      "date_created": "2025-01-15T10:29:45.000-04:00",
      "id": 789012345,
      "live_mode": true,
      "type": "payment",
      "user_id": 987654321
    },
    "ipAddress": "200.115.53.25",
    "userAgent": "MercadoPago/1.0",
    "rawData": "{\"action\":\"payment.updated\",...}",
    "processed": true,
    "processingResult": {
      "success": true,
      "paymentId": "123456",
      "orderId": "ORDER_789"
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:31:00Z"
  }
}
```

## 🔍 Endpoint Estrella

### 4️⃣ `GET /api/webhooks/:id/mercadopago-details` 🚀

**🎯 ESTE ES EL ENDPOINT MÁS IMPORTANTE**

**Propósito:** Obtener información REAL y COMPLETA del pago directamente desde MercadoPago

**Lo que hace internamente:**
1. Busca el webhook en MongoDB por su ID
2. Extrae el `payment_id` del webhook
3. **Consulta directamente** la API de MercadoPago: `GET https://api.mercadopago.com/v1/payments/{payment_id}`
4. Enriquece la información con análisis de trazabilidad
5. Detecta duplicados y problemas

**Parámetros:**
- `id`: ID del webhook en MongoDB

**Respuesta COMPLETA:**
```json
{
  "webhookInfo": {
    "_id": "65a1b2c3d4e5f6789012345",
    "source": "mercadopago",
    "eventType": "payment",
    "createdAt": "2025-01-15T10:30:00Z",
    "paymentId": "123456789"
  },
  "mercadoPagoPayment": {
    "id": 123456789,
    "status": "approved",
    "status_detail": "accredited",
    "transaction_amount": 2500.00,
    "currency_id": "ARS",
    "date_created": "2025-01-15T10:29:45.000-04:00",
    "date_approved": "2025-01-15T10:29:47.000-04:00",
    "date_last_updated": "2025-01-15T10:29:47.000-04:00",
    "external_reference": "ORDER_ABC123",
    "payment_method_id": "visa",
    "payment_type_id": "credit_card",
    "installments": 3,
    "transaction_details": {
      "net_received_amount": 2375.50,
      "total_paid_amount": 2500.00,
      "overpaid_amount": 0,
      "installment_amount": 833.33
    },
    "fee_details": [
      {
        "type": "mercadopago_fee",
        "amount": 124.50
      }
    ],
    "payer": {
      "id": "456789123",
      "email": "cliente@email.com",
      "identification": {
        "type": "DNI",
        "number": "12345678"
      }
    },
    "card": {
      "first_six_digits": "450995",
      "last_four_digits": "3704",
      "expiration_month": 12,
      "expiration_year": 2026,
      "cardholder": {
        "name": "JUAN PEREZ",
        "identification": {
          "type": "DNI",
          "number": "12345678"
        }
      }
    },
    "metadata": {
      "uuid": "clave-idempotencia-123"
    }
  },
  "analysis": {
    "idempotencyKey": "clave-idempotencia-123",
    "duplicates": {
      "found": false,
      "count": 0,
      "webhooks": []
    },
    "traceability": {
      "canLinkToOrder": true,
      "orderReference": "ORDER_ABC123",
      "paymentCompleted": true,
      "amountMatches": true
    }
  }
}
```

### 🎯 Información Clave para Vincular con Ventas

**Datos de trazabilidad que obtienes:**

#### ✅ Identificación
- **`id`**: ID único del pago en MercadoPago
- **`external_reference`**: Tu referencia de orden/venta (CLAVE)
- **`metadata.uuid`**: Clave de idempotencia

#### 💰 Información Financiera
- **`transaction_amount`**: Monto exacto cobrado
- **`net_received_amount`**: Monto que recibiste (después de comisiones)
- **`fee_details`**: Detalle de comisiones
- **`installments`**: Número de cuotas

#### 📅 Fechas y Estados
- **`status`**: Estado real del pago (approved, pending, rejected)
- **`status_detail`**: Detalle específico del estado
- **`date_created`**: Cuándo se creó el pago
- **`date_approved`**: Cuándo se aprobó
- **`date_last_updated`**: Última actualización

#### 💳 Método de Pago
- **`payment_method_id`**: Tipo (visa, mastercard, efectivo)
- **`payment_type_id`**: Categoría (credit_card, debit_card, ticket)
- **`card.first_six_digits`**: Primeros 6 dígitos
- **`card.last_four_digits`**: Últimos 4 dígitos

#### 👤 Información del Pagador
- **`payer.email`**: Email del cliente
- **`payer.identification`**: DNI/documento
- **`card.cardholder.name`**: Nombre en la tarjeta

## 💡 Casos de Uso

### 🔍 Caso 1: Verificar Pago Después de Webhook

```bash
# 1. Listar webhooks no procesados
GET /api/webhooks?processed=false&eventType=payment

# 2. Obtener detalles completos del pago
GET /api/webhooks/65a1b2c3d4e5f6789012345/mercadopago-details

# 3. Vincular con orden local usando external_reference
```

### 🕵️ Caso 2: Investigar Discrepancia de Pago

```bash
# 1. Buscar webhook por período
GET /api/webhooks?page=1&limit=50

# 2. Consultar información real de MercadoPago
GET /api/webhooks/{webhook_id}/mercadopago-details

# 3. Comparar con registros locales
```

### 📊 Caso 3: Auditoría de Pagos

```bash
# 1. Ver estadísticas generales
GET /api/webhooks/stats

# 2. Revisar webhooks fallidos
GET /api/webhooks?processed=true&limit=100

# 3. Verificar cada pago importante
GET /api/webhooks/{webhook_id}/mercadopago-details
```

### 🔁 Caso 4: Detectar Duplicados

```bash
# Usar el endpoint principal que automáticamente detecta duplicados
GET /api/webhooks/{webhook_id}/mercadopago-details

# El analysis.duplicates mostrará:
{
  "duplicates": {
    "found": true,
    "count": 2,
    "webhooks": [
      { "_id": "webhook1", "createdAt": "..." },
      { "_id": "webhook2", "createdAt": "..." }
    ]
  }
}
```

## 🔧 Configuración

### Variables de Entorno
```env
# MercadoPago (requerido para consultas directas)
MERCADO_PAGO_ACCESS_TOKEN=your_access_token

# MongoDB (donde se almacenan los webhooks)
MONGO_URL=mongodb://localhost:27017/ecommerce

# Webhook URL (configurar en MercadoPago)
WEBHOOK_URL=https://tu-dominio.com/webhook
```

### Configuración en MercadoPago

1. **Ir al panel de MercadoPago**
2. **Configurar webhook URL**: `https://tu-dominio.com/webhook`
3. **Seleccionar eventos**: payment, refund, etc.
4. **El sistema capturará automáticamente** todos los webhooks

## 📊 Monitoreo

### Logs Automáticos

El sistema loguea automáticamente:
- Recepción de webhooks
- Consultas a MercadoPago
- Errores y fallos
- Análisis de trazabilidad

### Métricas Importantes

```bash
# Ver estadísticas generales
GET /api/webhooks/stats

# Alertas a monitorear:
- Webhooks no procesados > 10
- Tasa de fallos > 5%
- Pagos sin external_reference
- Duplicados frecuentes
```

### Dashboard Recomendado

**Métricas clave a monitorear:**
1. **Total webhooks/día**
2. **Tasa de procesamiento exitoso**
3. **Webhooks pendientes**
4. **Pagos sin vincular**
5. **Duplicados detectados**

---

## 🎯 Resumen

Este sistema te permite **capturar TODO** lo que llega de MercadoPago y **obtener información real** consultando directamente su API. Es **transparente** (no rompe nada), **completo** (guarda todo), y te da **trazabilidad total** para vincular cada cobro con tu venta.

**🚀 El endpoint más importante es `/api/webhooks/:id/mercadopago-details` porque es el único que va directo a MercadoPago y te trae toda la información real del pago.**

Para más información:
- [💳 Integración MercadoPago](./mercadopago.md)
- [📊 Sistema de Monitoreo](./monitoring.md)
- [🏗️ Arquitectura](./architecture.md)
