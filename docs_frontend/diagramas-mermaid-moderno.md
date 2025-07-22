# Diagramas Mermaid Modernos v10+

Esta versión utiliza sintaxis moderna de Mermaid v10+ compatible con las extensiones más recientes.

## 🔄 Flujo Principal de Checkout (Moderno)

```mermaid
flowchart TD
    A[Usuario accede a Checkout] --> B{¿Autenticado?}
    B -->|SÍ| C[Cargar Perfil Usuario]
    B -->|NO| D[Mostrar Formulario Invitado]
    C --> E[Cargar Direcciones Guardadas]
    D --> F[Capturar Datos Básicos]
    E --> G[Seleccionar Método Entrega]
    F --> G
    G --> H{¿Requiere Dirección?}
    H -->|SÍ - DELIVERY| I[Validar/Ingresar Dirección]
    H -->|NO - PICKUP| J[Seleccionar Método Pago]
    I --> J
    J --> K{¿Tipo de Pago?}
    K -->|MercadoPago| L[Crear Preferencia MP]
    K -->|Efectivo| M[Confirmar Orden Directa]
    L --> N[Redireccionar a MercadoPago]
    M --> O[Orden Creada - Estado Pendiente]
    N --> P[Usuario Completa Pago]
    P --> Q[Webhook Actualiza Estado]
    Q --> R[Redirección a Success]
    O --> S[Enviar Notificación Manual]
    S --> T[Success - Pago Efectivo]
    R --> U[PaymentSuccessComponent]
    T --> U
    U --> V{¿Usuario Autenticado?}
    V -->|SÍ| W[Cargar con OrderService]
    V -->|NO| X[Cargar con OrderInquiryService]
    W --> Y[Mostrar Navegación Manual]
    X --> Z[Timer 3s + Redirección Auto]
    Z --> AA[Página Orden Pública]
    Y --> BB[Ir a Mis Pedidos]

    %% Estilos modernos
    classDef guestUser fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef authUser fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef payment fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px

    class D,F,X,Z,AA guestUser
    class C,E,W,Y,BB authUser
    class K,L,M,N,P,Q payment
    class U,T,R success
```

## 🏗️ Arquitectura Moderna con Subgrafos

```mermaid
flowchart TB
    subgraph Frontend["🎨 Frontend Angular"]
        direction TB
        A[CheckoutPageComponent]
        B[PaymentSuccessComponent]
        C[OrderPageComponent]
        D[AuthService]
        E[OrderService]
        F[OrderInquiryService]
        G[OrderNotificationService]
    end
  
    subgraph Backend["⚙️ Backend APIs"]
        direction TB
        H[🔒 /api/orders<br/>Privada - Auth Required]
        I[🌐 /api/order-inquiry<br/>Pública - Guest Access]
        J[📧 /api/notifications/manual<br/>Notificaciones]
        K[💳 /api/payments/create-preference<br/>MercadoPago]
    end
    
    subgraph External["🔗 Servicios Externos"]
        direction TB
        L[💰 MercadoPago API]
        M[📧 Email Service]
        N[📱 Telegram Bot]
    end
    
    subgraph Database["🗃️ Base de Datos"]
        direction TB
        O[(📦 MongoDB Orders)]
        P[(👤 MongoDB Users)]
        Q[(🔔 MongoDB Notifications)]
    end
    
    %% Flujos Usuario Autenticado
    A -.->|Usuario Auth| E
    E --> H
    H --> O
    B -.->|Usuario Auth| E
    
    %% Flujos Usuario Invitado
    A -.->|Usuario Invitado| F
    F --> I
    I --> O
    B -.->|Usuario Invitado| F
    
    %% Sistema de Notificaciones
    A --> G
    B --> G
    G --> J
    J --> M
    J --> N
    
    %% Integración MercadoPago
    A --> K
    K --> L
    L --> B
    
    %% Autenticación
    D --> E
    D --> F
    
    %% Base de Datos
    H --> P
    J --> Q
    
    %% Estilos con gradientes modernos
    classDef frontendStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#000
    classDef backendStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:3px,color:#000
    classDef externalStyle fill:#fff3e0,stroke:#f57c00,stroke-width:3px,color:#000
    classDef databaseStyle fill:#fce4ec,stroke:#e91e63,stroke-width:3px,color:#000
    
    class A,B,C,D,E,F,G frontendStyle
    class H,I,J,K backendStyle
    class L,M,N externalStyle
    class O,P,Q databaseStyle
```

## 💳 Flujo MercadoPago con Estados

```mermaid
stateDiagram-v2
    [*] --> Iniciando
    Iniciando --> CreandoPreferencia: Usuario confirma MP
    CreandoPreferencia --> Procesando: Backend valida datos
    Procesando --> Redirigiendo: API MP responde
    Redirigiendo --> EnMercadoPago: Usuario en plataforma MP
    
    EnMercadoPago --> PagoExitoso: Pago completado
    EnMercadoPago --> PagoFallido: Error en pago
    EnMercadoPago --> PagoCancelado: Usuario cancela
    
    PagoExitoso --> WebhookRecibido: MP envía webhook
    WebhookRecibido --> OrdenActualizada: Backend procesa
    OrdenActualizada --> NotificacionEnviada: Sistema notifica
    NotificacionEnviada --> [*]
    
    PagoFallido --> MostrandoError: Error mostrado
    PagoCancelado --> MostrandoError: Cancelación mostrada
    MostrandoError --> [*]
```

## 🌊 Diagrama de Flujo de Usuario (Journey)

```mermaid
journey
    title Experiencia de Usuario en Checkout
    section Llegada
      Accede a Checkout: 5: Usuario
      Ve productos: 4: Usuario
    section Autenticación
      Login (si está registrado): 3: Usuario
      Completa datos (si es invitado): 3: Usuario
    section Configuración
      Selecciona método entrega: 4: Usuario
      Ingresa dirección: 3: Usuario
      Elige método pago: 4: Usuario
    section Pago
      Confirma orden: 5: Usuario
      Procesa pago: 2: Sistema
      Recibe confirmación: 5: Usuario
    section Post-Pago
      Ve resumen: 5: Usuario
      Recibe notificaciones: 4: Sistema
      Navega a orden: 4: Usuario
```
