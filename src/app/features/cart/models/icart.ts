// src/app/features/cart/models/icart.ts
import { IUser } from "src/app/shared/models/iuser"; // Ajusta la ruta si es necesario
import { ICartItem } from "./icart-item";

/**
 * Representa el estado completo del carrito de compras en el frontend.
 * Basado en CartEntity y CartMapper del backend.
 */
export interface ICart {
    /** ID único del carrito. */
    id: string;
    /** ID del usuario dueño del carrito. */
    userId: string;
    /** Información básica del usuario (puede venir poblada). */
    user: IUser;
    /** Array de ítems en el carrito. */
    items: ICartItem[];
    /** Fecha de creación del carrito. */
    createdAt: Date;
    /** Fecha de la última actualización del carrito. */
    updatedAt: Date;
    /** Cantidad total de ítems individuales en el carrito. */
    totalItems: number;
    /** Subtotal del carrito SIN IVA. */
    subtotalWithoutTax: number;
    /** Monto total de IVA acumulado en el carrito. */
    totalTaxAmount: number;
    /** Monto total del carrito (suma de subtotales CON IVA). */
    total: number;
}

/**
 * Representa la estructura esperada al añadir un item (request).
 */
export interface AddCartItemRequest {
    productId: string;
    quantity: number;
}

/**
 * Representa la estructura esperada al actualizar un item (request).
 */
export interface UpdateCartItemRequest {
    quantity: number;
}