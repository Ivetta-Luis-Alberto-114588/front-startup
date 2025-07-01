/**
 * Respuesta del endpoint GET /api/payments/status/sale/:saleId
 * Incluye toda la información del pago local y verificación con MercadoPago
 */
export interface IPaymentStatusResponse {
    success: boolean;
    payment: {
        id: string;
        saleId: string;
        customerId: string;
        amount: number;
        provider: string;
        status: string;
        externalReference: string;
        preferenceId: string;
        paymentMethod: string;
        idempotencyKey?: string;
        lastVerified?: string; // Fecha de última verificación OAuth
        createdAt: string | Date;
        updatedAt: string | Date;
        // Información adicional de MercadoPago si está disponible
        mercadoPagoPaymentId?: string;
        mercadoPagoStatus?: string;
        transactionAmount?: number;
        dateApproved?: string;
    };
    verification?: {
        oauthVerified: boolean;
        realStatus: string;
        verifiedAt: string;
        statusMatch: boolean; // Si el status local coincide con MP
    };
}
