
# 🔧 Variables de Entorno - Configuración Completa (Backend E-commerce)

Guía exhaustiva y actualizada de todas las variables de entorno requeridas y opcionales para el backend. **Esta documentación es crítica para el frontend y la integración de servicios externos.**

> **IMPORTANTE:** Los nombres, valores y formatos aquí listados reflejan el código real. Si encuentras discrepancias, consulta con backend.


## 📋 Índice

- [🚀 Variables Críticas y Requeridas](#-variables-críticas-y-requeridas)
- [💳 MercadoPago](#-mercadopago)
- [📧 Email (Gmail)](#-email-gmail)
- [📱 Telegram (Opcional)](#-telegram-opcional)
- [☁️ Cloudinary](#-cloudinary)
- [🤖 APIs de IA](#-apis-de-ia)
- [🔔 Notificaciones y Canales](#-notificaciones-y-canales)
- [🌐 URLs del Sistema](#-urls-del-sistema)
- [📝 Ejemplo Completo](#-ejemplo-completo)
- [🔍 Verificación](#-verificación)
- [📊 Diagramas de Flujo](#-diagramas-de-flujo)

---


## 🚀 Variables Críticas y Requeridas

Estas variables son **obligatorias** para que el backend funcione correctamente. El sistema no inicia si falta alguna.

```env
# Entorno y servidor
NODE_ENV=production            # development | production | test
PORT=10000                    # Puerto de escucha (número)

# Base de datos
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=mystore

# Seguridad
JWT_SEED=your-super-secret-jwt-seed-string-here

# Configuración por defecto
DEFAULT_NEIGHBORHOOD_ID=675a1a39dd398aae92ab05f2

# URLs
FRONTEND_URL=https://front-startup.pages.dev
URL_RESPONSE_WEBHOOK_NGROK=https://sistema-mongo.onrender.com/

# MercadoPago (requerido para pagos)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...

# Cloudinary (requerido para imágenes)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@your-cloud-name

# Email (requerido para notificaciones)
EMAIL_SERVICE=gmail
EMAIL_USER=example@gmail.com
EMAIL_PASS=app-password
EMAIL_SENDER_NAME=StartUp E-commerce   # Opcional, por defecto "StartUp E-commerce"

# APIs de IA (requeridas si usas chatbot/IA)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
```

---


## 💳 MercadoPago

**Requerido para pagos online.**

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
# Opcionales para OAuth:
MERCADO_PAGO_CLIENT_ID=...
MERCADO_PAGO_CLIENT_SECRET=...
```

**Dónde obtenerlas:**
1. Ir a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/)
2. Crear aplicación
3. Obtener credenciales de producción
4. Configurar webhook URL: `${URL_RESPONSE_WEBHOOK_NGROK}api/payments/webhook`

**Endpoints afectados:**
- POST `/api/payments/create-preference` (requiere token)
- Webhook: `/api/payments/webhook` (MercadoPago llama a este endpoint)

**Headers/Autorización:**
- El backend usa el `MERCADO_PAGO_ACCESS_TOKEN` para comunicarse con la API de MercadoPago.

---


## 📧 Email (Gmail)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=example@gmail.com
EMAIL_PASS=app-password
EMAIL_SENDER_NAME=StartUp E-commerce   # Opcional
```

**Configuración Gmail:**
1. Habilitar 2FA en tu cuenta Gmail
2. Generar App Password:
   - Ve a: [Configuración de cuenta Google](https://myaccount.google.com/security)
   - Seguridad → Verificación en 2 pasos
   - Contraseñas de aplicación → Generar
   - Usar la contraseña generada en `EMAIL_PASS`

**Notas:**
- El campo `EMAIL_SENDER_NAME` es opcional, por defecto "StartUp E-commerce".
- El sistema envía notificaciones desde este correo.

---


## 📱 Telegram (Opcional)

```env
# Opcional, solo si quieres notificaciones por Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

**Configuración Telegram:**
1. Crear Bot con [@BotFather](https://t.me/BotFather)
2. Obtener token y chat ID

**Notas:**
- Si no se configuran, el sistema funciona igual pero **no enviará notificaciones por Telegram**.

---


## ☁️ Cloudinary

**Requerido para subida y gestión de imágenes.**

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@your-cloud-name
```

**Notas:**
- El backend usa estas variables para subir/eliminar imágenes de productos, banners, etc.

---


## 🤖 APIs de IA

**Requeridas si usas funcionalidades de chatbot/IA.**

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
```

**Notas:**
- Si no usas IA, puedes dejar estos campos vacíos, pero el sistema mostrará error si intentas usar endpoints de IA.
## 🔔 Notificaciones y Canales

Controla cómo y por dónde se envían las notificaciones del sistema.

```env
# Coma-separado: email,telegram
NOTIFICATION_CHANNELS=email,telegram

# Nivel de logs (opcional, afecta consola y archivos)
LOG_LEVEL=debug
```

**Valores posibles para NOTIFICATION_CHANNELS:**
- `email` (por defecto)
- `telegram` (si tienes configurado el bot)

**LOG_LEVEL:**
- Cambia el nivel de detalle de los logs (`debug`, `info`, `warn`, `error`).

---


## 🌐 URLs del Sistema

```env
FRONTEND_URL=https://front-startup.pages.dev
URL_RESPONSE_WEBHOOK_NGROK=https://sistema-mongo.onrender.com/
```

**Notas:**
- `FRONTEND_URL` se usa para redirecciones de pagos y links enviados por email.
- `URL_RESPONSE_WEBHOOK_NGROK` debe terminar en `/` y ser pública. Se usa para webhooks de MercadoPago.

---


## 📝 Ejemplo Completo

```env
# ===== SISTEMA =====
NODE_ENV=production
PORT=10000

# ===== BASE DE DATOS =====
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=mystore

# ===== SEGURIDAD =====
JWT_SEED=your-super-secret-jwt-seed-string-here

# ===== CONFIGURACIÓN =====
DEFAULT_NEIGHBORHOOD_ID=675a1a39dd398aae92ab05f2

# ===== MERCADOPAGO =====
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_CLIENT_ID=...
MERCADO_PAGO_CLIENT_SECRET=...

# ===== EMAIL =====
EMAIL_SERVICE=gmail
EMAIL_USER=example@gmail.com
EMAIL_PASS=app-password
EMAIL_SENDER_NAME=StartUp E-commerce

# ===== TELEGRAM (OPCIONAL) =====
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@your-cloud-name

# ===== URLS =====
FRONTEND_URL=https://front-startup.pages.dev
URL_RESPONSE_WEBHOOK_NGROK=https://sistema-mongo.onrender.com/

# ===== IA =====
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...

# ===== NOTIFICACIONES Y LOGS =====
NOTIFICATION_CHANNELS=email,telegram
LOG_LEVEL=debug
```

---


## 🔍 Verificación

### ✅ Verificación en Startup

El sistema valida automáticamente las variables críticas al iniciar:

```bash
[ENV] Checking critical environment variables:
[ENV]   PORT: SET
[ENV]   MONGO_URL: SET
[ENV]   MONGO_DB_NAME: SET
[ENV]   JWT_SEED: SET
[ENV]   MERCADO_PAGO_ACCESS_TOKEN: SET
[ENV]   FRONTEND_URL: SET
[ENV]   NODE_ENV: SET
```

### ✅ Verificación de Notificaciones

```bash
🔍 [NotificationService] Inicializando canales. ActiveChannels: email, telegram
✅ [NotificationService] Configuración de Telegram encontrada
✅ [NotificationService] Telegram notification channel initialized
```

### ✅ Verificación de Email

```bash
Servicio de Email (gmail) configurado para enviar desde example@gmail.com
Conexión SMTP verificada correctamente.
```

### 🚨 Variables Faltantes

Si falta alguna variable crítica, el sistema mostrará:

```bash
[ENV]   TELEGRAM_BOT_TOKEN: MISSING
```

Y puede fallar en el inicio o en funcionalidades específicas.

---

## 📋 Lista de Verificación

- [ ] Variables del sistema (`PORT`, `NODE_ENV`)
- [ ] Base de datos (`MONGO_URL`, `MONGO_DB_NAME`)
- [ ] Seguridad (`JWT_SEED`)
- [ ] MercadoPago (credenciales y webhook URL)
- [ ] Email (Gmail con app password)
- [ ] Telegram (bot token y chat ID, opcional)
- [ ] Cloudinary (para imágenes)
- [ ] URLs del frontend y webhook
- [ ] APIs de IA (opcional)
- [ ] Canales de notificación y nivel de logs

**🎯 Una vez configuradas todas las variables, el sistema enviará automáticamente notificaciones de Email + Telegram cuando los pagos sean aprobados.**

---

## 📊 Diagramas de Flujo

### Flujo de Pago y Notificaciones

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant MercadoPago
    participant Email
    participant Telegram

    Frontend->>Backend: POST /api/payments/create-preference
    Backend->>MercadoPago: Crea preferencia (usa MERCADO_PAGO_ACCESS_TOKEN)
    MercadoPago-->>Frontend: Devuelve init_point
    Frontend->>MercadoPago: Redirige usuario a pago
    MercadoPago->>Backend: POST /api/payments/webhook
    Backend->>Email: Envía notificación de pago (si canal activo)
    Backend->>Telegram: Envía notificación de pago (si canal activo)
    Backend-->>Frontend: Actualiza estado de orden
```

### Flujo de Envío de Email

```mermaid
sequenceDiagram
    participant Backend
    participant Email
    Backend->>Email: SMTP (usa EMAIL_USER, EMAIL_PASS)
    Email-->>Backend: OK/Error
```

---

> **Actualizado automáticamente según código fuente a julio 2025.**
