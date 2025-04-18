// Interfaz para un item dentro de una orden recibida (con producto poblado)
export interface IOrderItem {
    product: any; // Deberías tener IProduct aquí
    quantity: number;
    unitPrice: number;
    subtotal: number;
}
