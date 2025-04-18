import { ICreateOrderItemPayload } from "./ICreateOrderItemPayload";

/**
 * Representa la estructura completa del payload que se envía
 * desde el frontend Angular al endpoint POST /api/sales del backend
 * para crear una nueva orden.
 */
export interface ICreateOrderPayload {
    /** Array de productos en el pedido. Requerido y no debe estar vacío. */
    items: ICreateOrderItemPayload[];

    /** Notas adicionales para el pedido. Opcional. */
    notes?: string;

    /** Código de cupón a aplicar. Opcional. */
    couponCode?: string;

    // --- Opciones de Dirección de Envío ---
    // El frontend debe enviar UNA de las siguientes opciones:
    // 1. selectedAddressId (si el usuario está logueado y elige una guardada)
    // 2. El conjunto de campos shipping... (si el usuario logueado ingresa una nueva O si es invitado)

    /**
     * ID de una dirección previamente guardada por el usuario.
     * Solo aplica para usuarios autenticados.
     * Si se envía este campo, NO se deben enviar los campos shipping...
     * Opcional.
     */
    selectedAddressId?: string | null;

    /**
     * Nombre de la persona que recibe el envío.
     * Requerido si NO se envía `selectedAddressId`.
     */
    shippingRecipientName?: string;

    /**
     * Teléfono de contacto para el envío.
     * Requerido si NO se envía `selectedAddressId`.
     */
    shippingPhone?: string;

    /**
     * Dirección completa (calle, número, piso, etc.) para el envío.
     * Requerido si NO se envía `selectedAddressId`.
     */
    shippingStreetAddress?: string;

    /** Código postal para el envío. Opcional. */
    shippingPostalCode?: string;

    /**
     * ID (de MongoDB) del barrio para el envío.
     * Requerido si NO se envía `selectedAddressId`.
     */
    shippingNeighborhoodId?: string;

    /**
     * ID (de MongoDB) de la ciudad para el envío.
     * Opcional (el backend puede derivarlo del barrio si no se envía).
     */
    shippingCityId?: string;

    /** Instrucciones adicionales para la entrega. Opcional. */
    shippingAdditionalInfo?: string;

    // --- Datos del Cliente (SOLO para invitados NUEVOS) ---
    // Estos campos solo son necesarios si el usuario NO está autenticado (userId es undefined en el backend)
    // Y si el backend no encuentra un cliente existente con ese email.

    /**
     * Nombre del cliente invitado.
     * Requerido si el usuario no está autenticado y es un cliente nuevo.
     */
    customerName?: string;

    /**
     * Email del cliente invitado.
     * Requerido si el usuario no está autenticado y es un cliente nuevo.
     */
    customerEmail?: string;

    // Nota: customerId (para invitados existentes) generalmente no se envía desde el frontend.
    // El backend lo buscará por email si el usuario no está autenticado.
}