**Explicación Detallada del Flujo:**

* **Inicio y Carrito (Usuario/Frontend):** **El usuario navega, añade productos y va al carrito.**
* **Iniciar Checkout (Usuario/Frontend):** **Al hacer clic en "Proceder al Pago", el frontend verifica si el usuario ya está logueado.**
* **Identificación (Usuario/Frontend):**

  * **Si está logueado:** **Se salta al paso de dirección (puede usar direcciones guardadas).**
  * **Si no está logueado:** **Se le presentan las opciones: Iniciar sesión, Registrarse o Continuar como invitado.**
  * **Login:** **El usuario ingresa credenciales, el backend las valida.**
  * **Registro:** **El usuario completa el formulario, el backend crea la cuenta.**
  * **Invitado:** **El usuario ingresa su email y datos básicos (nombre, apellido) directamente en el formulario de checkout.**
* **Dirección de Envío (Usuario/Frontend/Backend):**

  * **Usuarios Logueados:** **Pueden seleccionar una dirección guardada o ingresar una nueva.**
  * **Nuevos Registros / Invitados:** **Ingresan su dirección completa por primera vez.**
  * **Importante:** **Esta información se maneja y valida** **en tu aplicación**.
* **Cálculo y Selección de Envío (Usuario/Frontend/Backend):**

  * **Con la dirección ya disponible, el frontend puede solicitar al backend que calcule las opciones y costos de envío disponibles para esa ubicación.**
  * **El frontend muestra las opciones y el usuario selecciona una.**
* **Resumen del Pedido (Frontend):** **Se muestra un resumen claro con todos los productos, el costo de envío seleccionado y el importe total a pagar.**
* **Selección de Mercado Pago (Usuario/Frontend/Backend):**

  * **El usuario confirma que quiere pagar con Mercado Pago.**
  * **El frontend** **envía todos los datos relevantes al backend**:

    * **Items del carrito (IDs, cantidades, precios).**
  * **Datos del comprador (obtenidos del login o del formulario de invitado: email, nombre).**
  * **Dirección de envío completa.**
  * **Método de envío seleccionado y su costo.**
  * **Total final.**
* **Creación de Preferencia de Pago (Backend/Mercado Pago):**

  * **Tu backend** **recibe la información.**
  * **Usa el SDK de Mercado Pago para crear una "Preferencia de Pago".**
  * **Incluye los detalles del pedido, el** **payer** **(comprador), las** **back_urls** **(a dónde volverá el usuario) y la** **notification_url** **(webhook para tu backend).** **No necesariamente necesita pedir la dirección en MP**, ya que la tienes.
  * **Mercado Pago devuelve una URL única (**init_point**).**
  * **Tu backend envía esta URL de vuelta al frontend.**
* **Redirección a Mercado Pago (Frontend/Usuario):** **El frontend redirige automáticamente al usuario a la URL (**init_point**) proporcionada por el backend.**
* **Pago en Mercado Pago (Usuario/Mercado Pago):** **El usuario interactúa con la interfaz segura de Mercado Pago para completar la transacción (ingresa datos de tarjeta, elige medio de pago, etc.).**
* **Retorno del Usuario (Mercado Pago/Frontend):**

  * **Una vez finalizado el pago (éxito, fallo o pendiente), Mercado Pago redirige al usuario a la** **back_url** **que especificaste en la preferencia.**
  * **El frontend recibe esta redirección y muestra la página correspondiente (ej. "¡Gracias por tu compra!", "Hubo un problema con tu pago").**
* **Notificación Webhook (Mercado Pago/Backend):**

  * **Crucial y Asíncrono:** **Casi al mismo tiempo que la redirección, Mercado Pago envía una notificación silenciosa (POST request) a la** **notification_url** **(webhook) de tu backend.**
  * **Tu backend recibe esta notificación.**
  * **Usa la información de la notificación (como el** **id** **del pago/orden) para consultar nuevamente a la API de Mercado Pago y obtener el estado** **definitivo y seguro** **del pago.**
  * **Valida que el pago esté aprobado (**approved**).**
  * **Actualiza el estado del pedido en tu base de datos (marcarlo como pagado).**
  * **Desencadena acciones posteriores (enviar email de confirmación detallado, notificar al área de despacho, etc.).**
* **Fin (Usuario):** **El usuario ve la página de resultado en el frontend, mientras que el backend ya ha procesado (o está procesando) la confirmación real a través del webhook.**

**Este flujo te da el control sobre los datos del cliente y el cálculo del envío antes de involucrar a Mercado Pago, a la vez que ofrece flexibilidad al usuario (login o invitado) y utiliza el mecanismo robusto de webhooks para la confirmación segura de los pagos.**
