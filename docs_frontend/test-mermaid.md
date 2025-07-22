# Test Mermaid 8.8.0 Compatibility

Este archivo es solo para probar la compatibilidad con Mermaid 8.8.0.

## Test 1: Graph TD (Funciona en 8.8.0)

```mermaid
graph TD
    A[Usuario accede a Checkout] --> B{¿Autenticado?}
    B -->|SÍ| C[Cargar Perfil Usuario]
    B -->|NO| D[Mostrar Formulario Invitado]
    C --> E[Cargar Direcciones Guardadas]
    D --> F[Capturar Datos Básicos]
    E --> G[Seleccionar Método Entrega]
    F --> G

    style D fill:#e3f2fd
    style F fill:#e3f2fd
```

## Test 2: Sequence Diagram (Funciona en 8.8.0)

```mermaid
sequenceDiagram
    participant A as Usuario
    participant B as Frontend
    participant C as Backend
    
    A->>B: Inicia Checkout
    B->>C: Envía Datos
    C->>B: Respuesta
    B->>A: Muestra Resultado
```

## Test 3: Graph TB (Funciona en 8.8.0)

```mermaid
graph TB
    subgraph "Frontend Angular"
        A[CheckoutPageComponent]
        B[PaymentSuccessComponent]
    end
    
    subgraph "Backend APIs"
        C[/api/orders]
        D[/api/payments]
    end
    
    A --> C
    B --> D
    
    style A fill:#c8e6c9
    style B fill:#e1f5fe
```
