# StartUp E-commerce Frontend (Angular)

**Este es el frontend para la aplicación StartUp E-commerce, construido con Angular (v14+ asumido). Proporciona la interfaz de usuario para interactuar con la** [API Backend](https://www.google.com/url?sa=E&q=link-a-tu-repo-backend) **(Node.js, Express, MongoDB), permitiendo a los clientes navegar por productos, gestionar su carrito, realizar pedidos y pagos (vía Mercado Pago), y a los administradores gestionar completamente la tienda a través de un panel dedicado.**

## ✨ Características Implementadas

* **Navegación y Visualización:**

  * **Dashboard/Página de Inicio dinámica con secciones destacadas (Categorías, Productos Populares, Combos).**
  * **Listado de productos paginado por categoría.**
  * **Vista detallada de cada producto con controles de cantidad.**
  * **Diseño responsivo (Bootstrap) adaptable a móviles, tablets y escritorio.**
  * **Páginas estáticas (Términos y Condiciones, Política de Privacidad) con navegación de retorno.**
* **Autenticación y Autorización:**

  * **Formulario de Registro de Usuarios (con validaciones y creación de perfil de cliente asociado).**
  * **Formulario de Inicio de Sesión (con validaciones).**
  * **Flujo de Recuperación de Contraseña:** **Formulario para solicitar reseteo y formulario para establecer nueva contraseña (vía token por email).**
  * **Gestión de sesión segura mediante Tokens JWT (almacenados en** **localStorage**).
  * **Guardia de rutas (**AuthGuard**) para proteger secciones que requieren inicio de sesión (Carrito, Checkout, Mis Pedidos, Direcciones).**
  * **Guardia de rutas (**AdminGuard**) para proteger toda la sección de administración (**/admin**) verificando el rol** **ADMIN_ROLE**.
  * **Interceptor HTTP (**AuthInterceptor**) para añadir automáticamente el token JWT a las peticiones API y manejar errores 401 (deslogueo automático).**
* **Carrito de Compras:**

  * **Página dedicada (**/cart**) para visualizar y gestionar el carrito.**
  * **Añadir productos desde listas o detalle (con manejo de autenticación y acciones pendientes si el usuario no está logueado).**
  * **Incrementar/Decrementar cantidad de ítems (con validación de stock).**
  * **Eliminar ítems individuales.**
  * **Vaciar el carrito completo (con modal de confirmación NgBootstrap).**
  * **Cálculo y visualización en tiempo real de subtotales (con/sin IVA), IVA total y total general.**
  * **(Próximamente):** **Aplicación de cupones de descuento.**
* **Proceso de Compra (Checkout):**

  * **Página de checkout (**/checkout**) protegida por** **AuthGuard**.
  * **Gestión de Direcciones de Envío:**

    * **Opción para seleccionar una dirección guardada (si el usuario está logueado y tiene direcciones).**
    * **Formulario completo para ingresar una nueva dirección (para usuarios logueados y como flujo principal para invitados implícitos).**
    * **Carga dinámica de Ciudades y Barrios desde la API para el formulario de nueva dirección.**
    * **Validación del formulario de nueva dirección.**
  * **Resumen detallado del pedido antes de proceder al pago.**
  * **Integración con** **Mercado Pago:** **Al confirmar, se crea el pedido en el backend, se genera la preferencia de pago y se redirige al usuario al checkout de Mercado Pago.**
* **Gestión de Pedidos (Cliente):**

  * **Página "Mis Pedidos" (**/my-orders**) protegida por** **AuthGuard** **para ver el historial de compras.**
  * **Listado paginado de pedidos del usuario.**
  * **Página de detalle (**/my-orders/:orderId**) para cada pedido, mostrando resumen, estado, ítems y detalles de envío.**
  * **Visualización clara del estado del pedido (Pendiente, Completado, Cancelado).**
* **Manejo de Callbacks de Pago:**

  * **Páginas dedicadas (**/payment/success**,** **/payment/failure**, **/payment/pending**) para mostrar mensajes informativos al usuario tras la redirección desde Mercado Pago, incluyendo el ID del pedido afectado.
* **Interfaz de Administración (Módulo** **/admin** **- Protegido por** **AdminGuard**):

  * **Gestión Completa de Catálogos:**

    * **Categorías:** **Listar, Crear, Editar, Eliminar.**
    * **Unidades de Medida:** **Listar, Crear, Editar, Eliminar.**
    * **Etiquetas (Tags):** **Listar, Crear, Editar, Eliminar.**
    * **Productos:** **Listar (paginado), Crear (con subida de imagen a Cloudinary), Editar (con reemplazo/eliminación de imagen y gestión de tags), Eliminar. Selección de Categoría, Unidad y Tags múltiples.**
  * **Gestión Geográfica:**

    * **Ciudades:** **Listar, Crear, Editar, Eliminar.**
    * **Barrios:** **Listar, Crear, Editar, Eliminar (asociados a una Ciudad).**
  * **Gestión de Promociones:**

    * **Cupones:** **Listar, Crear, Editar (código, tipo, valor, fechas, límites, etc.), Eliminar.**
  * **Gestión de Ventas:**

    * **Pedidos:** **Listar todos los pedidos (paginado), Ver detalle completo de un pedido,** **Actualizar estado del pedido** **(Pendiente, Completado, Cancelado).**
  * **(Próximamente en UI Admin):** **Gestión de Clientes y Usuarios (roles).**
* **UI/UX:**

  * **Notificaciones visuales (Toastr** **ngx-toastr**) para feedback interactivo (éxito, error, información).
  * **Indicadores de carga (spinners Bootstrap) durante operaciones asíncronas.**
  * **Uso de componentes NgBootstrap (Paginación, Modales, Dropdowns).**
  * **Navegación clara y consistente mediante** **RouterModule**.
  * **Sidebar y Header interactivos:**

    * **Sidebar colapsable.**
    * **Header que se oculta/muestra con el scroll.**
    * **Visualización dinámica de opciones (Login/Registro vs. Menú de Usuario, Carrito, Sección Admin) basada en estado de autenticación y rol.**
    * **Icono de carrito siempre visible en móviles.**

## 🛠️ Tecnologías Utilizadas

* **Framework:** **Angular (v14+ asumido)**
* **Lenguaje:** **TypeScript**
* **UI:**

  * **HTML5, SCSS**
  * **Bootstrap 5 (Clases CSS)**
  * **NgBootstrap (Componentes Angular para Bootstrap)**
  * **Bootstrap Icons**
* **Gestión de Estado:** **RxJS (BehaviorSubject, Observable) en Servicios (Patrón Servicio con Subject)**
* **HTTP:** **Angular HttpClientModule**
* **Routing:** **Angular RouterModule**
* **Formularios:** **Angular ReactiveFormsModule, FormsModule**
* **Notificaciones:** **ngx-toastr**
* **Gestión de Paquetes:** **npm**
* **Build Tool:** **Angular CLI**

## 🏗️ Estructura del Proyecto

**(La estructura que describiste es excelente y se mantiene)**

* **app/**: Módulo raíz y componentes principales.

  * **app-routing.module.ts**: Rutas principales, lazy loading.
* **app.module.ts**: Módulo raíz.
* **auth/**: Módulo de autenticación (Login, Registro, Reset Password, Guards, Interceptor, Service).
* **features/**: Módulos de funcionalidades principales.

  * **cart/**: Carrito de compras.
* **checkout/**: Proceso de pago.
* **dashboard/**: Página de inicio.
* **orders/**: Historial y detalle de pedidos del cliente.
* **payments/**: Componentes de callback de pago (Success, Failure, Pending).
* **products/**: Listado y detalle de productos públicos.
* **admin/**: Módulo lazy loaded para administración.

  * **pages/**: Componentes CRUD (List, Form) para entidades gestionables.
* **services/**: Servicios API específicos de admin.
* **guards/**: **AdminGuard**.
* **shared/**: Módulo con elementos reutilizables.

  * **components/**: Notpagefound.
* **header/**, **sidebar/**, **layouts/**: Estructura visual.
* **models/**: Interfaces comunes (IUser, ICoupon, IOrder, etc.).
* **pages/**: Términos, Privacidad.
* **services/**: NotificationService.
* **dtos/**: PaginationDto.
* **environments/**: Configuración de entornos (API URL).
* **assets/**: Archivos estáticos.

## 📋 Prerrequisitos

* **Node.js:** **v18+ recomendado.**
* **npm** **(v9+ recomendado).**
* **Angular CLI:** **npm install -g @angular/cli**.
* **API Backend Corriendo:** **La** [API Backend](https://www.google.com/url?sa=E&q=link-a-tu-repo-backend) **debe estar ejecutándose.**

## 🚀 Instalación

* **Clona:** **git clone `<tu-repositorio-frontend-url>`** **y** **cd `<directorio>`**
* **Instala:** **npm install**
* **Configura Entornos:** **Edita** **src/environments/environment.ts** **(desarrollo) y** **src/environments/environment.prod.ts** **(producción) con la** **apiUrl** **correcta de tu backend.**

## ▶️ Ejecutar la Aplicación

* **Desarrollo:** **ng serve -o** **(Servidor local en** **http://localhost:4200** **con recarga automática).**
* **Producción (Build):** **ng build** **(Genera los archivos estáticos optimizados en** **dist/`<nombre-proyecto>`/**).

## 🌐 Flujo de Autenticación y Autorización

**(El flujo que describiste es correcto y se mantiene)**

## 🛡️ Sección de Administración (**/admin**)

**(La descripción que diste es precisa y se mantiene, incluyendo todos los CRUDs implementados)**

## 🚧 Mejoras Futuras / TODO (Frontend)

* **Completar UI Admin:**
  * ~~Gestión de Clientes (Listar, Ver Detalles).~~ **(Ya existe listado básico, falta UI para ver/editar detalles específicos del cliente si es necesario más allá del perfil de usuario).**
  * ~~Gestión de Usuarios (Listar, Editar Roles).~~ **(Ya existe listado básico y endpoints en backend, falta UI específica para editar roles/estado desde admin).**
  * ~~Dashboard Admin con estadísticas básicas.~~ **(Falta implementar un dashboard visual con gráficos/KPIs).**
  * **Mejorar Navegación/Layout Admin:** Crear un layout específico para `/admin` o mejorar la integración con el sidebar actual para una mejor experiencia.

* **Funcionalidad Cliente:**
  * **Aplicar Cupones:** UI en carrito/checkout y lógica de servicio.
  * **Perfil de Usuario:** Editar nombre/email, Cambiar contraseña.
  * **Wishlist:** Botones, servicio y página dedicada.
  * **Reseñas/Calificaciones:** UI en detalle de producto, formulario de envío.
* **UX/UI:**
  * **Búsqueda Avanzada:** Barra de búsqueda global, sugerencias.
  * **Filtros/Ordenamiento:** UI completa en listas de productos.
  * **Skeleton Loaders:** Reemplazar spinners simples.
  * **Optimización de Imágenes:** Lazy loading.
* **Técnico:**
  * **Pruebas:** Unitarias y E2E.
  * **SEO:** Títulos/Metas dinámicos.
  * **Monitorización Errores:** Integrar Sentry o similar.
  * **Accesibilidad (a11y).**
  * **(Opcional) PWA.**

## 🤝 Contribuciones

**Las contribuciones son bienvenidas. Por favor, abre un issue o un Pull Request en el repositorio.**

## 📄 Licencia

**Copyright (c) 2025 Luis Alberto Ivetta. Todos los derechos reservados.**

**Este software es propietario. El uso, copia, modificación, distribución o ejecución de este software o cualquier parte del mismo está estrictamente prohibido sin el permiso explícito por escrito del titular de los derechos de autor. Para consultas sobre licencias, por favor contacte a** [laivetta@gmail.com](https://www.google.com/url?sa=E&q=mailto%3Alaivetta%40gmail.com)

---

**Este README actualizado refleja mejor el estado actual y las capacidades de tu frontend Angular. ¡Buen trabajo!**

**Completar UI Admin:**
    *   ~~Gestión de Clientes (Listar, Ver Detalles).~~ **(Ya existe listado básico, falta UI para ver/editar detalles específicos del cliente si es necesario más allá del perfil de usuario).**
    *   ~~Gestión de Usuarios (Listar, Editar Roles).~~ **(Ya existe listado básico y endpoints en backend, falta UI específica para editar roles/estado desde admin).**
    *   ~~Dashboard Admin con estadísticas básicas.~~ **(Falta implementar un dashboard visual con gráficos/KPIs).**
    *   **Mejorar Navegación/Layout Admin:** Crear un layout específico para `/admin` o mejorar la integración con el sidebar actual para una mejor experiencia.

* **Funcionalidad Cliente:**
  * **Aplicar Cupones:** UI en carrito/checkout y lógica de servicio.
  * **Perfil de Usuario:** Editar nombre/email, Cambiar contraseña.
  * **Wishlist:** Botones, servicio y página dedicada.
  * **Reseñas/Calificaciones:** UI en detalle de producto, formulario de envío.
* **UX/UI:**
  * **Búsqueda Avanzada:** Barra de búsqueda global, sugerencias.
  * **Filtros/Ordenamiento:** UI completa en listas de productos.
  * **Skeleton Loaders:** Reemplazar spinners simples.
  * **Optimización de Imágenes:** Lazy loading.
* **Técnico:**
  * **Pruebas:** Unitarias y E2E.
  * **SEO:** Títulos/Metas dinámicos.
  * **Monitorización Errores:** Integrar Sentry o similar.
  * **Accesibilidad (a11y).**
  * **(Opcional) PWA.**
