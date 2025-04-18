import { IPayment } from "./IPayment";
import { IPaymentPreferenceInfo } from "./IPaymentPreferenceInfo";

/**
 * Representa la respuesta completa recibida del backend
 * (POST /api/payments/sale/:saleId) después de crear exitosamente
 * un registro de pago y una preferencia de Mercado Pago.
 */
export interface ICreatePaymentResponse {
    /** El registro del pago guardado en tu base de datos. */
    payment: IPayment;

    /** La información clave de la preferencia de Mercado Pago para la redirección. */
    preference: IPaymentPreferenceInfo;
}