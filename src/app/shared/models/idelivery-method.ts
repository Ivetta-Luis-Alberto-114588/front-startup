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
    description?: string;

    /** Precio del método de entrega (opcional por compatibilidad con API) */
    price?: number;

    /** Indica si este método requiere que el usuario proporcione una dirección de envío */
    requiresAddress: boolean;

    /** Indica si el método está activo y disponible para selección */
    isActive: boolean;

    /** Días estimados de entrega */
    estimatedDeliveryDays?: number;

    /** Peso máximo permitido en kg */
    maxWeight?: number;

    /** Áreas geográficas donde está disponible */
    availableAreas?: string[];
}

/**
 * Respuesta del endpoint GET /api/delivery-methods
 */
export interface IDeliveryMethodsResponse {
    deliveryMethods: IDeliveryMethod[];
}
