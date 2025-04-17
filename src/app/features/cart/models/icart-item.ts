// src/app/features/cart/models/icart-item.ts
import { IProduct } from "../../products/model/iproduct"; // Asegúrate que la ruta a IProduct sea correcta

/**
 * Representa un ítem dentro del carrito de compras en el frontend.
 * Basado en CartItemEntity y CartItemMapper del backend.
 */
export interface ICartItem {
    /** El producto asociado a este ítem del carrito (debería venir poblado). */
    product: IProduct;
    /** La cantidad de este producto en el carrito. */
    quantity: number;
    /** El precio unitario SIN IVA del producto al momento de añadirlo. */
    priceAtTime: number;
    /** La tasa de IVA (%) del producto al momento de añadirlo. */
    taxRate: number;
    /** El precio unitario CON IVA calculado (priceAtTime * (1 + taxRate / 100)). */
    unitPriceWithTax: number;
    /** El subtotal CON IVA para este ítem (quantity * unitPriceWithTax). */
    subtotalWithTax: number;
}