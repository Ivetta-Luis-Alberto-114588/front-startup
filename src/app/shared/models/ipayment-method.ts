// src/app/shared/models/ipayment-method.ts
/**
 * Interfaz para el método de pago según la respuesta del backend
 */
export interface IPaymentMethod {
    _id: string;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
    defaultOrderStatusId: string;
    requiresOnlinePayment: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Interfaz para crear un nuevo método de pago
 */
export interface IPaymentMethodCreateDto {
    name: string;
    code: string;
    description: string;
    isActive?: boolean;
    defaultOrderStatusId: string;
    requiresOnlinePayment: boolean;
}

/**
 * Interfaz para actualizar un método de pago
 */
export interface IPaymentMethodUpdateDto {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
    defaultOrderStatusId?: string;
    requiresOnlinePayment?: boolean;
}

/**
 * Interfaz para datos del formulario
 */
export interface PaymentMethodFormData {
    name: string;
    code: string;
    description: string;
    isActive: boolean;
    defaultOrderStatusId: string;
    requiresOnlinePayment: boolean;
}

/**
 * Interfaz para respuesta paginada de Payment Methods
 */
export interface PaginatedPaymentMethodsResponse {
    total: number;
    paymentMethods: IPaymentMethod[];
    currentPage: number;
    totalPages: number;
}
