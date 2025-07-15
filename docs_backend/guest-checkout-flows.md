# 🔄 Diagramas de Flujo - Guest Checkout

Esta documentación proporciona diagramas visuales del flujo de checkout para usuarios invitados y registrados, diseñada específicamente para el equipo de frontend.

---

## 🎯 Flujo Principal: Guest vs Registrado

```mermaid
flowchart TD
    A[🛒 Usuario en Checkout] --> B{👤 ¿Logueado?}
    
    B -->|✅ SÍ| C[🔑 Incluir JWT]
    B -->|❌ NO| D[🚫 Sin JWT]
    
    C --> E[📤 POST /api/orders + Authorization]
    D --> F[📤 POST /api/orders SIN Authorization]
    
    E --> G[🔍 Backend verifica userId]
    F --> H[👻 Backend detecta Guest]
    
    G --> I[🔄 Usar cliente existente]
    H --> J[➕ Crear cliente nuevo]
    
    I --> K[✅ Pedido registrado]
    J --> L[✅ Pedido invitado]
    
    style D fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style F fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style H fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style J fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style L fill:#e1f5fe,stroke:#01579b,stroke-width:2px
```

---

## 🛡️ Validaciones por Tipo de Usuario

```mermaid
flowchart LR
    A[📝 Datos del cliente] --> B{🤔 ¿Tipo de usuario?}
    
    B -->|👻 Guest| C[🟢 Sin validaciones]
    B -->|👤 Registrado| D[🔴 Con validaciones]
    
    C --> E[✅ Email duplicado OK]
    C --> F[✅ Nombre duplicado OK]
    C --> G[✅ Teléfono duplicado OK]
    
    D --> H[❌ Email único requerido]
    D --> I[❌ Validar datos existentes]
    D --> J[🔍 Buscar cliente por userId]
    
    E --> K[🚀 Crear pedido]
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    
    style C fill:#c8e6c9
    style E fill:#c8e6c9
    style F fill:#c8e6c9
    style G fill:#c8e6c9
    style D fill:#ffcdd2
    style H fill:#ffcdd2
    style I fill:#ffcdd2
    style J fill:#ffcdd2
```

---

## 📊 Campos Requeridos por Método de Entrega

```mermaid
flowchart TD
    A[🚚 Método de entrega] --> B{📦 Tipo}
    
    B -->|🏪 Retiro en local| C[📋 Campos básicos]
    B -->|🚛 Entrega a domicilio| D[📋 Campos completos]
    
    C --> E[👤 customerName]
    C --> F[📧 customerEmail]
    C --> G[🛍️ items]
    C --> H[🚚 deliveryMethodId]
    
    D --> I[👤 customerName]
    D --> J[📧 customerEmail]
    D --> K[🛍️ items]
    D --> L[🚚 deliveryMethodId]
    D --> M[🏠 shippingRecipientName]
    D --> N[📞 shippingPhone]
    D --> O[🗺️ shippingStreetAddress]
    D --> P[🏘️ shippingNeighborhoodId]
    D --> Q[🌆 shippingCityId]
    
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

---

## 🔄 Secuencia Detallada - Guest Checkout

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant F as 💻 Frontend
    participant A as 🔌 API
    participant UC as ⚙️ UseCase
    participant DB as 🗄️ MongoDB
    
    Note over U,DB: FLUJO COMPLETO GUEST CHECKOUT
    
    U->>F: 🛒 Inicia checkout
    F->>F: 🔍 Verifica: ¿usuario logueado?
    F->>F: ❌ No hay token JWT
    
    F->>A: 📤 POST /api/orders (sin Authorization)
    Note over F,A: Body: customerName, customerEmail, items, etc.
    
    A->>UC: ⚙️ execute(data, userId=undefined)
    UC->>UC: 👻 Detecta: es usuario invitado
    
    UC->>DB: ➕ Crear nuevo cliente
    Note over UC,DB: userId: null, email: cualquiera
    DB-->>UC: ✅ Cliente creado (ID_NUEVO)
    
    UC->>DB: 🛍️ Crear pedido con cliente ID_NUEVO
    DB-->>UC: ✅ Pedido creado
    
    UC-->>A: 📦 Orden completa
    A-->>F: 🎉 201 - Pedido exitoso
    F-->>U: ✅ Confirmación de compra
    
    Note over U,DB: ✨ Proceso completado sin restricciones
```

---

## 🚀 Secuencia Comparativa - Múltiples Pedidos Guest

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant F as 💻 Frontend
    participant A as 🔌 API
    participant DB as 🗄️ MongoDB
    
    Note over U,DB: PRIMER PEDIDO
    U->>F: 🛒 Compra #1
    F->>A: 📤 POST /api/orders (juan@gmail.com)
    A->>DB: ➕ Crear Cliente_1 (juan@gmail.com)
    DB-->>A: ✅ Pedido_1 creado
    A-->>F: 🎉 Éxito
    
    Note over U,DB: SEGUNDO PEDIDO (MISMO EMAIL)
    U->>F: 🛒 Compra #2 
    F->>A: 📤 POST /api/orders (juan@gmail.com)
    A->>DB: ➕ Crear Cliente_2 (juan@gmail.com) ✅ PERMITIDO
    DB-->>A: ✅ Pedido_2 creado
    A-->>F: 🎉 Éxito
    
    Note over U,DB: TERCER PEDIDO (MISMO EMAIL)
    U->>F: 🛒 Compra #3
    F->>A: 📤 POST /api/orders (juan@gmail.com)
    A->>DB: ➕ Crear Cliente_3 (juan@gmail.com) ✅ PERMITIDO
    DB-->>A: ✅ Pedido_3 creado
    A-->>F: 🎉 Éxito
    
    Note over U,DB: 🎯 RESULTADO: 3 clientes, 3 pedidos, mismo email
```

---

## ⚠️ Flujo de Errores Comunes

```mermaid
flowchart TD
    A[🚀 Intento de checkout] --> B{🔍 ¿Tiene errores?}
    
    B -->|❌ Error 1| C[JWT + Email diferente]
    B -->|❌ Error 2| D[Campos faltantes]
    B -->|❌ Error 3| E[Producto inexistente]
    B -->|❌ Error 4| F[Método entrega inválido]
    B -->|✅ Sin errores| G[🎉 Pedido exitoso]
    
    C --> H[🛠️ Solución: Verificar JWT correcto]
    D --> I[🛠️ Solución: Agregar campos según entrega]
    E --> J[🛠️ Solución: Validar productId existente]
    F --> K[🛠️ Solución: Usar deliveryMethodId válido]
    
    H --> L[🔄 Reintentar]
    I --> L
    J --> L
    K --> L
    
    style C fill:#ffcdd2
    style D fill:#ffcdd2
    style E fill:#ffcdd2
    style F fill:#ffcdd2
    style G fill:#c8e6c9
```

---

## 🛠️ Guía de Implementación Frontend

### ✅ Checklist para Implementar Guest Checkout

```mermaid
flowchart TD
    A[📋 Checklist Frontend] --> B[🔍 1. Detectar usuario]
    B --> C[🚫 2. NO incluir JWT para guests]
    C --> D[📝 3. Recopilar datos mínimos]
    D --> E[🚚 4. Validar método entrega]
    E --> F[📤 5. Enviar POST correcto]
    F --> G[✅ 6. Manejar respuesta]
    
    style A fill:#e3f2fd
    style G fill:#c8e6c9
```

### 🎯 Validaciones Recomendadas Frontend

```javascript
// ✅ Función de validación recomendada
function validarFormularioGuest(datos, metodoEntrega) {
  const errores = [];
  
  // Campos siempre requeridos
  if (!datos.customerName) errores.push('Nombre requerido');
  if (!datos.customerEmail) errores.push('Email requerido');
  if (!datos.items?.length) errores.push('Productos requeridos');
  if (!datos.deliveryMethodId) errores.push('Método entrega requerido');
  
  // Solo para entrega a domicilio
  if (metodoEntrega.requiresAddress) {
    if (!datos.shippingRecipientName) errores.push('Nombre destinatario requerido');
    if (!datos.shippingPhone) errores.push('Teléfono requerido');
    if (!datos.shippingStreetAddress) errores.push('Dirección requerida');
    if (!datos.shippingNeighborhoodId) errores.push('Barrio requerido');
    if (!datos.shippingCityId) errores.push('Ciudad requerida');
  }
  
  return errores;
}
```

---

## 📱 Ejemplos de UI/UX

### Flujo Recomendado en Frontend

```mermaid
flowchart TD
    A[🛒 Página Checkout] --> B{👤 Usuario logueado?}
    
    B -->|✅ SÍ| C[🔄 Cargar datos usuario]
    B -->|❌ NO| D[📝 Mostrar formulario guest]
    
    C --> E[✅ Datos pre-completados]
    D --> F[📋 Campos vacíos para completar]
    
    E --> G[🚚 Seleccionar método entrega]
    F --> G
    
    G --> H{🏪 ¿Retiro o entrega?}
    
    H -->|🏪 Retiro| I[📝 Solo datos básicos]
    H -->|🚛 Entrega| J[📝 Agregar dirección completa]
    
    I --> K[🎯 Finalizar pedido]
    J --> K
    
    K --> L[✅ Confirmación]
    
    style D fill:#e1f5fe
    style F fill:#e1f5fe
    style I fill:#e8f5e8
    style J fill:#fff3e0
    style L fill:#c8e6c9
```

---

## 🎨 Diseño de Mensajes Usuario

### Mensajes Recomendados

**Para invitados (checkout rápido):**
```
🛒 Checkout Rápido
✅ Sin registro necesario
✅ Mismos datos reutilizables
🚀 Compra en segundos
```

**Diferenciar flujos:**
```
👤 ¿Ya tienes cuenta?
   [🔑 Iniciar Sesión] [👻 Continuar como invitado]

👻 Checkout como invitado:
   • No necesitas crear cuenta
   • Puedes usar el mismo email varias veces
   • Proceso más rápido
```

**Confirmación exitosa:**
```
🎉 ¡Pedido creado exitosamente!
📧 Recibirás confirmación en: juan@gmail.com
📦 Número de pedido: #12345
🕐 Estado: Pendiente
```

---

> **💡 Tip:** Este documento debe usarse como referencia rápida durante el desarrollo. Para detalles técnicos específicos, consultar `guest-checkout.md` y `api-orders.md`.

> **🔄 Actualización:** Última versión: Enero 2025 - Flujo simplificado sin validaciones de duplicidad para guests.
