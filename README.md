# StartUp E-commerce Frontend (Angular)

**Este es el frontend para la aplicación StartUp E-commerce, construido con Angular. Proporciona la interfaz de usuario para interactuar con la [API Backend](link-a-tu-repo-backend) (Node.js, Express, MongoDB), permitiendo a los clientes navegar por productos, gestionar su carrito, realizar pedidos y pagos, y a los administradores gestionar la tienda.**

## ✨ Características Principales (Interfaz de Usuario)

* **Navegación y Visualización:**
  * Dashboard/Página de Inicio con secciones destacadas (Categorías, Populares, Combos).
  * Listado de productos con filtros básicos (por categoría, búsqueda por tags desde el home).
  * Vista detallada de cada producto.
  * Diseño responsivo adaptable a diferentes tamaños de pantalla.
* **Autenticación de Usuarios:**
  * Formulario de Registro con validaciones.
  * Formulario de Inicio de Sesión con validaciones.
  * Gestión de sesión mediante Tokens JWT (almacenados en `localStorage`).
  * Guardia de rutas (`AuthGuard`) para proteger secciones como Checkout y Mis Pedidos.
  * Interceptor HTTP (`AuthInterceptor`) para añadir automáticamente el token a las peticiones y manejar errores 401 (deslogueo).
* **Carrito de Compras:**
  * Página dedicada para visualizar y gestionar el carrito.
  * Añadir productos desde la lista o el detalle.
  * Incrementar/Decrementar cantidad de ítems.
  * Eliminar ítems individuales.
  * Vaciar el carrito completo (con modal de confirmación).
  * Cálculo y visualización de subtotales, IVA y total.
* **Proceso de Compra (Checkout):**
  * Página de checkout protegida.
  * Selección de dirección de envío guardada (para usuarios logueados).
  * Formulario para ingresar una nueva dirección de envío (con carga dinámica de ciudades y barrios).
  * Resumen del pedido antes de pagar.
  * Integración con Mercado Pago: Redirección al checkout de MP al confirmar.
* **Gestión de Pedidos (Cliente):**
  * Página "Mis Pedidos" para ver el historial de compras del usuario autenticado.
  * Página de detalle para cada pedido.
  * Visualización del estado del pedido (Pendiente, Completado, Cancelado).
* **Manejo de Callbacks de Pago:**
  * Páginas dedicadas para mostrar mensajes de Éxito, Fallo o Pendiente tras la redirección desde Mercado Pago.
* **Interfaz de Administración (CRUDs):**
  * **Módulo Admin (`/admin`):** Sección protegida por rol (`AdminGuard` - *pendiente de implementación completa*).
  * **Gestión de Categorías:** Listar, Crear, Editar, Eliminar.
  * **(Próximamente):** CRUDs para Unidades, Tags, Ciudades, Barrios, Productos (con subida de imagen), Cupones, Clientes, Usuarios y gestión de Pedidos.
* **UI/UX:**
  * Notificaciones visuales (Toastr) para feedback al usuario (éxito, error, info).
  * Indicadores de carga (spinners) durante operaciones asíncronas.
  * Diseño basado en Bootstrap con componentes NgBootstrap.
  * Navegación fluida con `RouterModule`.
  * Sidebar y Header interactivos.
  * Páginas estáticas (Términos y Condiciones, Política de Privacidad).

## 🛠️ Tecnologías Utilizadas

* **Framework:** Angular (v14+ asumido)
* **Lenguaje:** TypeScript
* **UI:**
  * HTML5, SCSS
  * Bootstrap 5 (vía clases CSS)
  * NgBootstrap (para componentes como Paginación, Modales)
  * Bootstrap Icons (para iconografía)
* **Gestión de Estado (Básica):** RxJS (BehaviorSubject, Observable) en Servicios
* **HTTP Client:** Angular HttpClientModule
* **Routing:** Angular RouterModule
* **Formularios:** Angular ReactiveFormsModule, FormsModule
* **Notificaciones:** `ngx-toastr`
* **Gestión de Paquetes:** npm o yarn
* **Build Tool:** Angular CLI

## 🏗️ Estructura del Proyecto

El proyecto sigue una estructura modular estándar de Angular:

* **`app/`**: Módulo raíz y componentes principales.
  * `app-routing.module.ts`: Define las rutas principales y carga diferida.
  * `app.module.ts`: Módulo raíz de la aplicación.
* **`auth/`**: Módulo para autenticación (Login, Registro, Guards, Interceptor, Service).
* **`features/`**: Contiene los módulos de las funcionalidades principales.
  * `cart/`: Gestión del carrito.
  * `checkout/`: Proceso de pago.
  * `dashboard/`: Página de inicio.
  * `orders/`: Historial y detalle de pedidos del cliente.
  * `payments/`: Componentes de callback de pago.
  * `products/`: Listado y detalle de productos.
* **`admin/`**: Módulo (lazy loaded) para la interfaz de administración.
  * `pages/`: Componentes de las páginas CRUD (List, Form).
  * `services/`: Servicios para interactuar con la API de admin.
  * `guards/`: Guardia para proteger el acceso a admin.
* **`shared/`**: Módulo con componentes, servicios, modelos y pipes reutilizables.
  * `components/`: Componentes comunes (Notpagefound).
  * `header/`, `sidebar/`, `layouts/`: Componentes de la estructura visual.
  * `models/`: Interfaces comunes (IUser).
  * `pages/`: Páginas estáticas (Términos, Privacidad).
  * `services/`: Servicios compartidos (NotificationService).
  * `dtos/`: DTOs compartidos (PaginationDto).
* **`environments/`**: Archivos de configuración para diferentes entornos (API URL).
* **`assets/`**: Archivos estáticos (imágenes, fuentes, etc.).

## 📋 Prerrequisitos

* **Node.js:** v16 o v18+ recomendado.
* **npm** o **yarn**.
* **Angular CLI:** (Opcional, pero recomendado) `npm install -g @angular/cli`.
* **API Backend Corriendo:** La [API Backend](link-a-tu-repo-backend) debe estar ejecutándose y accesible. Anota su URL.

## 🚀 Instalación

1. **Clona el repositorio:**
   ```bash
   git clone <tu-repositorio-frontend-url>
   cd <nombre-del-directorio-frontend>
   ```
2. **Instala las dependencias:**
   ```bash
   npm install
   # o
   yarn install
   ```
3. **Configura las variables de entorno:**
   * Edita el archivo `src/environments/environment.ts` para desarrollo:
     ```typescript
     export const environment = {
       production: false,
       apiUrl: 'http://localhost:3000' // <-- URL de tu API Backend local
     };
     ```
   * Edita el archivo `src/environments/environment.prod.ts` para producción:
     ```typescript
     export const environment = {
       production: true,
       apiUrl: 'https://tu-api-backend-en-produccion.com' // <-- URL de tu API Backend en producción
     };
     ```
   * **Importante:** Asegúrate de que la `apiUrl` en `environment.ts` coincida con la URL donde se está ejecutando tu backend localmente (probablemente `http://localhost:PORT`, donde `PORT` es el puerto configurado en el `.env` del backend, por defecto 3000).

## ▶️ Ejecutar la Aplicación

* **Modo Desarrollo:**

  * Ejecuta el siguiente comando. Esto compilará la aplicación, iniciará un servidor de desarrollo y abrirá automáticamente tu navegador en `http://localhost:4200/`.

  ```bash
  ng serve -o
  ```

  * La aplicación se recargará automáticamente si cambias algún archivo fuente.
* **Compilar para Producción:**

  * Ejecuta el siguiente comando para compilar la aplicación optimizada para producción:

  ```bash
  ng build --configuration production
  # o simplemente
  ng build
  ```

  * Los archivos compilados se encontrarán en el directorio `dist/<nombre-del-proyecto>/`.
  * Estos archivos estáticos (HTML, CSS, JS) deben ser desplegados en un servidor web (como Nginx, Apache, Firebase Hosting, Netlify, Vercel, etc.).

## 🌐 Flujo de Autenticación

1. El usuario navega a `/auth/login` o `/auth/register`.
2. Ingresa credenciales/datos.
3. `AuthService` envía la petición a la API Backend.
4. Si el login es exitoso, la API devuelve un objeto `user` que contiene el `token` JWT.
5. `AuthService` almacena el token y la información del usuario (sin el token) en `localStorage`.
6. `AuthService` actualiza los `BehaviorSubject` (`isAuthenticatedSubject`, `userSubject`).
7. El `AuthInterceptor` adjuntará el token (`Bearer <token>`) a las cabeceras `Authorization` de las peticiones HTTP subsiguientes a la API.
8. El `AuthGuard` verifica la presencia del token (llamando a `AuthService.getToken()`) para permitir o denegar el acceso a rutas protegidas.
9. Si una petición a la API devuelve un error 401, el `AuthInterceptor` llama a `AuthService.logout()`, limpiando `localStorage` y redirigiendo al login.

## 🛡️ Sección de Administración (`/admin`)

* Acceso protegido mediante `AdminGuard` (verifica rol `ADMIN_ROLE` del usuario autenticado - *pendiente de implementación completa*).
* Permite la gestión (CRUD - Crear, Leer, Actualizar, Eliminar) de las entidades principales de la tienda:
  * **Categorías:** Implementado (Listar, Crear/Editar).
  * **(Próximamente):** Unidades, Tags, Ciudades, Barrios, Productos (incluyendo subida de imágenes), Cupones, Clientes, Usuarios (gestión de roles), Pedidos (ver/actualizar estado).
* Utiliza servicios específicos (ej: `AdminCategoryService`) que llaman a los endpoints `/api/admin/...` del backend.

## 🚧 Mejoras Futuras / TODO (Frontend)

* **Implementar `AdminGuard`:** Asegurar que solo usuarios con `ADMIN_ROLE` accedan a `/admin`.
* **Completar CRUDs Admin:** Desarrollar las interfaces para gestionar todas las entidades listadas en la sección Admin.
  * **Productos Admin:** Incluir formulario con subida de imagen a Cloudinary (usando un servicio que llame al endpoint del backend que a su vez usa el adaptador de Cloudinary). Selector múltiple para Tags.
* **UI Panel Admin:** Mejorar la navegación y presentación de la sección de administración (quizás un layout dedicado).
* **Chatbot UI:** Crear componente y servicio para interactuar con la API del chatbot (`/api/chatbot`).
* **Filtros Avanzados Productos:** Implementar UI para usar todos los filtros de la API (`/api/products/search`): por precio, ordenamiento, tags.
* **Gestión de Direcciones:** Crear sección en el perfil del usuario para añadir/editar/eliminar/marcar como default sus direcciones.
* **UI "Olvidé Contraseña":** Añadir formularios y lógica para el flujo de reseteo de contraseña.
* **UI Wishlist:** Si se implementa en backend.
* **UI Reseñas:** Si se implementa en backend.
* **Pruebas:** Añadir pruebas unitarias (Karma/Jasmine) y E2E (Cypress/Protractor).
* **Optimización:** Lazy loading de imágenes, optimización de bundles, estrategias de caché.
* **Accesibilidad (a11y):** Mejorar la accesibilidad del sitio.
* **Progressive Web App (PWA):** Convertir la aplicación en una PWA para capacidades offline y de instalación.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un Pull Request en el repositorio.

## 📄 Licencia

(Opcional: Especifica tu licencia, ej. MIT)
