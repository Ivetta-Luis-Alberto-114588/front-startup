/**
 * Representa la información esencial sobre la preferencia de Mercado Pago
 * necesaria por el frontend, principalmente para la redirección al checkout.
 */
export interface IPaymentPreferenceInfo {
    /** El ID único de la preferencia generado por Mercado Pago. */
    id: string;

    /** La URL de producción a la que se debe redirigir al usuario para pagar. */
    init_point: string;

    /** La URL de sandbox (pruebas) a la que se debe redirigir al usuario para pagar. */
    sandbox_init_point: string;
}