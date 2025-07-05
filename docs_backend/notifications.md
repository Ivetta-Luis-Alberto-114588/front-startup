# 📧 Sistema de Notificaciones

Sistema completo de notificaciones multicanal que incluye email (Nodemailer) y Telegram para mantener informados a clientes y administradores.

## 📑 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [📋 API Endpoints](#-api-endpoints)
- [📧 Notificaciones por Email](#-notificaciones-por-email)
- [📱 Notificaciones por Telegram](#-notificaciones-por-telegram)
- [🔔 Tipos de Notificaciones](#-tipos-de-notificaciones)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [⚙️ Configuración](#-configuración)

## 🎯 Funcionalidades

### ✅ Sistema de Email
- **Nodemailer** para envío de correos
- **Templates HTML** personalizables
- **Autenticación SMTP** segura
- **Adjuntos** y contenido rico
- **Tracking** de emails enviados
- **Cola de envío** para optimizar rendimiento

### ✅ Sistema de Telegram
- **Bot de Telegram** integrado
- **Notificaciones push** instantáneas
- **Mensajes a grupos** y canales
- **Botones interactivos** (inline keyboards)
- **Archivos y multimedia**
- **Rate limiting** automático

### ✅ Gestión de Notificaciones
- **Preferencias por usuario** (email, telegram, ambos)
- **Categorías de notificaciones** configurables
- **Horarios de envío** personalizables
- **Plantillas dinámicas** con variables
- **Logs detallados** de envíos
- **Retry automático** en caso de fallo

## 📋 API Endpoints

### Gestión de Preferencias

#### Obtener Preferencias de Usuario
```http
GET /api/notifications/preferences
Authorization: Bearer <jwt-token>
```

**Respuesta Exitosa (200):**
```json
{
  "preferences": {
    "userId": "64a7f8c9b123456789abcdef",
    "email": {
      "enabled": true,
      "address": "usuario@email.com",
      "categories": {
        "orderUpdates": true,
        "paymentConfirmations": true,
        "promotions": false,
        "systemAlerts": true
      }
    },
    "telegram": {
      "enabled": true,
      "chatId": "123456789",
      "username": "@usuario",
      "categories": {
        "orderUpdates": true,
        "paymentConfirmations": true,
        "promotions": false,
        "systemAlerts": false
      }
    },
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/Argentina/Buenos_Aires"
    }
  }
}
```

#### Actualizar Preferencias
```http
PUT /api/notifications/preferences
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "email": {
    "enabled": true,
    "categories": {
      "orderUpdates": true,
      "paymentConfirmations": true,
      "promotions": false
    }
  },
  "telegram": {
    "enabled": false
  },
  "quietHours": {
    "enabled": true,
    "start": "23:00",
    "end": "07:00"
  }
}
```

#### Vincular Cuenta de Telegram
```http
POST /api/notifications/telegram/link
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "telegramCode": "ABC123XYZ"
}
```

### Envío de Notificaciones (Solo Admin)

#### Enviar Notificación Manual
```http
POST /api/admin/notifications/send
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "type": "custom",
  "channels": ["email", "telegram"],
  "recipients": {
    "userIds": ["64a7f8c9b123456789abcdef"],
    "emails": ["cliente@email.com"],
    "telegramChats": ["123456789"]
  },
  "content": {
    "subject": "Oferta Especial",
    "title": "¡No te pierdas esta oferta!",
    "message": "Descuento del 20% en todos los productos electrónicos hasta el domingo.",
    "buttons": [
      {
        "text": "Ver Ofertas",
        "url": "https://tu-sitio.com/ofertas"
      }
    ]
  },
  "scheduleFor": "2024-01-16T10:00:00.000Z"
}
```

#### Obtener Historial de Notificaciones
```http
GET /api/admin/notifications/history?page=1&limit=20&type=email&status=sent
Authorization: Bearer <admin-jwt-token>
```

### Webhooks de Telegram

#### Webhook del Bot de Telegram
```http
POST /api/notifications/telegram/webhook
Content-Type: application/json

{
  "update_id": 123456789,
  "message": {
    "message_id": 1234,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "Juan",
      "username": "juanperez"
    },
    "chat": {
      "id": 987654321,
      "first_name": "Juan",
      "username": "juanperez",
      "type": "private"
    },
    "date": 1642248000,
    "text": "/start ABC123XYZ"
  }
}
```

## 📧 Notificaciones por Email

### Templates de Email Disponibles

#### Confirmación de Pedido
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmación de Pedido #{{orderNumber}}</title>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
        .footer { background-color: #6c757d; color: white; padding: 15px; text-align: center; }
        .button { 
            background-color: #28a745; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            display: inline-block; 
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Gracias por tu compra!</h1>
            <p>Pedido #{{orderNumber}}</p>
        </div>
        
        <div class="content">
            <p>Hola {{customerName}},</p>
            <p>Tu pedido ha sido confirmado y está siendo procesado.</p>
            
            <div class="order-details">
                <h3>Detalles del Pedido:</h3>
                <ul>
                    {{#each items}}
                    <li>{{name}} x{{quantity}} - ${{price}}</li>
                    {{/each}}
                </ul>
                <hr>
                <p><strong>Total: ${{total}}</strong></p>
                <p><strong>Método de Pago:</strong> {{paymentMethod}}</p>
                <p><strong>Dirección de Envío:</strong> {{shippingAddress}}</p>
            </div>
            
            <p>Recibirás una notificación cuando tu pedido sea enviado.</p>
            
            <a href="{{trackingUrl}}" class="button">Rastrear Pedido</a>
        </div>
        
        <div class="footer">
            <p>© 2024 StartUp E-commerce. Todos los derechos reservados.</p>
            <p>Si tienes preguntas, contáctanos en soporte@tu-sitio.com</p>
        </div>
    </div>
</body>
</html>
```

#### Notificación de Pago
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pago Confirmado - Pedido #{{orderNumber}}</title>
    <!-- Estilos similares al template anterior -->
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Pago Confirmado</h1>
            <p>Pedido #{{orderNumber}}</p>
        </div>
        
        <div class="content">
            <p>Hola {{customerName}},</p>
            <p>Hemos recibido y confirmado tu pago.</p>
            
            <div class="order-details">
                <h3>Información del Pago:</h3>
                <p><strong>Monto:</strong> ${{amount}}</p>
                <p><strong>Método:</strong> {{paymentMethod}}</p>
                <p><strong>ID de Transacción:</strong> {{transactionId}}</p>
                <p><strong>Fecha:</strong> {{paymentDate}}</p>
            </div>
            
            <p>Tu pedido será preparado y enviado en las próximas 24-48 horas.</p>
            
            <a href="{{orderUrl}}" class="button">Ver Detalles del Pedido</a>
        </div>
        
        <div class="footer">
            <p>© 2024 StartUp E-commerce</p>
        </div>
    </div>
</body>
</html>
```

### Servicio de Email

```typescript
// src/infrastructure/services/email.service.ts
export class EmailServiceImpl implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: envs.MAILER_SERVICE,
      auth: {
        user: envs.MAILER_EMAIL,
        pass: envs.MAILER_SECRET_KEY
      }
    });
  }

  async sendEmail(emailData: SendEmailDto): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"StartUp E-commerce" <${envs.MAILER_EMAIL}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.htmlBody,
        text: emailData.textBody,
        attachments: emailData.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${emailData.to}`, {
        messageId: info.messageId,
        response: info.response
      });

      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new CustomError('Failed to send email');
    }
  }

  async sendOrderConfirmation(order: OrderEntity, customer: CustomerEntity): Promise<void> {
    const template = await this.loadTemplate('order-confirmation');
    
    const htmlBody = this.renderTemplate(template, {
      customerName: customer.name,
      orderNumber: order.orderNumber,
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod?.name || 'No especificado',
      shippingAddress: this.formatAddress(order.shippingDetails),
      trackingUrl: `${envs.FRONTEND_URL}/orders/${order.id}/track`
    });

    await this.sendEmail({
      to: customer.email,
      subject: `Confirmación de Pedido #${order.orderNumber}`,
      htmlBody
    });
  }

  async sendPaymentConfirmation(
    order: OrderEntity, 
    payment: PaymentEntity, 
    customer: CustomerEntity
  ): Promise<void> {
    const template = await this.loadTemplate('payment-confirmation');
    
    const htmlBody = this.renderTemplate(template, {
      customerName: customer.name,
      orderNumber: order.orderNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod?.name || 'MercadoPago',
      transactionId: payment.mpPaymentId || payment.id,
      paymentDate: payment.transactionDate.toLocaleDateString(),
      orderUrl: `${envs.FRONTEND_URL}/orders/${order.id}`
    });

    await this.sendEmail({
      to: customer.email,
      subject: `Pago Confirmado - Pedido #${order.orderNumber}`,
      htmlBody
    });
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
    return fs.readFileSync(templatePath, 'utf-8');
  }

  private renderTemplate(template: string, data: any): string {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  }

  private formatAddress(shippingDetails: any): string {
    return `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.country}`;
  }
}
```

## 📱 Notificaciones por Telegram

### Bot de Telegram

```typescript
// src/infrastructure/services/telegram.service.ts
export class TelegramServiceImpl implements TelegramService {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(envs.TELEGRAM_BOT_TOKEN, {
      polling: false // Usaremos webhooks
    });
  }

  async sendMessage(chatId: string, message: string, options?: any): Promise<boolean> {
    try {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      });

      logger.info(`Telegram message sent to chat ${chatId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending Telegram message to ${chatId}:`, error);
      throw new CustomError('Failed to send Telegram message');
    }
  }

  async sendOrderNotification(chatId: string, order: OrderEntity): Promise<void> {
    const message = `
🛒 <b>Nuevo Pedido Confirmado</b>

📋 <b>Pedido:</b> #${order.orderNumber}
💰 <b>Total:</b> $${order.total}
🏠 <b>Cliente:</b> ${order.customer.name}
📍 <b>Dirección:</b> ${this.formatAddress(order.shippingDetails)}

<b>Productos:</b>
${order.items.map(item => 
  `• ${item.productName} x${item.quantity} - $${item.price * item.quantity}`
).join('\n')}

Estado: <b>${order.status.name}</b>
`;

    const keyboard = {
      inline_keyboard: [[
        { text: 'Ver Detalles', url: `${envs.FRONTEND_URL}/admin/orders/${order.id}` },
        { text: 'Procesar Pedido', callback_data: `process_order_${order.id}` }
      ]]
    };

    await this.sendMessage(chatId, message, { reply_markup: keyboard });
  }

  async sendPaymentNotification(chatId: string, payment: PaymentEntity, order: OrderEntity): Promise<void> {
    const statusEmoji = payment.status === 'approved' ? '✅' : '⚠️';
    
    const message = `
${statusEmoji} <b>Actualización de Pago</b>

📋 <b>Pedido:</b> #${order.orderNumber}
💳 <b>Monto:</b> $${payment.amount}
📊 <b>Estado:</b> ${this.formatPaymentStatus(payment.status)}
🏪 <b>Método:</b> ${payment.paymentMethod?.name || 'MercadoPago'}

${payment.mpPaymentId ? `🔗 <b>ID MP:</b> ${payment.mpPaymentId}` : ''}
📅 <b>Fecha:</b> ${payment.transactionDate.toLocaleString()}
`;

    const keyboard = {
      inline_keyboard: [[
        { text: 'Ver Pago', url: `${envs.FRONTEND_URL}/admin/payments/${payment.id}` }
      ]]
    };

    await this.sendMessage(chatId, message, { reply_markup: keyboard });
  }

  async sendLowStockAlert(chatId: string, product: ProductEntity): Promise<void> {
    const message = `
⚠️ <b>Alerta de Stock Bajo</b>

📦 <b>Producto:</b> ${product.name}
📊 <b>Stock Actual:</b> ${product.stock} unidades
💰 <b>Precio:</b> $${product.price}

<i>Se recomienda reabastecer este producto pronto.</i>
`;

    const keyboard = {
      inline_keyboard: [[
        { text: 'Ver Producto', url: `${envs.FRONTEND_URL}/admin/products/${product.id}` },
        { text: 'Actualizar Stock', callback_data: `update_stock_${product.id}` }
      ]]
    };

    await this.sendMessage(chatId, message, { reply_markup: keyboard });
  }

  async processWebhook(webhookData: any): Promise<void> {
    const { message, callback_query } = webhookData;

    if (message) {
      await this.handleMessage(message);
    }

    if (callback_query) {
      await this.handleCallbackQuery(callback_query);
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const chatId = message.chat.id.toString();
    const text = message.text;

    if (text?.startsWith('/start')) {
      const linkingCode = text.split(' ')[1];
      
      if (linkingCode) {
        await this.handleAccountLinking(chatId, linkingCode, message.from);
      } else {
        await this.sendWelcomeMessage(chatId);
      }
    }
  }

  private async handleAccountLinking(chatId: string, code: string, user: any): Promise<void> {
    try {
      // Buscar el código de vinculación en la base de datos
      // y asociar el chatId con el usuario
      // Esto debería implementarse según tu lógica de negocio
      
      await this.sendMessage(chatId, `
✅ <b>Cuenta vinculada exitosamente</b>

Hola ${user.first_name}! Tu cuenta de Telegram ha sido vinculada correctamente.

Ahora recibirás notificaciones sobre:
• Confirmaciones de pedidos
• Actualizaciones de pagos
• Estados de envío
• Ofertas especiales (si las tienes habilitadas)

Puedes gestionar tus preferencias de notificación desde tu perfil en la web.
`);
    } catch (error) {
      await this.sendMessage(chatId, `
❌ <b>Error al vincular cuenta</b>

El código proporcionado no es válido o ha expirado.
Por favor, genera un nuevo código desde tu perfil en la web.
`);
    }
  }

  private async sendWelcomeMessage(chatId: string): Promise<void> {
    await this.sendMessage(chatId, `
👋 <b>¡Bienvenido al Bot de StartUp E-commerce!</b>

Para vincular tu cuenta, ve a tu perfil en la web y genera un código de vinculación.
Luego envía: <code>/start TU_CODIGO</code>

Una vez vinculado, recibirás notificaciones importantes sobre tus pedidos y más.
`);
  }

  private formatPaymentStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };
    
    return statusMap[status] || status;
  }

  private formatAddress(shippingDetails: any): string {
    return `${shippingDetails.address}, ${shippingDetails.city}`;
  }
}
```

## 🔔 Tipos de Notificaciones

### Notificaciones Automáticas

| Evento | Email | Telegram | Destinatario | Momento de Envío |
|--------|--------|----------|-------------|-----------------|
| **Nuevo pedido** | ✅ | ❌ | Cliente + Admin | Al crear la orden |
| **Pago confirmado** | ✅ | ✅ | Cliente + Admin | **Solo cuando MercadoPago aprueba el pago (webhook)** |
| **Pago rechazado** | ✅ | ❌ | Cliente | Webhook de pago rechazado |
| **Pedido enviado** | ✅ | ✅ | Cliente | Al cambiar estado manualmente |
| **Pedido entregado** | ✅ | ✅ | Cliente | Al cambiar estado manualmente |
| **Stock bajo** | ❌ | ✅ | Admin | Automático cuando stock < mínimo |
| **Error del sistema** | ❌ | ✅ | Admin | Automático en errores críticos |
| **Registro de usuario** | ✅ | ❌ | Cliente | Al registrarse |
| **Recuperar contraseña** | ✅ | ❌ | Cliente | Al solicitar reset |

**🎯 Nota Importante sobre Telegram:**
- ✅ **Telegram solo notifica cuando el pago es REALMENTE confirmado** (status = "approved")
- ❌ **NO se envía Telegram al crear la orden** (evita notificaciones de órdenes sin pagar)
- 🔒 **Esto garantiza que solo se notifique sobre pedidos pagados confirmados**

### Notificaciones Promocionales

| Tipo | Email | Telegram | Frecuencia |
|------|--------|----------|------------|
| **Ofertas especiales** | ✅ | ✅ | Semanal |
| **Productos nuevos** | ✅ | ✅ | Mensual |
| **Carrito abandonado** | ✅ | ❌ | 24h después |
| **Recomendaciones** | ✅ | ❌ | Personalizada |

## 💡 Ejemplos de Uso

### Configurar Notificaciones en Frontend

```javascript
// Componente React para gestionar preferencias
const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await authenticatedFetch('/api/notifications/preferences');
      const data = await response.json();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await authenticatedFetch('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
        toast.success('Preferencias actualizadas');
      }
    } catch (error) {
      toast.error('Error al actualizar preferencias');
    }
  };

  const linkTelegram = async () => {
    try {
      // Generar código de vinculación
      const response = await authenticatedFetch('/api/notifications/telegram/generate-code', {
        method: 'POST'
      });
      
      const { code, botUsername } = await response.json();
      
      // Abrir Telegram con el comando pre-completado
      const telegramUrl = `https://t.me/${botUsername}?start=${code}`;
      window.open(telegramUrl, '_blank');
      
      toast.info('Se abrió Telegram. Envía el comando mostrado para vincular tu cuenta.');
    } catch (error) {
      toast.error('Error al generar código de vinculación');
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="notification-preferences">
      <h2>Preferencias de Notificaciones</h2>
      
      {/* Email Preferences */}
      <div className="preference-section">
        <h3>📧 Email</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.email.enabled}
            onChange={(e) => updatePreferences({
              email: { ...preferences.email, enabled: e.target.checked }
            })}
          />
          Recibir notificaciones por email
        </label>
        
        {preferences.email.enabled && (
          <div className="categories">
            <h4>Categorías:</h4>
            {Object.entries(preferences.email.categories).map(([category, enabled]) => (
              <label key={category}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updatePreferences({
                    email: {
                      ...preferences.email,
                      categories: {
                        ...preferences.email.categories,
                        [category]: e.target.checked
                      }
                    }
                  })}
                />
                {getCategoryLabel(category)}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Telegram Preferences */}
      <div className="preference-section">
        <h3>📱 Telegram</h3>
        
        {!preferences.telegram.chatId ? (
          <div>
            <p>Vincula tu cuenta de Telegram para recibir notificaciones instantáneas.</p>
            <button onClick={linkTelegram} className="btn-primary">
              Vincular Telegram
            </button>
          </div>
        ) : (
          <div>
            <p>✅ Cuenta vinculada: @{preferences.telegram.username}</p>
            <label>
              <input
                type="checkbox"
                checked={preferences.telegram.enabled}
                onChange={(e) => updatePreferences({
                  telegram: { ...preferences.telegram, enabled: e.target.checked }
                })}
              />
              Recibir notificaciones por Telegram
            </label>
            
            {preferences.telegram.enabled && (
              <div className="categories">
                <h4>Categorías:</h4>
                {Object.entries(preferences.telegram.categories).map(([category, enabled]) => (
                  <label key={category}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => updatePreferences({
                        telegram: {
                          ...preferences.telegram,
                          categories: {
                            ...preferences.telegram.categories,
                            [category]: e.target.checked
                          }
                        }
                      })}
                    />
                    {getCategoryLabel(category)}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="preference-section">
        <h3>🔕 Horarios Silenciosos</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.quietHours.enabled}
            onChange={(e) => updatePreferences({
              quietHours: { ...preferences.quietHours, enabled: e.target.checked }
            })}
          />
          No enviar notificaciones durante ciertas horas
        </label>
        
        {preferences.quietHours.enabled && (
          <div className="time-inputs">
            <label>
              Desde:
              <input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => updatePreferences({
                  quietHours: { ...preferences.quietHours, start: e.target.value }
                })}
              />
            </label>
            <label>
              Hasta:
              <input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) => updatePreferences({
                  quietHours: { ...preferences.quietHours, end: e.target.value }
                })}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

const getCategoryLabel = (category) => {
  const labels = {
    orderUpdates: 'Actualizaciones de pedidos',
    paymentConfirmations: 'Confirmaciones de pago',
    promotions: 'Promociones y ofertas',
    systemAlerts: 'Alertas del sistema'
  };
  return labels[category] || category;
};
```

### Sistema de Colas para Notificaciones

```typescript
// src/infrastructure/services/notification-queue.service.ts
export class NotificationQueueService {
  private emailQueue: Queue;
  private telegramQueue: Queue;

  constructor() {
    this.emailQueue = new Queue('email notifications', {
      redis: {
        host: envs.REDIS_HOST,
        port: envs.REDIS_PORT
      }
    });

    this.telegramQueue = new Queue('telegram notifications', {
      redis: {
        host: envs.REDIS_HOST,
        port: envs.REDIS_PORT
      }
    });

    this.setupWorkers();
  }

  private setupWorkers(): void {
    // Worker para emails
    this.emailQueue.process(async (job) => {
      const { type, data } = job.data;
      
      switch (type) {
        case 'order-confirmation':
          await this.emailService.sendOrderConfirmation(data.order, data.customer);
          break;
        case 'payment-confirmation':
          await this.emailService.sendPaymentConfirmation(data.order, data.payment, data.customer);
          break;
        // ... más tipos
      }
    });

    // Worker para Telegram
    this.telegramQueue.process(async (job) => {
      const { type, chatId, data } = job.data;
      
      switch (type) {
        case 'order-notification':
          await this.telegramService.sendOrderNotification(chatId, data.order);
          break;
        case 'payment-notification':
          await this.telegramService.sendPaymentNotification(chatId, data.payment, data.order);
          break;
        // ... más tipos
      }
    });
  }

  async queueOrderConfirmation(order: OrderEntity, customer: CustomerEntity): Promise<void> {
    // Email
    await this.emailQueue.add('order-confirmation', {
      type: 'order-confirmation',
      data: { order, customer }
    }, {
      attempts: 3,
      backoff: 'exponential',
      delay: 2000
    });

    // Telegram (si está configurado)
    if (customer.telegramChatId) {
      await this.telegramQueue.add('order-notification', {
        type: 'order-notification',
        chatId: customer.telegramChatId,
        data: { order }
      }, {
        attempts: 3,
        backoff: 'exponential',
        delay: 1000
      });
    }
  }
}
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Email Configuration (Nodemailer)
MAILER_SERVICE=gmail
MAILER_EMAIL=tu-email@gmail.com
MAILER_SECRET_KEY=tu-app-password

# Telegram Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_ID=123456789
TELEGRAM_WEBHOOK_URL=https://tu-dominio.com/api/notifications/telegram/webhook

# URLs
FRONTEND_URL=http://localhost:4200
WEBSERVICE_URL=http://localhost:3000

# Redis para colas
REDIS_HOST=localhost
REDIS_PORT=6379

# Configuración de notificaciones
NOTIFICATIONS_ENABLED=true
EMAIL_RATE_LIMIT=10
TELEGRAM_RATE_LIMIT=30
```

### Configuración de Templates

```typescript
// src/configs/notifications.config.ts
export const NOTIFICATION_CONFIG = {
  email: {
    from: `"StartUp E-commerce" <${envs.MAILER_EMAIL}>`,
    templates: {
      'order-confirmation': 'order-confirmation.hbs',
      'payment-confirmation': 'payment-confirmation.hbs',
      'password-reset': 'password-reset.hbs',
      'welcome': 'welcome.hbs'
    },
    rateLimit: {
      windowMs: 60 * 1000, // 1 minuto
      max: envs.EMAIL_RATE_LIMIT || 10
    }
  },
  
  telegram: {
    botToken: envs.TELEGRAM_BOT_TOKEN,
    adminChatId: envs.TELEGRAM_ADMIN_CHAT_ID,
    webhookUrl: envs.TELEGRAM_WEBHOOK_URL,
    rateLimit: {
      windowMs: 60 * 1000, // 1 minuto
      max: envs.TELEGRAM_RATE_LIMIT || 30
    }
  },
  
  categories: {
    orderUpdates: 'Actualizaciones de Pedidos',
    paymentConfirmations: 'Confirmaciones de Pago',
    promotions: 'Promociones y Ofertas',
    systemAlerts: 'Alertas del Sistema'
  },
  
  quietHours: {
    defaultStart: '22:00',
    defaultEnd: '08:00',
    defaultTimezone: 'America/Argentina/Buenos_Aires'
  }
};
```

---

## 🔗 Enlaces Relacionados

- [📧 Documentación Detallada de Email](./email.md)
- [📱 Documentación Detallada de Telegram](./telegram.md)
- [🛒 Carrito y Pedidos](./api-orders.md)
- [💰 Pagos y MercadoPago](./api-payments.md)
- [⚙️ Panel de Administración](./api-admin.md)

---

*Última actualización: Enero 2024*
