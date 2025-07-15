# 🛒 Guest Checkout y Emails de Invitado

Esta guía explica cómo funciona el flujo de checkout para usuarios invitados en el backend, cómo deben formatearse los emails de invitado, los endpoints relevantes, ejemplos de request/response y consideraciones importantes para el frontend.

---

## 1. ¿Qué es un "Guest Email"?

Un **guest email** es un email generado automáticamente por el frontend para usuarios que compran sin registrarse. El backend reconoce estos emails y permite crear múltiples pedidos sin bloquear por duplicidad de email, nombre o teléfono.

**⚠️ CAMBIO IMPORTANTE:** Desde la última actualización, **CUALQUIER pedido sin JWT (sin header `Authorization`) se considera como GUEST**, independientemente del formato del email. Esto significa que los invitados pueden usar emails "normales" y aún así hacer múltiples pedidos.

**Patrones recomendados de guest email:**
- `guest_<timestamp>_<random>_<random>_<random>@checkout.guest`
- Cualquier email que termine en `@checkout.guest`
- Cualquier email que comience con `guest_`

**Emails normales también permitidos para guests:**
- `juan@gmail.com` (sin JWT = guest)
- `maria@example.com` (sin JWT = guest)

Ejemplo de guest email específico:
```text
guest_1752580352601_56436599_922668294_umy4h586z7_qwe@checkout.guest
```

---

## 2. Endpoint de Checkout para Invitados

### `POST /api/orders`

**Headers para INVITADOS:**
```
Content-Type: application/json
```
(❌ **NO incluir** `Authorization: Bearer <token>` para invitados)

**Headers para USUARIOS REGISTRADOS:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

### Campos requeridos según método de entrega

| Método de entrega      | deliveryMethodId | customerName | customerEmail | Dirección requerida |
|------------------------|:----------------:|:------------:|:-------------:|:------------------:|
| Retiro en local        |        ✅        |      ✅      |       ✅      |         ❌         |
| Entrega a domicilio    |        ✅        |      ✅      |       ✅      |         ✅         |

### Nuevos campos del body (simplificados):

```typescript
{
  // Datos del cliente (requeridos para invitados)
  customerName: string,          // Nombre del cliente
  customerEmail: string,         // Email del cliente
  
  // Items del pedido (requeridos)
  items: [
    {
      productId: string,         // ID del producto
      quantity: number,          // Cantidad
      unitPrice: number          // Precio unitario
    }
  ],
  
  // Método de entrega (requerido)
  deliveryMethodId: string,      // ID del método de entrega
  
  // Campos opcionales
  notes?: string,                // Notas del pedido
  couponCode?: string,           // Código de cupón
  
  // Solo para entrega a domicilio
  shippingRecipientName?: string,
  shippingPhone?: string,
  shippingStreetAddress?: string,
  shippingNeighborhoodId?: string,
  shippingCityId?: string,
  shippingPostalCode?: string,
  shippingAdditionalInfo?: string
}
```

---

### Ejemplo de body para invitado (retiro en local):
```json
{
  "customerName": "Juan Pérez",
  "customerEmail": "juan@gmail.com",
  "items": [
    { 
      "productId": "6807f8e6022d7fe5f9d9620d", 
      "quantity": 2, 
      "unitPrice": 100 
    }
  ],
  "deliveryMethodId": "686b18f09808aab4814098cb",
  "notes": "Retiro por la tarde"
}
```

### Ejemplo de body para invitado (entrega a domicilio):
```json
{
  "customerName": "María González",
  "customerEmail": "maria@example.com",
  "items": [
    { 
      "productId": "6807f8e6022d7fe5f9d9620d", 
      "quantity": 1, 
      "unitPrice": 150 
    }
  ],
  "deliveryMethodId": "686b18f09808aab4814098cc",
  "shippingRecipientName": "María González",
  "shippingPhone": "+1234567890",
  "shippingStreetAddress": "Av. Principal 123",
  "shippingNeighborhoodId": "67dc9ed0e260c0eef5279179",
  "shippingCityId": "67dc9ed0e260c0eef5279178",
  "shippingPostalCode": "1000",
  "notes": "Departamento 4B"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "68766f1171537bbcca28ab80",
  "customer": {
    "id": "68766f1171537bbcca28ab7a",
    "name": "Juan Pérez",
    "email": "juan@gmail.com",
    "phone": "00000000",
    "address": "dirección pendiente",
    "isActive": true,
    "userId": null
  },
  "items": [
    {
      "product": {
        "id": "6807f8e6022d7fe5f9d9620d",
        "name": "picada casera tipo 10",
        "price": 5.99
      },
      "quantity": 1,
      "unitPrice": 7.25,
      "subtotal": 7.25
    }
  ],
  "deliveryMethod": {
    "id": "686b18f09808aab4814098cb",
    "name": "Retiro en Local",
    "code": "PICKUP",
    "requiresAddress": false
  },
  "status": {
    "id": "status-id",
    "name": "PENDING",
    "code": "PENDING"
  },
  "total": 7.25,
  "subtotal": 7.25,
  "taxAmount": 0,
  "discountRate": 0,
  "discountAmount": 0,
  "createdAt": "2025-07-15T15:09:05.000Z",
  "updatedAt": "2025-07-15T15:09:05.000Z"
}
```

---

## 3. ¿Cómo reconoce el backend un pedido de invitado?

El backend determina si un pedido es de invitado basándose en **la ausencia del header Authorization**:

**Lógica simplificada:**
```typescript
if (!userId) {
  // Sin JWT = Es un invitado
  // ✅ Permite crear múltiples clientes con mismo email/nombre/teléfono
  // ✅ No valida unicidad de datos personales
  await createGuestCustomer(customerData);
} else {
  // Con JWT = Usuario registrado
  // ⚠️ Valida unicidad y restricciones normales
  existingCustomer = await findCustomerByUserId(userId);
}
```

**🚀 BENEFICIO:** Los invitados pueden hacer múltiples pedidos con la misma información personal sin ninguna restricción.

---

## 4. Diagrama de Flujo Guest Checkout

```mermaid
flowchart TD
    A[Frontend: Usuario quiere comprar] --> B{¿Está logueado?}
    
    B -->|SÍ| C[Incluir JWT en header]
    B -->|NO| D[NO incluir JWT en header]
    
    C --> E[POST /api/orders con Authorization]
    D --> F[POST /api/orders sin Authorization]
    
    E --> G[Backend: userId presente]
    F --> H[Backend: userId undefined]
    
    G --> I[Buscar cliente por userId]
    H --> J[Es invitado: crear nuevo cliente]
    
    I --> K[Validar restricciones de usuario registrado]
    J --> L[No validar unicidad de datos]
    
    K --> M[Crear pedido]
    L --> M[Crear pedido]
    
    M --> N[Respuesta 201 con orden creada]
    
    style D fill:#e1f5fe
    style F fill:#e1f5fe
    style H fill:#e1f5fe
    style J fill:#e1f5fe
    style L fill:#e1f5fe
```

### Secuencia detallada:

```mermaid
sequenceDiagram
    participant F as Frontend
    participant API as Backend API
    participant DB as MongoDB
    participant UC as CreateOrderUseCase

    F->>API: POST /api/orders (sin Authorization)
    Note over F,API: customerEmail puede ser cualquiera
    
    API->>UC: execute(orderData, userId=undefined)
    Note over UC: userId undefined = invitado
    
    UC->>UC: Detectar que es invitado
    UC->>DB: Crear nuevo cliente (sin validar unicidad)
    DB-->>UC: Cliente creado: ID_NUEVO
    
    UC->>DB: Crear pedido con cliente ID_NUEVO
    DB-->>UC: Pedido creado
    
    UC-->>API: Orden completa
    API-->>F: 201 - Orden creada exitosamente
    
    Note over F,DB: ✅ Mismo email puede usarse múltiples veces
```

---

## 5. Consideraciones para el Frontend

### ✅ Permitido para invitados:
- ✅ **Múltiples pedidos con mismo email** (`juan@gmail.com`)
- ✅ **Múltiples pedidos con mismo nombre** (`Juan Pérez`)
- ✅ **Múltiples pedidos con mismo teléfono** (`+1234567890`)
- ✅ **Usar emails "normales"** (`maria@example.com`)
- ✅ **Usar guest emails específicos** (`guest_123@checkout.guest`)

### ❌ Restricciones:
- ❌ **NO incluir JWT** para invitados (sin `Authorization` header)
- ❌ **NO intentar login** con datos de invitado

### 📋 Mejores prácticas:
1. **Para invitados:** Omitir completamente el header `Authorization`
2. **Para usuarios registrados:** Siempre incluir `Authorization: Bearer <token>`
3. **Validación de campos:** El frontend debe validar campos requeridos según método de entrega
4. **UX:** Mostrar al usuario que como invitado puede repetir datos sin problemas

---

## 6. Ejemplos de Request/Response

### Request 1: Invitado con email normal (✅ Permitido)
```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "Ana López",
  "customerEmail": "ana@hotmail.com",
  "items": [
    { "productId": "6807f8e6022d7fe5f9d9620d", "quantity": 1, "unitPrice": 50 }
  ],
  "deliveryMethodId": "686b18f09808aab4814098cb",
  "notes": "Primer pedido como invitada"
}
```

### Response 1: (201)
```json
{
  "id": "orden_id_1",
  "customer": {
    "id": "cliente_id_1",
    "name": "Ana López",
    "email": "ana@hotmail.com",
    "userId": null
  },
  "total": 50,
  "status": { "code": "PENDING" }
}
```

### Request 2: Mismo email, otro pedido (✅ También permitido)
```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "Ana López",
  "customerEmail": "ana@hotmail.com",
  "items": [
    { "productId": "6807f8e6022d7fe5f9d9620d", "quantity": 2, "unitPrice": 50 }
  ],
  "deliveryMethodId": "686b18f09808aab4814098cb",
  "notes": "Segundo pedido como invitada"
}
```

### Response 2: (201) - Nuevo cliente creado
```json
{
  "id": "orden_id_2",
  "customer": {
    "id": "cliente_id_2",
    "name": "Ana López", 
    "email": "ana@hotmail.com",
    "userId": null
  },
  "total": 100,
  "status": { "code": "PENDING" }
}
```

### Request 3: Usuario registrado (❌ Email ya registrado)
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "items": [
    { "productId": "6807f8e6022d7fe5f9d9620d", "quantity": 1, "unitPrice": 50 }
  ],
  "deliveryMethodId": "686b18f09808aab4814098cb"
}
```

### Response 3: Si usa un email ya registrado (400)
```json
{
  "error": "El email 'ana@hotmail.com' ya está registrado. Inicia sesión para continuar."
}
```

---

## 7. Errores Comunes y Soluciones

### Error: "El email ya está registrado"
**Causa:** Enviaste un JWT de usuario registrado pero el email ya existe en otro usuario.
**Solución:** El usuario debe hacer login con sus credenciales correctas.

### Error: "Missing required fields"
**Causa:** Faltan campos requeridos según el método de entrega.
**Solución:** Para retiro en local solo necesitas `customerName`, `customerEmail`, `items`, `deliveryMethodId`. Para entrega a domicilio agregar campos de dirección.

### Error: "Product not found"
**Causa:** El `productId` no existe o está inactivo.
**Solución:** Verificar que el producto existe y está disponible.

### Error: "Delivery method not found"
**Causa:** El `deliveryMethodId` no existe.
**Solución:** Usar `GET /api/delivery-methods` para obtener métodos disponibles.

---

## 8. Métodos de Entrega

Para obtener los métodos de entrega disponibles:

```http
GET /api/delivery-methods
```

Response:
```json
[
  {
    "id": "686b18f09808aab4814098cb",
    "name": "Retiro en Local",
    "code": "PICKUP", 
    "requiresAddress": false,
    "isActive": true
  },
  {
    "id": "686b18f09808aab4814098cc", 
    "name": "Entrega a Domicilio",
    "code": "DELIVERY",
    "requiresAddress": true,
    "isActive": true
  }
]
```

---

## 9. Preguntas Frecuentes (FAQ)

**Q: ¿Puedo usar el mismo email para múltiples pedidos de invitado?**
A: ✅ Sí, es completamente permitido.

**Q: ¿Qué diferencia hay entre usar `ana@gmail.com` y `guest_123@checkout.guest`?**
A: Ninguna diferencia si no incluyes JWT. Ambos se tratan como invitados.

**Q: ¿El backend crea clientes duplicados?**
A: Sí, para invitados se crea un nuevo cliente en cada pedido (esto es intencional).

**Q: ¿Puedo hacer login con datos de pedidos de invitado?**
A: No, los clientes de invitado no tienen cuenta de usuario (`userId: null`).

**Q: ¿El guest checkout requiere JWT?**
A: No, de hecho **NO debe incluir JWT**.

**Q: ¿Qué pasa si incluyo JWT con datos incorrectos?**
A: El backend aplicará las validaciones de usuario registrado y puede fallar.

---

## 10. Testing

Para probar el flujo de invitados, puedes usar estos scripts de ejemplo:

```bash
# Test 1: Primer pedido de invitado
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@gmail.com", 
    "items": [{"productId": "6807f8e6022d7fe5f9d9620d", "quantity": 1, "unitPrice": 100}],
    "deliveryMethodId": "686b18f09808aab4814098cb"
  }'

# Test 2: Segundo pedido con mismo email (debe funcionar)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User", 
    "customerEmail": "test@gmail.com",
    "items": [{"productId": "6807f8e6022d7fe5f9d9620d", "quantity": 2, "unitPrice": 100}],
    "deliveryMethodId": "686b18f09808aab4814098cb"
  }'
```

---

## 11. Diagrama de Flujo Detallado - Guest vs Registrado

### Comparación de Flujos

```mermaid
graph TD
    A[Usuario llega al checkout] --> B{¿Tiene cuenta?}
    
    B -->|SÍ| C[Login]
    B -->|NO| D[Continuar como invitado]
    
    C --> E[Token JWT obtenido]
    D --> F[Sin token JWT]
    
    E --> G[POST /api/orders CON Authorization]
    F --> H[POST /api/orders SIN Authorization]
    
    G --> I[Backend: userId presente]
    H --> J[Backend: userId undefined]
    
    I --> K[Buscar cliente por userId]
    J --> L[Crear nuevo cliente invitado]
    
    K --> M{¿Cliente existe?}
    L --> N[Cliente creado con userId: null]
    
    M -->|SÍ| O[Usar cliente existente]
    M -->|NO| P[Error: cliente no encontrado]
    
    O --> Q[Validar restricciones usuario registrado]
    N --> R[Sin validaciones de unicidad]
    
    Q --> S[Crear pedido]
    R --> S[Crear pedido]
    
    S --> T[Respuesta 201 - Pedido creado]
    P --> U[Respuesta 400 - Error]
    
    style D fill:#e8f5e8
    style F fill:#e8f5e8
    style H fill:#e8f5e8
    style J fill:#e8f5e8
    style L fill:#e8f5e8
    style N fill:#e8f5e8
    style R fill:#e8f5e8
```

### Secuencia Comparativa

```mermaid
sequenceDiagram
    participant FG as Frontend (Guest)
    participant FR as Frontend (Registrado)
    participant API as Backend API
    participant UC as CreateOrderUseCase
    participant DB as MongoDB

    Note over FG,DB: FLUJO INVITADO
    FG->>API: POST /api/orders (sin Authorization)
    API->>UC: execute(data, userId=undefined)
    UC->>UC: Detectar invitado
    UC->>DB: Crear cliente nuevo
    DB-->>UC: Cliente ID_GUEST
    UC->>DB: Crear pedido
    DB-->>UC: Pedido creado
    UC-->>API: Pedido completo
    API-->>FG: 201 - Éxito
    
    Note over FG,DB: FLUJO REGISTRADO
    FR->>API: POST /api/orders (con Authorization: Bearer...)
    API->>UC: execute(data, userId=USER_ID)
    UC->>DB: Buscar cliente por userId
    DB-->>UC: Cliente existente
    UC->>UC: Validar restricciones
    UC->>DB: Crear pedido
    DB-->>UC: Pedido creado
    UC-->>API: Pedido completo
    API-->>FR: 201 - Éxito
```

---

## 12. Matriz de Características Guest vs Registrado

| Característica | Usuario Invitado (Guest) | Usuario Registrado |
|----------------|:------------------------:|:------------------:|
| **Requiere JWT** | ❌ No | ✅ Sí |
| **Email duplicado** | ✅ Permitido | ❌ Bloqueado |
| **Nombre duplicado** | ✅ Permitido | ❌ Bloqueado |
| **Teléfono duplicado** | ✅ Permitido | ❌ Bloqueado |
| **Múltiples pedidos** | ✅ Ilimitados | ✅ Ilimitados |
| **Historial pedidos** | ❌ No accesible | ✅ Accesible |
| **Carrito persistente** | ❌ No | ✅ Sí |
| **Direcciones guardadas** | ❌ No | ✅ Sí |
| **Método de pago guardado** | ❌ No | ✅ Sí |
| **Notificaciones** | ❌ No | ✅ Sí |
| **Crear cuenta posterior** | ✅ Posible | N/A |
| **Validación de datos** | ✅ Básica | ✅ Completa |
| **Cliente BD** | ✅ Nuevo c/pedido | ✅ Uno existente |

---

## 13. Flujo de Migración (Guest → Registrado)

### Cuando un invitado quiere crear cuenta después:

```mermaid
flowchart TD
    A[Usuario invitado con pedidos previos] --> B[Decide registrarse]
    B --> C[POST /api/auth/register]
    C --> D[Sistema crea usuario]
    D --> E{¿Migrar pedidos?}
    
    E -->|SÍ| F[Buscar pedidos por email]
    E -->|NO| G[Cuenta nueva sin historial]
    
    F --> H[Encontrar múltiples clientes guest]
    H --> I[Crear cliente registrado]
    I --> J[Actualizar pedidos con nuevo customerId]
    J --> K[Desactivar clientes guest antiguos]
    K --> L[Migración completa]
    
    style A fill:#ffeaa7
    style L fill:#00b894
```

**Consideraciones técnicas:**
- Los clientes guest mantienen `userId: null`
- Al registrarse, se crea un nuevo cliente con `userId: NUEVO_USER_ID`
- Los pedidos pueden migrarse buscando por email
- Los clientes guest pueden marcarse como `isActive: false`

---

## 14. Troubleshooting Avanzado

### Problema: "El email ya está registrado"
```json
{
  "error": "El email 'test@gmail.com' ya está registrado. Inicia sesión para continuar."
}
```
**Causa:** Usuario está enviando JWT pero el email pertenece a otro usuario registrado.
**Solución:** 
1. Verificar que el JWT corresponde al usuario correcto
2. Si es invitado, remover el header `Authorization`
3. Si quiere usar cuenta existente, hacer login primero

### Problema: Campos faltantes para entrega
```json
{
  "error": "shippingStreetAddress is required for delivery orders"
}
```
**Causa:** Método de entrega requiere dirección pero no se proporcionó.
**Solución:** Agregar campos de dirección completos para `deliveryMethodId` de tipo "DELIVERY".

### Problema: Multiple customers con mismo email
**Situación:** Múltiples clientes guest con mismo email en BD.
**¿Es normal?** ✅ Sí, es el comportamiento esperado.
**¿Requiere acción?** ❌ No, cada pedido guest crea un cliente nuevo intencionalmente.

### Problema: Cliente guest quiere ver historial
**Situación:** Usuario invitado quiere ver pedidos anteriores.
**Solución:** 
1. Solicitar que se registre
2. Migrar pedidos por email durante registro
3. Proveer acceso a historial completo

---

> **💡 Tip para Desarrolladores:** La duplicidad de clientes guest es **intencional** y **esperada**. No intentar "optimizar" creando lógica de reutilización para invitados, ya que esto rompe la simplicidad del flujo.

> **📞 Soporte:** Para dudas sobre migración guest → registrado, consultar documentación de autenticación en `/docs/api-auth.md`.
