
# API - Métodos de Entrega (Delivery Methods)

## Descripción

Esta API permite gestionar y consultar los métodos de entrega disponibles para los pedidos. Los métodos de entrega definen cómo el cliente recibirá su pedido (envío a domicilio, retiro en local, etc.).

---

## Modelo de Datos

### DeliveryMethod

```typescript
interface DeliveryMethod {
  id: string;                // ID único (Mongo ObjectId)
  code: string;              // Código único (ej: 'PICKUP', 'DELIVERY', 'EXPRESS')
  name: string;              // Nombre descriptivo
  description?: string;      // Descripción del método
  requiresAddress: boolean;  // Si requiere dirección de envío
  isActive: boolean;         // Si está activo
  createdAt?: string;        // Fecha de creación (ISO)
  updatedAt?: string;        // Fecha de actualización (ISO)
}
```

---

## Endpoints Públicos

### `GET /api/delivery-methods`

Obtiene la lista de métodos de entrega activos.

- **Autenticación:** No requerida

**Respuesta exitosa (200):**
```json
[
  {
    "id": "662ab638a9c878b4009af9dc",
    "code": "DELIVERY",
    "name": "Entrega a Domicilio",
    "description": "Recibe tu pedido en la puerta de tu casa.",
    "requiresAddress": true,
    "isActive": true
  },
  {
    "id": "662ab638a9c878b4009af9de",
    "code": "PICKUP",
    "name": "Retiro en Local",
    "description": "Acércate a nuestra tienda a retirar tu pedido.",
    "requiresAddress": false,
    "isActive": true
  }
]
```

---

## Endpoints Administrativos

> **IMPORTANTE:** Todos los endpoints admin requieren autenticación JWT y rol `SUPER_ADMIN`.  
> **Header:** `Authorization: Bearer <token>`

### `GET /api/delivery-methods/admin`

Obtiene todos los métodos de entrega (activos e inactivos) con paginación.

- **Query params:**
  - `page` (opcional, default 1)
  - `limit` (opcional, default 10)

**Respuesta exitosa (200):**
```json
{
  "deliveryMethods": [
    {
      "id": "...",
      "code": "DELIVERY",
      "name": "Entrega a Domicilio",
      "description": "Recibe tu pedido en la puerta de tu casa.",
      "requiresAddress": true,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "next": "/api/delivery-methods/admin?page=2&limit=10",
    "prev": null
  }
}
```

---

### `POST /api/delivery-methods/admin`

Crea un nuevo método de entrega.

**Body:**
```json
{
  "code": "EXPRESS",
  "name": "Entrega Express",
  "description": "Entrega el mismo día (servicio premium).",
  "requiresAddress": true,
  "isActive": true
}
```

**Respuesta exitosa (201):**  
Objeto `DeliveryMethod` creado.

**Validaciones:**
- `code`: Requerido, único, string, se guarda en mayúsculas
- `name`: Requerido, string
- `description`: Opcional, string
- `requiresAddress`: Requerido, boolean
- `isActive`: Opcional, boolean (default: true)

---

### `GET /api/delivery-methods/admin/:id`

Obtiene un método de entrega por ID.

**Respuesta exitosa (200):**  
Objeto `DeliveryMethod`.

---

### `PUT /api/delivery-methods/admin/:id`

Actualiza un método de entrega existente (parcial o total).

**Body:**
```json
{
  "name": "Nuevo nombre",
  "isActive": false
}
```

**Respuesta exitosa (200):**  
Objeto `DeliveryMethod` actualizado.

---

### `DELETE /api/delivery-methods/admin/:id`

Elimina un método de entrega.

**Respuesta exitosa (204):**  
Sin contenido (No Content).

---

## Integración con Orders

El modelo `Order` incluye el campo `deliveryMethod` como referencia requerida:

```typescript
interface Order {
  // ...otros campos
  deliveryMethod: string; // ID del método de entrega (REQUERIDO)
  // ...otros campos
}
```

Al crear una orden desde el frontend, debes incluir el `deliveryMethodId`:

```javascript
const orderData = {
  customerId: "customer-id",
  items: [...],
  deliveryMethodId: "662ab638a9c878b4009af9dc", // ID del método seleccionado
  // otros campos...
};

fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

---

## Datos Iniciales (Seeders)

El sistema incluye 3 métodos de entrega por defecto:

1. **Entrega a Domicilio (DELIVERY)**
   - Requiere dirección de envío
2. **Retiro en Local (PICKUP)**
   - No requiere dirección de envío
3. **Entrega Express (EXPRESS)**
   - Requiere dirección de envío

---

## Lógica de Negocio y Flujo Frontend

### Consideraciones para el Frontend

1. **Mostrar métodos disponibles:** Usar `GET /api/delivery-methods`.
2. **Validar dirección:** Si `requiresAddress: true`, mostrar y validar campos de dirección.
3. **Selección obligatoria:** El usuario debe seleccionar un método antes de finalizar la compra.
4. **Mostrar descripción:** Mostrar el campo `description` para que el usuario entienda cada opción.

### Flujo recomendado en el checkout

```mermaid
flowchart TD
    A[Cargar métodos de entrega (GET /api/delivery-methods)] --> B[Mostrar opciones al usuario]
    B --> C{¿requiresAddress?}
    C -- Sí --> D[Mostrar formulario de dirección]
    C -- No --> E[Ocultar formulario de dirección]
    D & E --> F[Validar selección]
    F --> G[Incluir deliveryMethodId al crear la orden]
    G --> H[POST /api/orders]
```

---

## Códigos de Error

- **400**: Datos inválidos en el request (validación de DTOs)
- **401**: No autenticado (solo endpoints admin)
- **403**: Sin permisos de super administrador
- **404**: Método de entrega no encontrado
- **500**: Error interno del servidor

---

## Notas Técnicas

- Los métodos de entrega se almacenan en la colección `deliverymethods`.
- El campo `code` es único y se guarda en mayúsculas.
- Los seeders insertan 3 métodos por defecto: `PICKUP`, `DELIVERY`, `EXPRESS`.
- El endpoint público retorna solo los métodos activos (`isActive: true`).
- El endpoint admin soporta paginación.
- El endpoint DELETE responde con 204 No Content.
- Se recomienda usar populate en las órdenes para traer información completa del método.

---

**Última actualización: 09/07/2025**

---
> **Header:** `Authorization: Bearer <token>`

### GET /api/delivery-methods/admin
Obtiene todos los métodos de entrega (activos e inactivos) con paginación.

**Query params:**
- `page` (opcional, default 1)
- `limit` (opcional, default 10)

**Respuesta exitosa (200):**
```json
{
  "deliveryMethods": [
    {
      "id": "...",
      "code": "DELIVERY",
      "name": "Entrega a Domicilio",
      "description": "Recibe tu pedido en la puerta de tu casa.",
      "requiresAddress": true,
      "isActive": true
    },
    // ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "next": "/api/delivery-methods/admin?page=2&limit=10",
    "prev": null
  }
}
```

### POST /api/delivery-methods/admin
Crea un nuevo método de entrega.

**Body:**
```json
{
  "code": "EXPRESS",
  "name": "Entrega Express",
  "description": "Entrega el mismo día (servicio premium).",
  "requiresAddress": true,
  "isActive": true
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "...",
  "code": "EXPRESS",
  "name": "Entrega Express",
  "description": "Entrega el mismo día (servicio premium).",
  "requiresAddress": true,
  "isActive": true
}
```

**Validaciones:**
- `code`: Requerido, único, string, se guarda en mayúsculas
- `name`: Requerido, string
- `description`: Opcional, string
- `requiresAddress`: Requerido, boolean
- `isActive`: Opcional, boolean (default: true)

### GET /api/delivery-methods/admin/:id
Obtiene un método de entrega por ID.

**Respuesta exitosa (200):** DeliveryMethod

### PUT /api/delivery-methods/admin/:id
Actualiza un método de entrega existente (parcial o total).

**Body:**
```json
{
  "name": "Nuevo nombre",
  "isActive": false
}
```

**Respuesta exitosa (200):** DeliveryMethod actualizado

### DELETE /api/delivery-methods/admin/:id
Elimina un método de entrega.

**Respuesta exitosa (204):** Sin contenido (No Content)


## Integración con Orders

El modelo `Order` incluye el campo `deliveryMethod` como referencia requerida:

```typescript
interface Order {
  // ...otros campos
  deliveryMethod: string; // ID del método de entrega (REQUERIDO)
  // ...otros campos
}
```

Al crear una orden desde el frontend, debes incluir el `deliveryMethodId`:

```javascript
const orderData = {
  customerId: "customer-id",
  items: [...],
  deliveryMethodId: "662ab638a9c878b4009af9dc", // ID del método seleccionado
  // otros campos...
};

fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```


## Datos Iniciales (Seeders)

El sistema incluye 3 métodos de entrega por defecto:

1. **Entrega a Domicilio (DELIVERY)**
   - Requiere dirección de envío
   - Para entregas en el domicilio del cliente
2. **Retiro en Local (PICKUP)**
   - No requiere dirección de envío
   - Para retirar en la tienda física
3. **Entrega Express (EXPRESS)**
   - Requiere dirección de envío
   - Entrega el mismo día (servicio premium)


## Lógica de Negocio y Flujo Frontend

### Consideraciones para el Frontend
1. **Mostrar métodos disponibles:** Usar `GET /api/delivery-methods`.
2. **Validar dirección:** Si `requiresAddress: true`, mostrar y validar campos de dirección.
3. **Selección obligatoria:** El usuario debe seleccionar un método antes de finalizar la compra.
4. **Mostrar descripción:** Mostrar el campo `description` para que el usuario entienda cada opción.

### Flujo recomendado en el checkout

```mermaid
flowchart TD
    A[Cargar métodos de entrega (GET /api/delivery-methods)] --> B[Mostrar opciones al usuario]
    B --> C{¿requiresAddress?}
    C -- Sí --> D[Mostrar formulario de dirección]
    C -- No --> E[Ocultar formulario de dirección]
    D & E --> F[Validar selección]
    F --> G[Incluir deliveryMethodId al crear la orden]
    G --> H[POST /api/orders]
```


## Códigos de Error

- **400**: Datos inválidos en el request (validación de DTOs)
- **401**: No autenticado (solo endpoints admin)
- **403**: Sin permisos de super administrador
- **404**: Método de entrega no encontrado
- **500**: Error interno del servidor


## Notas Técnicas

- Los métodos de entrega se almacenan en la colección `deliverymethods`.
- El campo `code` es único y se guarda en mayúsculas.
- Los seeders insertan 3 métodos por defecto: `PICKUP`, `DELIVERY`, `EXPRESS`.
- El endpoint público retorna solo los métodos activos (`isActive: true`).
- El endpoint admin soporta paginación.
- El endpoint DELETE responde con 204 No Content.
- Se recomienda usar populate en las órdenes para traer información completa del método.

---

Última actualización: 08/07/2025
