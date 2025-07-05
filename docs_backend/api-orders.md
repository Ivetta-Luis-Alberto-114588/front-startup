# 🛒 Carrito y Gestión de Pedidos

Sistema completo de carritos de compras y gestión de pedidos con soporte para usuarios registrados e invitados, procesamiento de pagos y seguimiento de estados.

## 📑 Índice

- [🎯 Funcionalidades](#-funcionalidades)
- [🛒 Sistema de Carrito](#-sistema-de-carrito)
- [📦 Gestión de Pedidos](#-gestión-de-pedidos)
- [💳 Proceso de Checkout](#-proceso-de-checkout)
- [📊 Estados de Pedidos](#-estados-de-pedidos)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [🚨 Troubleshooting](#-troubleshooting)
- [✅ Mejores Prácticas](#-mejores-prácticas)
- [⚙️ Configuración](#-configuración)

## 🎯 Funcionalidades

### ✅ Sistema de Carrito
- **Carrito persistente** para usuarios registrados
- **Carrito temporal** para invitados (session)
- **Gestión de ítems** (agregar, actualizar, eliminar)
- **Cálculo automático** de totales y impuestos
- **Validación de stock** en tiempo real
- **Aplicación de cupones** de descuento

### ✅ Gestión de Pedidos
- **Checkout completo** con validaciones
- **Soporte multi-cliente** (registrados/invitados)
- **Gestión de estados** del pedido
- **Integración con pagos** (MercadoPago)
- **Historial completo** de pedidos
- **Notificaciones automáticas**

### ✅ Procesamiento
- **Validación de inventario** antes de confirmar
- **Reserva temporal** de productos
- **Cálculo dinámico** de envíos
- **Aplicación de descuentos** y promociones
- **Generación de facturas** automática

## 🛒 Sistema de Carrito

### API Endpoints - Carrito (`/api/cart`)

#### `GET /api/cart` - Obtener Carrito Actual
**Para usuarios registrados:**
```
Headers: Authorization: Bearer <token>
```

**Para invitados (temporal):**
```
Headers: X-Session-ID: <session_id>
```

**Respuesta:**
```json
{
  "cart": {
    "id": "cart123",
    "userId": "user123", // null para invitados
    "sessionId": "session456", // para invitados
    "items": [
      {
        "id": "item1",
        "product": {
          "id": "prod123",
          "name": "Laptop Gaming Pro",
          "price": 1500.00,
          "priceWithTax": 1815.00,
          "taxRate": 21,
          "stock": 25,
          "images": ["image_url"],
          "category": { "id": "cat1", "name": "Electrónicos" }
        },
        "quantity": 2,
        "unitPrice": 1500.00,
        "unitPriceWithTax": 1815.00,
        "subtotal": 3000.00,
        "subtotalWithTax": 3630.00,
        "taxAmount": 630.00,
        "taxRate": 21,
        "addedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": 3000.00,
      "taxAmount": 630.00,
      "subtotalWithTax": 3630.00,
      "discountAmount": 0,
      "shippingCost": 500.00,
      "total": 4130.00
    },
    "appliedCoupon": null,
    "shippingInfo": null,
    "lastUpdated": "2025-01-15T10:35:00Z"
  }
}
```

#### `POST /api/cart/items` - Agregar Producto al Carrito
**Body:**
```json
{
  "productId": "prod123",
  "quantity": 2
}
```

**Respuesta:**
```json
{
  "message": "Producto agregado al carrito",
  "cartItem": {
    "id": "item1",
    "product": {...},
    "quantity": 2,
    "subtotal": 3000.00
  },
  "cartSummary": {
    "itemCount": 3,
    "total": 4130.00
  }
}
```

#### `PUT /api/cart/items/:itemId` - Actualizar Cantidad
**Body:**
```json
{
  "quantity": 3
}
```

#### `DELETE /api/cart/items/:itemId` - Eliminar Item del Carrito

#### `POST /api/cart/apply-coupon` - Aplicar Cupón
**Body:**
```json
{
  "couponCode": "DESCUENTO10"
}
```

**Respuesta:**
```json
{
  "message": "Cupón aplicado exitosamente",
  "coupon": {
    "code": "DESCUENTO10",
    "discountType": "percentage",
    "discountValue": 10,
    "description": "10% de descuento"
  },
  "discount": {
    "amount": 313.00,
    "appliedTo": "subtotal"
  },
  "newTotal": 3817.00
}
```

#### `DELETE /api/cart/coupon` - Remover Cupón

#### `DELETE /api/cart` - Vaciar Carrito

### Flujo de Carrito

#### 1. Usuario Registrado
```javascript
// El carrito se persiste en BD asociado al userId
const addToCart = async (productId, quantity) => {
  const response = await fetch('/api/cart/items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId, quantity })
  });
  
  if (response.ok) {
    const data = await response.json();
    updateCartUI(data.cartSummary);
  }
};
```

#### 2. Usuario Invitado
```javascript
// Carrito temporal usando sessionId
const sessionId = localStorage.getItem('sessionId') || generateSessionId();
localStorage.setItem('sessionId', sessionId);

const addToCartGuest = async (productId, quantity) => {
  const response = await fetch('/api/cart/items', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId, quantity })
  });
};
```

## 📦 Gestión de Pedidos

### API Endpoints - Pedidos (`/api/orders` y `/api/sales`)

#### `POST /api/orders` - Crear Pedido (Checkout)
**El endpoint más importante del sistema**

**Body para Usuario Registrado:**
```json
{
  "shippingAddressId": "addr123", // Dirección guardada
  "paymentMethodId": "method123",
  "couponCode": "DESCUENTO10", // Opcional
  "observations": "Entregar después de las 18hs"
}
```

**Body para Usuario Invitado:**
```json
{
  "customerData": {
    "name": "Juan Invitado",
    "email": "juan@temp.com",
    "phone": "+54 11 1234-5678",
    "documentType": "DNI",
    "documentNumber": "12345678"
  },
  "shippingAddress": {
    "street": "Av. Corrientes",
    "number": "1234",
    "floor": "2",
    "apartment": "B",
    "neighborhoodId": "neigh123",
    "zipCode": "1043",
    "observations": "Timbre roto"
  },
  "paymentMethodId": "method123",
  "couponCode": "DESCUENTO10"
}
```

**Respuesta:**
```json
{
  "order": {
    "id": "order123",
    "orderNumber": "ORD-2025-001234",
    "status": "pending",
    "customer": {
      "id": "cust123",
      "name": "Juan Pérez",
      "email": "juan@email.com"
    },
    "items": [
      {
        "id": "orderItem1",
        "product": {
          "id": "prod123",
          "name": "Laptop Gaming Pro"
        },
        "quantity": 2,
        "unitPrice": 1500.00,
        "unitPriceWithTax": 1815.00,
        "subtotal": 3630.00
      }
    ],
    "summary": {
      "subtotal": 3000.00,
      "taxAmount": 630.00,
      "discountAmount": 300.00,
      "shippingCost": 500.00,
      "total": 3830.00
    },
    "shippingDetails": {
      "address": "Av. Corrientes 1234, Piso 2, Depto B",
      "neighborhood": "Balvanera",
      "city": "CABA",
      "zipCode": "1043",
      "estimatedDelivery": "2025-01-18T15:00:00Z"
    },
    "paymentDetails": {
      "method": "MercadoPago",
      "status": "pending",
      "paymentUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
    },
    "appliedCoupon": {
      "code": "DESCUENTO10",
      "discount": 300.00
    },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### `GET /api/orders` - Listar Pedidos del Usuario
**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
page=1
limit=10
status=pending,processing,completed
sortBy=createdAt
sortOrder=desc
```

#### `GET /api/orders/:id` - Obtener Pedido Específico
**Respuesta detallada con historial de estados:**
```json
{
  "order": {
    "id": "order123",
    "orderNumber": "ORD-2025-001234",
    "status": "processing",
    "customer": {...},
    "items": [...],
    "summary": {...},
    "shippingDetails": {...},
    "paymentDetails": {
      "method": "MercadoPago",
      "status": "approved",
      "transactionId": "123456789",
      "paidAt": "2025-01-15T10:45:00Z"
    },
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2025-01-15T10:30:00Z",
        "note": "Pedido creado"
      },
      {
        "status": "processing",
        "timestamp": "2025-01-15T10:45:00Z",
        "note": "Pago confirmado - Preparando envío"
      }
    ],
    "trackingInfo": {
      "trackingNumber": "AR123456789",
      "carrier": "Correo Argentino",
      "estimatedDelivery": "2025-01-18T15:00:00Z"
    }
  }
}
```

### API Endpoints Admin - Ventas (`/api/sales`)

#### `GET /api/sales` - Listar Todas las Ventas (Admin)
**Query Parameters:**
```
page=1
limit=20
status=pending,processing,completed,cancelled
dateFrom=2025-01-01
dateTo=2025-01-31
customerId=cust123
minAmount=1000
maxAmount=5000
paymentMethod=mercadopago
search=ORD-2025  # Buscar por número de orden
```

**Respuesta:**
```json
{
  "total": 1250,
  "sales": [
    {
      "id": "order123",
      "orderNumber": "ORD-2025-001234",
      "status": "completed",
      "customer": {
        "name": "Juan Pérez",
        "email": "juan@email.com",
        "isGuest": false
      },
      "summary": {
        "itemCount": 3,
        "total": 3830.00,
        "profit": 1200.00
      },
      "paymentDetails": {
        "method": "MercadoPago",
        "status": "approved"
      },
      "shippingCity": "CABA",
      "createdAt": "2025-01-15T10:30:00Z",
      "completedAt": "2025-01-17T14:20:00Z"
    }
  ],
  "statistics": {
    "totalSales": 1250,
    "totalRevenue": 2450000.00,
    "avgOrderValue": 1960.00,
    "pendingOrders": 45,
    "completedToday": 23
  }
}
```

#### `PUT /api/sales/:id/status` - Cambiar Estado del Pedido (Admin)
**Body:**
```json
{
  "status": "processing",
  "note": "Pago confirmado - Preparando envío"
}
```

#### `POST /api/sales/:id/tracking` - Agregar Info de Seguimiento (Admin)
**Body:**
```json
{
  "trackingNumber": "AR123456789",
  "carrier": "Correo Argentino",
  "estimatedDelivery": "2025-01-18T15:00:00Z"
}
```

## 💳 Proceso de Checkout

### Flujo Completo de Checkout

#### 1. Preparación del Carrito
```javascript
// Validar carrito antes del checkout
const validateCart = async () => {
  const cartResponse = await fetch('/api/cart');
  const { cart } = await cartResponse.json();
  
  // Verificar que hay items
  if (cart.items.length === 0) {
    throw new Error('El carrito está vacío');
  }
  
  // Verificar stock disponible
  const stockValidation = await fetch('/api/cart/validate-stock');
  if (!stockValidation.ok) {
    throw new Error('Algunos productos no tienen stock suficiente');
  }
  
  return cart;
};
```

#### 2. Selección de Dirección de Envío
```javascript
// Usuario registrado: seleccionar dirección guardada
const selectShippingAddress = async (addressId) => {
  const response = await fetch(`/api/addresses/${addressId}`);
  const address = await response.json();
  
  // Calcular costo de envío
  const shippingCost = await calculateShipping(address.neighborhoodId);
  
  return { address, shippingCost };
};

// Usuario invitado: validar nueva dirección
const validateNewAddress = async (addressData) => {
  const response = await fetch('/api/addresses/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addressData)
  });
  
  if (!response.ok) {
    const errors = await response.json();
    throw new Error(errors.message);
  }
  
  return addressData;
};
```

#### 3. Aplicar Cupón (Opcional)
```javascript
const applyCoupon = async (couponCode) => {
  const response = await fetch('/api/cart/apply-coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ couponCode })
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.discount;
  }
  
  throw new Error('Cupón inválido o expirado');
};
```

#### 4. Crear Pedido
```javascript
const createOrder = async (orderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Si es usuario registrado
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  
  if (response.ok) {
    const { order } = await response.json();
    
    // Redirigir a pago si es necesario
    if (order.paymentDetails.paymentUrl) {
      window.location.href = order.paymentDetails.paymentUrl;
    }
    
    return order;
  }
  
  throw new Error('Error al crear el pedido');
};
```

#### 5. Checkout Completo - Usuario Registrado
```javascript
const checkoutRegisteredUser = async () => {
  try {
    // 1. Validar carrito
    const cart = await validateCart();
    
    // 2. Seleccionar dirección
    const selectedAddress = await selectShippingAddress(addressId);
    
    // 3. Aplicar cupón si existe
    let discount = null;
    if (couponCode) {
      discount = await applyCoupon(couponCode);
    }
    
    // 4. Crear pedido
    const orderData = {
      shippingAddressId: selectedAddress.address.id,
      paymentMethodId: paymentMethodId,
      couponCode: couponCode,
      observations: observations
    };
    
    const order = await createOrder(orderData);
    
    // 5. Limpiar carrito
    await fetch('/api/cart', { method: 'DELETE' });
    
    return order;
    
  } catch (error) {
    console.error('Error en checkout:', error);
    throw error;
  }
};
```

#### 6. Checkout Completo - Usuario Invitado
```javascript
const checkoutGuestUser = async (customerData, shippingAddress) => {
  try {
    // 1. Validar datos del cliente
    if (!customerData.name || !customerData.email || !customerData.phone) {
      throw new Error('Datos del cliente incompletos');
    }
    
    // 2. Validar dirección
    await validateNewAddress(shippingAddress);
    
    // 3. Crear pedido
    const orderData = {
      customerData: {
        ...customerData,
        isGuest: true
      },
      shippingAddress,
      paymentMethodId,
      couponCode
    };
    
    const order = await createOrder(orderData);
    
    // 4. Limpiar carrito temporal
    await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'X-Session-ID': sessionId }
    });
    
    return order;
    
  } catch (error) {
    console.error('Error en checkout invitado:', error);
    throw error;
  }
};
```

## 📊 Estados de Pedidos

### Ciclo de Vida del Pedido

```
pending → processing → shipped → delivered
   ↓
cancelled (solo desde pending)
   ↓
refunded (desde cancelled o delivered)
```

### Estados Disponibles

#### `pending` - Pendiente
- **Descripción**: Pedido creado, esperando confirmación de pago
- **Acciones**: Puede ser cancelado por el cliente
- **Duración típica**: 15-30 minutos

#### `processing` - Procesando
- **Descripción**: Pago confirmado, preparando envío
- **Acciones**: Admin puede cancelar o marcar como enviado
- **Duración típica**: 1-2 días hábiles

#### `shipped` - Enviado
- **Descripción**: Pedido despachado, en camino al cliente
- **Acciones**: Actualizar tracking, marcar como entregado
- **Duración típica**: 2-7 días según ubicación

#### `delivered` - Entregado
- **Descripción**: Pedido recibido por el cliente
- **Acciones**: Cliente puede solicitar devolución (según política)
- **Estado final**: Sí (exitoso)

#### `cancelled` - Cancelado
- **Descripción**: Pedido cancelado antes del envío
- **Acciones**: Restock automático, proceso de reembolso
- **Estado final**: Sí (no exitoso)

#### `refunded` - Reembolsado
- **Descripción**: Dinero devuelto al cliente
- **Acciones**: Solo seguimiento
- **Estado final**: Sí (reembolso)

### Cambios de Estado Automáticos

#### Por Webhooks de MercadoPago
```javascript
// Webhook handler automático
const handlePaymentWebhook = async (paymentData) => {
  const order = await findOrderByExternalReference(paymentData.external_reference);
  
  if (paymentData.status === 'approved') {
    await updateOrderStatus(order.id, 'processing', 'Pago confirmado automáticamente');
    await sendOrderConfirmationEmail(order);
    // 🚀 IMPORTANTE: Las notificaciones de Telegram se envían SOLO cuando el pago es aprobado
    await sendTelegramNotification(`✅ Pago confirmado para pedido ${order.orderNumber}`);
  } else if (paymentData.status === 'rejected') {
    await updateOrderStatus(order.id, 'cancelled', 'Pago rechazado');
    // ❌ NO se envía notificación de Telegram para pagos rechazados
  }
};
```

**📝 Nota Importante:** 
- ✅ **Las notificaciones de Telegram se envían ÚNICAMENTE cuando el pago es aprobado** por MercadoPago vía webhook
- ❌ **NO se envían notificaciones al crear la orden** (solo se crea la orden sin notificar)
- 🎯 **Esto garantiza que solo se notifique cuando hay un pago real confirmado**

#### Por Timeouts
```javascript
// Cancelar pedidos pendientes después de 30 minutos
const cancelExpiredOrders = async () => {
  const expiredOrders = await Order.find({
    status: 'pending',
    createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }
  });
  
  for (const order of expiredOrders) {
    await updateOrderStatus(order.id, 'cancelled', 'Timeout - Pago no confirmado');
    await restoreStock(order.items);
  }
};

// Ejecutar cada 5 minutos
setInterval(cancelExpiredOrders, 5 * 60 * 1000);
```

## 💡 Ejemplos de Uso

### E-commerce Frontend - Carrito Reactivo

```javascript
const CartComponent = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar carrito al iniciar
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const headers = {};
      if (isAuthenticated) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['X-Session-ID'] = getSessionId();
      }

      const response = await fetch('/api/cart', { headers });
      const data = await response.json();
      setCart(data.cart);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isAuthenticated) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['X-Session-ID'] = getSessionId();
      }

      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, quantity })
      });

      if (response.ok) {
        await loadCart(); // Recargar carrito completo
        showNotification('Producto agregado al carrito');
      }
    } catch (error) {
      showError('Error al agregar producto');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemId);
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isAuthenticated) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['X-Session-ID'] = getSessionId();
      }

      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity })
      });

      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      showError('Error al actualizar cantidad');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const headers = {};
      if (isAuthenticated) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['X-Session-ID'] = getSessionId();
      }

      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        await loadCart();
        showNotification('Producto eliminado del carrito');
      }
    } catch (error) {
      showError('Error al eliminar producto');
    }
  };

  if (!cart) return <div>Cargando carrito...</div>;

  return (
    <div className="cart">
      <h2>Mi Carrito ({cart.summary.itemCount} items)</h2>
      
      {cart.items.map(item => (
        <div key={item.id} className="cart-item">
          <img src={item.product.images[0]} alt={item.product.name} />
          <div className="item-details">
            <h3>{item.product.name}</h3>
            <p>${item.unitPriceWithTax.toFixed(2)}</p>
          </div>
          <div className="quantity-controls">
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          </div>
          <div className="item-total">
            ${item.subtotalWithTax.toFixed(2)}
          </div>
          <button onClick={() => removeItem(item.id)}>🗑️</button>
        </div>
      ))}
      
      <div className="cart-summary">
        <div>Subtotal: ${cart.summary.subtotal.toFixed(2)}</div>
        <div>Impuestos: ${cart.summary.taxAmount.toFixed(2)}</div>
        <div>Envío: ${cart.summary.shippingCost?.toFixed(2) || '0.00'}</div>
        <div className="total">Total: ${cart.summary.total.toFixed(2)}</div>
      </div>
      
      <button 
        className="checkout-btn"
        onClick={() => window.location.href = '/checkout'}
        disabled={cart.items.length === 0}
      >
        Proceder al Checkout
      </button>
    </div>
  );
};
```

### Panel Admin - Gestión de Pedidos

```javascript
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    page: 1
  });

  const loadOrders = async () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    const response = await fetch(`/api/sales?${params}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const data = await response.json();
    setOrders(data.sales);
  };

  const updateOrderStatus = async (orderId, newStatus, note = '') => {
    try {
      const response = await fetch(`/api/sales/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, note })
      });

      if (response.ok) {
        await loadOrders(); // Recargar lista
        showNotification(`Pedido actualizado a ${newStatus}`);
      }
    } catch (error) {
      showError('Error al actualizar pedido');
    }
  };

  const addTracking = async (orderId, trackingData) => {
    try {
      const response = await fetch(`/api/sales/${orderId}/tracking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        await loadOrders();
        showNotification('Información de tracking agregada');
      }
    } catch (error) {
      showError('Error al agregar tracking');
    }
  };

  return (
    <div className="admin-orders">
      <h1>Gestión de Pedidos</h1>
      
      {/* Filtros */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="processing">Procesando</option>
          <option value="shipped">Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
        
        <input 
          type="date" 
          value={filters.dateFrom}
          onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
        />
        
        <input 
          type="text" 
          placeholder="Buscar por número de orden..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        
        <button onClick={loadOrders}>Filtrar</button>
      </div>
      
      {/* Lista de pedidos */}
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>{order.orderNumber}</h3>
              <span className={`status ${order.status}`}>{order.status}</span>
            </div>
            
            <div className="order-details">
              <p><strong>Cliente:</strong> {order.customer.name}</p>
              <p><strong>Email:</strong> {order.customer.email}</p>
              <p><strong>Total:</strong> ${order.summary.total.toFixed(2)}</p>
              <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="order-actions">
              {order.status === 'pending' && (
                <button onClick={() => updateOrderStatus(order.id, 'processing')}>
                  Confirmar Pago
                </button>
              )}
              
              {order.status === 'processing' && (
                <button onClick={() => updateOrderStatus(order.id, 'shipped')}>
                  Marcar como Enviado
                </button>
              )}
              
              {order.status === 'shipped' && (
                <button onClick={() => updateOrderStatus(order.id, 'delivered')}>
                  Marcar como Entregado
                </button>
              )}
              
              <button onClick={() => viewOrderDetail(order.id)}>
                Ver Detalle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>  );
};
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Error: "Carrito vacío"
**Síntoma:** `400 - Cart is empty`
**Causa:** Intento de hacer checkout sin productos en el carrito
**Solución:**
```javascript
// Validar carrito antes del checkout
const validateCartForCheckout = async (cartId) => {
  const cart = await Cart.findById(cartId).populate('items.productId');
  
  if (!cart || cart.items.length === 0) {
    throw new Error('El carrito está vacío');
  }
  
  // Verificar stock de cada producto
  for (const item of cart.items) {
    if (item.productId.stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${item.productId.name}`);
    }
  }
  
  return cart;
};
```

#### Error: "Stock insuficiente"
**Síntoma:** `400 - Insufficient stock for product`
**Causa:** Producto agotado entre agregar al carrito y checkout
**Solución:**
```javascript
// Sistema de reserva temporal
const reserveStockForCart = async (cartId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const cart = await Cart.findById(cartId).session(session);
    
    for (const item of cart.items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (product.stock < item.quantity) {
        throw new Error(`Solo quedan ${product.stock} unidades de ${product.name}`);
      }
      
      // Reservar stock temporalmente
      await Product.findByIdAndUpdate(
        item.productId,
        { 
          $inc: { 
            stock: -item.quantity,
            reservedStock: item.quantity 
          }
        },
        { session }
      );
    }
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

#### Error: "Pago fallido"
**Síntoma:** `500 - Payment processing failed`
**Causa:** Error en la integración con MercadoPago
**Solución:**
```javascript
// Rollback automático en caso de error de pago
const processOrderWithRollback = async (orderData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Crear orden
    const order = await Order.create([orderData], { session });
    
    // Procesar pago
    const paymentResult = await mercadoPagoService.createPreference({
      orderId: order[0]._id,
      amount: order[0].summary.total
    });
    
    if (!paymentResult.success) {
      throw new Error('Error procesando el pago');
    }
    
    await session.commitTransaction();
    return { order: order[0], payment: paymentResult };
    
  } catch (error) {
    await session.abortTransaction();
    
    // Liberar stock reservado
    await releaseReservedStock(orderData.items);
    throw error;
  } finally {
    session.endSession();
  }
};
```

#### Error: "Cupón inválido"
**Síntoma:** `400 - Invalid coupon code`
**Causa:** Cupón expirado, agotado o mal aplicado
**Solución:**
```javascript
// Validación completa de cupones
const validateCoupon = async (couponCode, cartTotal, customerId) => {
  const coupon = await Coupon.findOne({ 
    code: couponCode,
    isActive: true 
  });
  
  if (!coupon) {
    throw new Error('Cupón no encontrado');
  }
  
  // Verificar fecha de vigencia
  const now = new Date();
  if (coupon.validFrom > now || coupon.validUntil < now) {
    throw new Error('Cupón expirado');
  }
  
  // Verificar monto mínimo
  if (coupon.minimumAmount && cartTotal < coupon.minimumAmount) {
    throw new Error(`Monto mínimo requerido: $${coupon.minimumAmount}`);
  }
  
  // Verificar usos restantes
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('Cupón agotado');
  }
  
  // Verificar uso por cliente
  if (coupon.oneTimePerCustomer) {
    const alreadyUsed = await Order.findOne({
      customerId,
      'appliedCoupons.couponId': coupon._id
    });
    
    if (alreadyUsed) {
      throw new Error('Ya has usado este cupón');
    }
  }
  
  return coupon;
};
```

#### Carritos Huérfanos
**Síntoma:** Carritos que no se limpian automáticamente
**Causa:** Falta de limpieza programada
**Solución:**
```javascript
// Limpieza automática con cron job
const cleanupAbandonedCarts = async () => {
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
  
  const abandonedCarts = await Cart.find({
    lastUpdated: { $lt: cutoffDate },
    sessionId: { $exists: true } // Solo carritos de invitados
  });
  
  console.log(`Limpiando ${abandonedCarts.length} carritos abandonados`);
  
  await Cart.deleteMany({
    _id: { $in: abandonedCarts.map(cart => cart._id) }
  });
};

// Ejecutar cada hora
setInterval(cleanupAbandonedCarts, 60 * 60 * 1000);
```

### Monitoreo y Alertas

```javascript
// Alertas de stock bajo
const checkLowStock = async () => {
  const lowStockProducts = await Product.find({
    stock: { $lt: 10 },
    isActive: true
  });
  
  if (lowStockProducts.length > 0) {
    await notificationService.sendAlert({
      type: 'LOW_STOCK',
      products: lowStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        stock: p.stock
      }))
    });
  }
};

// Alertas de pedidos pendientes
const checkPendingOrders = async () => {
  const pendingOrders = await Order.find({
    status: 'pending',
    createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) } // Más de 1 hora
  });
  
  if (pendingOrders.length > 0) {
    await notificationService.sendAlert({
      type: 'PENDING_ORDERS',
      count: pendingOrders.length
    });
  }
};
```

## ✅ Mejores Prácticas

### 🛒 Gestión de Carrito
- **Persistencia inteligente** - Usuario registrado vs sesión temporal
- **Sincronización** entre dispositivos para usuarios registrados
- **Validación en tiempo real** de stock y precios
- **Limpieza automática** de carritos abandonados

```javascript
// Sincronizar carrito entre dispositivos
const syncCartAcrossDevices = async (userId) => {
  const userCarts = await Cart.find({ userId }).sort({ lastUpdated: -1 });
  
  if (userCarts.length > 1) {
    const mainCart = userCarts[0];
    const otherCarts = userCarts.slice(1);
    
    // Fusionar productos de otros carritos
    for (const cart of otherCarts) {
      for (const item of cart.items) {
        await addToCart(mainCart._id, item.productId, item.quantity);
      }
      await cart.deleteOne();
    }
  }
};
```

### 📦 Procesamiento de Pedidos
- **Transacciones ACID** para operaciones críticas
- **Estados claros** y transiciones controladas
- **Logs detallados** de cada paso del proceso
- **Rollback automático** en caso de errores

```javascript
// Patrón de estado para pedidos
class OrderStateMachine {
  static transitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'delivered': ['completed'],
    'cancelled': [], // Estado final
    'completed': [] // Estado final
  };
  
  static canTransition(from, to) {
    return this.transitions[from]?.includes(to) || false;
  }
  
  static async updateOrderStatus(orderId, newStatus, userId) {
    const order = await Order.findById(orderId);
    
    if (!this.canTransition(order.status, newStatus)) {
      throw new Error(`No se puede cambiar de ${order.status} a ${newStatus}`);
    }
    
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      changedBy: userId,
      changedAt: new Date()
    });
    
    await order.save();
    
    // Trigger notifications based on status
    await this.notifyStatusChange(order, newStatus);
  }
}
```

### 💳 Integración de Pagos
- **Webhooks confiables** para actualización de estados
- **Timeouts** y reintentos configurables
- **Logging** completo de transacciones
- **Reconciliación** automática de pagos

```javascript
// Sistema de reintentos para webhooks
const processWebhookWithRetry = async (webhookData, maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await processPaymentWebhook(webhookData);
      return; // Éxito, salir del bucle
    } catch (error) {
      attempt++;
      const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
      
      console.warn(`Webhook attempt ${attempt} failed:`, error.message);
      
      if (attempt >= maxRetries) {
        // Enviar a cola de fallos para revisión manual
        await failedWebhookQueue.add(webhookData);
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### 🎯 Experiencia de Usuario
- **Feedback inmediato** en cada acción
- **Carga optimista** con rollback en errores
- **Estados de carga** claros e informativos
- **Recuperación automática** de carritos guardados

```javascript
// Actualización optimista del carrito
const optimisticCartUpdate = async (cartId, productId, quantity) => {
  // Actualizar UI inmediatamente
  updateCartUI(productId, quantity);
  
  try {
    // Sincronizar con backend
    const result = await api.updateCartItem(cartId, productId, quantity);
    return result;
  } catch (error) {
    // Revertir cambios en caso de error
    revertCartUI(productId);
    throw error;
  }
};
```

### 📊 Analytics y Métricas
- **Funnel de conversión** detallado
- **Productos abandonados** en carrito
- **Tiempo promedio** de checkout
- **Razones de cancelación**

```javascript
// Tracking de eventos de carrito
const trackCartEvent = async (event, data) => {
  await analytics.track({
    event,
    userId: data.userId,
    sessionId: data.sessionId,
    timestamp: new Date(),
    properties: {
      cartValue: data.cartValue,
      itemCount: data.itemCount,
      step: data.checkoutStep,
      ...data.customProperties
    }
  });
};

// Eventos: cart_item_added, cart_viewed, checkout_started, 
//          payment_initiated, order_completed, etc.
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Configuración de carrito
CART_EXPIRATION_HOURS=24
MAX_ITEMS_PER_CART=50
GUEST_CART_CLEANUP_HOURS=48

# Configuración de pedidos
ORDER_TIMEOUT_MINUTES=30
AUTO_CANCEL_PENDING_ORDERS=true
DEFAULT_SHIPPING_COST=500
FREE_SHIPPING_THRESHOLD=5000

# Estados de pedidos
VALID_ORDER_STATUSES=pending,processing,shipped,delivered,cancelled,refunded
DEFAULT_ORDER_STATUS=pending

# Notificaciones
SEND_ORDER_CONFIRMATION_EMAIL=true
SEND_STATUS_UPDATE_EMAILS=true
SEND_TELEGRAM_NOTIFICATIONS=true
```

### Configuración de Stock

```typescript
// Reserva temporal de stock durante checkout
const STOCK_RESERVATION_MINUTES = 15;

// Configuración en el modelo
const productSchema = new Schema({
  stock: { type: Number, required: true, min: 0 },
  reservedStock: { type: Number, default: 0 }, // Stock temporalmente reservado
  // ...otros campos
});

// Virtual para stock disponible
productSchema.virtual('availableStock').get(function() {
  return this.stock - this.reservedStock;
});
```

### Índices de MongoDB

```javascript
// Optimizaciones para carrito
db.carts.createIndex({ "userId": 1 }, { unique: true, sparse: true });
db.carts.createIndex({ "sessionId": 1 }, { unique: true, sparse: true });
db.carts.createIndex({ "lastUpdated": 1 }); // Para limpieza automática

// Optimizaciones para pedidos
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "customerId": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1, "createdAt": -1 });
db.orders.createIndex({ "paymentDetails.transactionId": 1 });

// Para reportes y estadísticas
db.orders.createIndex({ "createdAt": -1, "status": 1 });
db.orders.createIndex({ "summary.total": -1 });
```

### Limpieza Automática

```javascript
// Limpiar carritos abandonados (diario)
const cleanupAbandonedCarts = async () => {
  const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 horas
  
  await Cart.deleteMany({
    sessionId: { $exists: true }, // Solo carritos de invitados
    lastUpdated: { $lt: cutoffDate }
  });
};

// Liberar stock reservado (cada 5 minutos)
const releaseExpiredReservations = async () => {
  const cutoffDate = new Date(Date.now() - 15 * 60 * 1000); // 15 minutos
  
  const expiredReservations = await StockReservation.find({
    createdAt: { $lt: cutoffDate },
    status: 'active'
  });
  
  for (const reservation of expiredReservations) {
    await Product.findByIdAndUpdate(reservation.productId, {
      $inc: { reservedStock: -reservation.quantity }
    });
    
    reservation.status = 'expired';
    await reservation.save();
  }
};
```

---

Para más información sobre otros módulos:
- [📦 Gestión de Productos](./api-products.md)
- [👥 Clientes y Direcciones](./api-customers.md)
- [💳 Integración MercadoPago](./mercadopago.md)
- [🔗 Sistema de Webhooks](./webhooks.md)
