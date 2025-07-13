# 📊 Diagramas de Flujo - Sistema de Compras

## 🎯 Flujo General de Checkout

```mermaid
graph TB
    A[Usuario inicia Checkout] --> B{Carrito vacío?}
    B -->|Sí| C[Redirigir a Carrito]
    B -->|No| D[Cargar Métodos de Entrega]
    
    D --> E[Mostrar Opciones de Entrega]
    E --> F[Usuario selecciona Método]
    F --> G{Requiere Dirección?}
    
    G -->|No| H[Cargar Métodos de Pago]
    G -->|Sí| I{Usuario Autenticado?}
    
    I -->|Sí| J[Cargar Direcciones Guardadas]
    I -->|No| K[Mostrar Formulario Nueva Dirección]
    
    J --> L{Tiene Direcciones?}
    L -->|Sí| M[Mostrar Opciones: Existente/Nueva]
    L -->|No| K
    
    M --> N[Usuario selecciona Dirección]
    K --> O[Usuario completa Formulario]
    
    N --> H
    O --> P{Formulario Válido?}
    P -->|No| O
    P -->|Sí| H
    
    H --> Q[Filtrar Métodos según Entrega]
    Q --> R[Mostrar Opciones de Pago]
    R --> S[Usuario selecciona Método]
    
    S --> T[Mostrar Resumen Final]
    T --> U[Usuario confirma Pedido]
    U --> V[Crear Orden en Backend]
    
    V --> W{Éxito?}
    W -->|No| X[Mostrar Error]
    W -->|Sí| Y{Método de Pago?}
    
    Y -->|Efectivo| Z[Mostrar Confirmación]
    Y -->|MercadoPago| AA[Crear Preferencia]
    
    AA --> BB{Éxito?}
    BB -->|No| X
    BB -->|Sí| CC[Redirigir a MercadoPago]
    
    Z --> DD[Limpiar Carrito]
    CC --> EE[Proceso de Pago Externo]
    
    DD --> FF[Orden Completada]
    EE --> GG[Webhook de Confirmación]
    GG --> FF
    
    X --> HH[Permitir Reintentar]
    HH --> U
```

## 🚚 Flujo de Métodos de Entrega

```mermaid
graph TD
    A[Cargar Métodos de Entrega] --> B[GET /api/delivery-methods]
    B --> C{Respuesta OK?}
    
    C -->|No| D[Mostrar Error]
    C -->|Sí| E[Parsear Métodos]
    
    E --> F{Hay Métodos?}
    F -->|No| G[Mostrar "Sin Métodos"]
    F -->|Sí| H{Solo 1 Método?}
    
    H -->|Sí| I[Autoseleccionar]
    H -->|No| J[Mostrar Opciones]
    
    I --> K[Actualizar Estado]
    J --> L[Usuario Selecciona]
    L --> K
    
    K --> M[Verificar requiresAddress]
    M --> N{Requiere Dirección?}
    
    N -->|Sí| O[Mostrar Sección Dirección]
    N -->|No| P[Ocultar Sección Dirección]
    
    O --> Q[Filtrar Métodos de Pago]
    P --> Q
    
    Q --> R[Actualizar UI]
    
    D --> S[Botón Reintentar]
    S --> A
    G --> S
```

## 💳 Flujo de Métodos de Pago

```mermaid
graph TD
    A[Método de Entrega Seleccionado] --> B[GET /api/payment-methods/active]
    B --> C{Respuesta OK?}
    
    C -->|No| D[Usar Métodos Fallback]
    C -->|Sí| E[Parsear Métodos]
    
    E --> F[Filtrar según Método Entrega]
    F --> G{Método = PICKUP?}
    
    G -->|Sí| H[Mostrar Todos los Métodos]
    G -->|No| I[Mostrar Solo requiresOnlinePayment]
    
    H --> J{Hay Métodos?}
    I --> J
    
    J -->|No| K[Mostrar "Sin Métodos"]
    J -->|Sí| L{Solo 1 Método?}
    
    L -->|Sí| M[Autoseleccionar]
    L -->|No| N[Mostrar Opciones]
    
    M --> O[Actualizar Estado]
    N --> P[Usuario Selecciona]
    P --> O
    
    O --> Q[Verificar Validez Checkout]
    Q --> R[Actualizar UI]
    
    D --> S[Crear Método Efectivo Temporal]
    S --> T{Método = PICKUP?}
    T -->|Sí| U[Mostrar Efectivo]
    T -->|No| V[Mostrar Error]
    
    U --> O
    V --> W[Solicitar Recarga]
    W --> A
```

## 🏠 Flujo de Direcciones

```mermaid
graph TD
    A[Método Requiere Dirección] --> B{Usuario Autenticado?}
    
    B -->|No| C[Mostrar Formulario Nueva]
    B -->|Sí| D[GET /api/customers/addresses]
    
    D --> E{Respuesta OK?}
    E -->|No| F[Mostrar Error]
    E -->|Sí| G[Parsear Direcciones]
    
    G --> H{Hay Direcciones?}
    H -->|No| C
    H -->|Sí| I[Mostrar Opciones: Existente/Nueva]
    
    I --> J[Usuario Selecciona Opción]
    J --> K{Opción = Existente?}
    
    K -->|Sí| L[Mostrar Dropdown Direcciones]
    K -->|No| C
    
    L --> M[Usuario Selecciona Dirección]
    M --> N[Validar Selección]
    
    C --> O[Cargar Ciudades]
    O --> P[GET /api/cities]
    P --> Q{Respuesta OK?}
    
    Q -->|No| R[Mostrar Error Ciudades]
    Q -->|Sí| S[Mostrar Dropdown Ciudades]
    
    S --> T[Usuario Selecciona Ciudad]
    T --> U[GET /api/neighborhoods/by-city/:id]
    U --> V{Respuesta OK?}
    
    V -->|No| W[Mostrar Error Barrios]
    V -->|Sí| X[Mostrar Dropdown Barrios]
    
    X --> Y[Usuario Completa Formulario]
    Y --> Z[Validar Formulario]
    
    Z --> AA{Formulario Válido?}
    AA -->|No| BB[Mostrar Errores]
    AA -->|Sí| CC[Direccion Lista]
    
    N --> CC
    BB --> Y
    CC --> DD[Actualizar Estado Checkout]
    
    F --> EE[Forzar Formulario Nueva]
    EE --> C
    
    R --> FF[Permitir Reintentar]
    FF --> O
    
    W --> GG[Permitir Reintentar]
    GG --> U
```

## 🛒 Flujo de Creación de Orden

```mermaid
graph TD
    A[Usuario Confirma Pedido] --> B[Validar Datos Completos]
    B --> C{Validación OK?}
    
    C -->|No| D[Mostrar Errores]
    C -->|Sí| E[Construir Payload]
    
    E --> F[Obtener Items del Carrito]
    F --> G[Agregar Método Entrega]
    G --> H[Agregar Método Pago]
    
    H --> I{Requiere Dirección?}
    I -->|No| J[Payload Base]
    I -->|Sí| K{Tipo Dirección?}
    
    K -->|Existente| L[Agregar selectedAddressId]
    K -->|Nueva| M[Agregar Datos Formulario]
    
    L --> N[Payload Completo]
    M --> N
    J --> N
    
    N --> O[POST /api/orders]
    O --> P{Respuesta OK?}
    
    P -->|No| Q[Analizar Error]
    P -->|Sí| R[Parsear Orden Creada]
    
    Q --> S{Tipo Error?}
    S -->|400| T[Datos Inválidos]
    S -->|409| U[Stock Insuficiente]
    S -->|500| V[Error Servidor]
    
    T --> W[Mostrar Error Específico]
    U --> W
    V --> W
    
    R --> X[Verificar Método Pago]
    X --> Y{Método = Efectivo?}
    
    Y -->|Sí| Z[Mostrar Confirmación]
    Y -->|No| AA[Crear Preferencia MercadoPago]
    
    AA --> BB[POST /api/payments/create-preference]
    BB --> CC{Respuesta OK?}
    
    CC -->|No| DD[Error Creando Preferencia]
    CC -->|Sí| EE[Obtener URL Pago]
    
    Z --> FF[Limpiar Carrito]
    EE --> GG[Redirigir a MercadoPago]
    
    FF --> HH[Redirigir a Confirmación]
    GG --> II[Proceso Pago Externo]
    
    II --> JJ[Webhook Confirmación]
    JJ --> KK[Actualizar Estado Orden]
    
    W --> LL[Permitir Reintentar]
    LL --> A
    
    DD --> MM[Mostrar Error Pago]
    MM --> LL
    
    D --> NN[Corregir Datos]
    NN --> A
```

## 🔄 Estados de Progreso del Checkout

```mermaid
stateDiagram-v2
    [*] --> Iniciando
    Iniciando --> Paso1_Entrega : Cargar métodos
    
    Paso1_Entrega --> Paso1_Completo : Seleccionar método
    Paso1_Completo --> Paso2_Direccion : Si requiere dirección
    Paso1_Completo --> Paso3_Pago : Si no requiere dirección
    
    Paso2_Direccion --> Paso2_Completo : Dirección válida
    Paso2_Completo --> Paso3_Pago : Continuar
    
    Paso3_Pago --> Paso3_Completo : Seleccionar método
    Paso3_Completo --> Paso4_Confirmacion : Todo listo
    
    Paso4_Confirmacion --> Procesando : Confirmar pedido
    Procesando --> Exito_Efectivo : Pago efectivo
    Procesando --> Exito_MercadoPago : Pago online
    Procesando --> Error : Falló creación
    
    Exito_Efectivo --> Finalizado
    Exito_MercadoPago --> Finalizado
    Error --> Paso4_Confirmacion : Reintentar
    
    Paso1_Entrega --> Paso1_Entrega : Cambiar método
    Paso2_Direccion --> Paso2_Direccion : Editar dirección
    Paso3_Pago --> Paso3_Pago : Cambiar método
```

## 🎨 Flujo de UI y Estados Visuales

```mermaid
graph TD
    A[Página Carga] --> B[Mostrar Loading]
    B --> C[Cargar Datos Iniciales]
    
    C --> D[Mostrar Progreso: 0%]
    D --> E[Mostrar Métodos Entrega]
    
    E --> F[Usuario Selecciona]
    F --> G[Progreso: 25%]
    G --> H[Paso 1: Verde]
    
    H --> I{Requiere Dirección?}
    I -->|No| J[Progreso: 50%]
    I -->|Sí| K[Mostrar Sección Dirección]
    
    K --> L[Usuario Completa]
    L --> M[Progreso: 50%]
    M --> N[Paso 2: Verde]
    
    J --> O[Mostrar Métodos Pago]
    N --> O
    
    O --> P[Usuario Selecciona]
    P --> Q[Progreso: 75%]
    Q --> R[Paso 3: Verde]
    
    R --> S[Mostrar Botón Confirmar]
    S --> T[Progreso: 100%]
    T --> U[Paso 4: Verde]
    
    U --> V[Usuario Confirma]
    V --> W[Mostrar Spinner]
    W --> X[Bloquear Botón]
    
    X --> Y{Éxito?}
    Y -->|Sí| Z[Mostrar Éxito]
    Y -->|No| AA[Mostrar Error]
    
    Z --> BB[Ocultar Spinner]
    AA --> CC[Habilitar Botón]
    
    BB --> DD[Redirigir]
    CC --> EE[Permitir Reintentar]
    EE --> V
```

## 🔧 Flujo de Validaciones

```mermaid
graph TD
    A[Cambio en Formulario] --> B[Validar Campo]
    B --> C{Campo Válido?}
    
    C -->|No| D[Mostrar Error]
    C -->|Sí| E[Ocultar Error]
    
    D --> F[Aplicar Clase is-invalid]
    E --> G[Remover Clase is-invalid]
    
    F --> H[Actualizar Estado Campo]
    G --> H
    
    H --> I[Verificar Formulario Completo]
    I --> J{Todos Válidos?}
    
    J -->|No| K[Formulario Inválido]
    J -->|Sí| L[Formulario Válido]
    
    K --> M[Deshabilitar Siguiente Paso]
    L --> N[Habilitar Siguiente Paso]
    
    M --> O[Actualizar Progreso]
    N --> O
    
    O --> P[Actualizar UI]
    
    P --> Q[Verificar Checkout Completo]
    Q --> R{Todo Listo?}
    
    R -->|No| S[Botón Confirmar: Disabled]
    R -->|Sí| T[Botón Confirmar: Enabled]
    
    S --> U[Mensaje: Complete pasos]
    T --> V[Mensaje: Confirmar y Pagar]
```

## 📱 Flujo Responsive

```mermaid
graph TD
    A[Detectar Tamaño Pantalla] --> B{Dispositivo?}
    
    B -->|Desktop| C[Layout 2 Columnas]
    B -->|Tablet| D[Layout 2 Columnas Ajustado]
    B -->|Mobile| E[Layout 1 Columna]
    
    C --> F[Sidebar Sticky]
    D --> G[Sidebar Relativo]
    E --> H[Resumen Abajo]
    
    F --> I[Progreso Horizontal]
    G --> I
    H --> J[Progreso Vertical]
    
    I --> K[Cards Lado a Lado]
    J --> L[Cards Apilados]
    
    K --> M[Formulario 2 Columnas]
    L --> N[Formulario 1 Columna]
    
    M --> O[Botones Inline]
    N --> P[Botones Block]
    
    O --> Q[Tipografía Normal]
    P --> R[Tipografía Móvil]
    
    Q --> S[Espaciado Desktop]
    R --> T[Espaciado Móvil]
    
    S --> U[Renderizado Final]
    T --> U
```

---

## 🔗 Integración de Diagramas

Estos diagramas deben ser utilizados como referencia durante la implementación:

1. **Flujo General**: Guía la estructura principal del componente
2. **Flujos Específicos**: Detallan la lógica de cada servicio
3. **Estados de Progreso**: Definen la máquina de estados del checkout
4. **UI y Validaciones**: Orientan la experiencia del usuario
5. **Responsive**: Aseguran compatibilidad móvil

---

*📊 Diagramas creados: Enero 2025*
*🔄 Última actualización: Enero 2025*
*📝 Versión: 1.0.0*
