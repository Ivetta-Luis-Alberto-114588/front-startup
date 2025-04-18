/**
 * Representa la información básica del registro de pago guardado
 * en tu base de datos, tal como la devuelve el backend.
 * Incluye los campos más relevantes que el frontend podría necesitar.
 */
export interface IPayment {
    id: string;
    saleId: string; // ID de la orden/venta asociada en tu sistema
    customerId: string; // ID del cliente asociado en tu sistema
    amount: number;
    provider: string; // Ej: 'mercado_pago'
    status: string;   // Ej: 'pending', 'approved', 'rejected' (Podrías usar un Enum aquí)
    externalReference: string; // Referencia externa (ej: 'sale-xxxx')
    preferenceId: string; // ID de la preferencia de MP asociada
    paymentMethod: string; // Ej: 'credit_card', 'other' (Podrías usar un Enum)
    createdAt: string | Date; // Puede venir como string ISO o Date
    updatedAt: string | Date;
    // Puedes añadir más campos si son necesarios para tu UI
    // metadata?: any;
}