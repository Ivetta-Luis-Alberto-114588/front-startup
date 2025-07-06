/**
 * Representa un método de entrega disponible en el sistema.
 * Los métodos de entrega definen cómo el cliente recibirá su pedido.
 */
export interface IDeliveryMethod {
    /** ID único del método de entrega */
    id: string;

    /** Código único del método (ej: "SHIPPING", "PICKUP") */
    code: string;

    /** Nombre mostrable del método (ej: "Envío a Domicilio") */
    name: string;

    /** Descripción detallada para mostrar al usuario */
    description: string;

    /** Indica si este método requiere que el usuario proporcione una dirección de envío */
    requiresAddress: boolean;

    /** Indica si el método está activo y disponible para selección */
    isActive: boolean;
}

/**
 * Respuesta del endpoint GET /api/delivery-methods
 */
export interface IDeliveryMethodsResponse {
    deliveryMethods: IDeliveryMethod[];
}
