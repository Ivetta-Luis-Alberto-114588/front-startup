```mermaid
graph TD
    A[Inicio: Navega y Anade Productos] --> B(Ver Carrito);
    B --> C{Clic Proceder al Pago};
    C --> D{Usuario Logueado};
    D -- No --> E{Mostrar Opciones: Login Registro Invitado};
    E -- Elige Login --> F[Ingresa Credenciales];
    E -- Elige Registro --> G[Completa Formulario Registro];
    E -- Elige Invitado --> H[Ingresa Email Datos Personales];
    F -- Login OK --> I[Recuperar Mostrar Direcciones Guardadas];
    G -- Registro OK --> J[Ingresar Direccion Envio Primera vez];
    H --> J;
    I --> K{Seleccionar Anadir Direccion Envio};
    J --> L[Mostrar Opciones Envio Calculadas];
    K --> L;
    L --> M[Usuario Selecciona Envio];
    M --> N[Mostrar Resumen Final Items Envio Total];
    N --> O{Clic Pagar con Mercado Pago};
    O --> P((Redirigido a Mercado Pago));
    P --> Q[Completa Pago en MP];
    Q --> R((MP Redirige a URL Retorno));
    R --> S{Ver Pagina Exito Fallo Pendiente};
    S --> T[Fin Flujo Usuario];

    %% Conexiones Frontend implicitas mostradas via enlaces de nodos
    B --> C;
    C --> D;
    D -- Si --> I;  %% Cambiado: Si (sin acento)
    D -- No --> E;
    E -- Login --> F;
    E -- Registro --> G;
    E -- Invitado --> H;
    I --> K;
    J --> L;
    K --> L;
    L --> M;
    M --> N;
    N --> O;
    O -- Envia Datos Pedido --> U;
    U -- Devuelve URL MP --> O;
    O -- Redirige --> P;
    R --> S;

    %% Nodos y Conexiones Backend
    F -- Valida --> F;
    G -- Guarda Usuario --> G;
    I -- Consulta BD --> I;
    K -- Guarda Actualiza Direccion --> K;
    L -- Calcula Costos Envio --> L;
    U[Recibe Datos Pedido User Invitado];
    U -- Crea Preferencia MP --> V;
    V -- Devuelve init_point --> U;
    %% U --> O; Enlace ya existe implicitamente via conexiones Frontend
    W[Recibe Notificacion Webhook IPN];
    W -- Consulta Estado Pago --> X;
    X -- Devuelve Estado Final --> W;
    W --> Y[Valida Pago Actualiza Pedido BD];
    Y --> Z[Envia Email Confirmacion Notificaciones];

    %% Nodos y Conexiones Mercado Pago
    V[API Mercado Pago: Procesa Preferencia]; %% Texto del nodo V definido
    V --> P;
    P --> Q;
    Q --> R;
    Q -- Envia Webhook Asincrono --> W;
    X[API Mercado Pago: Provee Info Pago]; %% Texto del nodo X definido

    %% Estilos comentados por compatibilidad
    %% style A fill:#E6E6FA,stroke:#333,stroke-width:1px %% Ejemplo estilo apuntando a ID de nodo