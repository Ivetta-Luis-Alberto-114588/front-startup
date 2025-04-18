/**
 * Representa la estructura de un ítem individual
 * dentro del payload para crear una orden.
 */
export interface ICreateOrderItemPayload {
    /** ID del producto (de MongoDB). Requerido. */
    productId: string;
    /** Cantidad del producto. Requerido (entero positivo). */
    quantity: number;
    /**
     * Precio unitario CON IVA al momento de realizar el pedido.
     * Este valor generalmente viene del estado del carrito. Requerido.
     */
    unitPrice: number;
}