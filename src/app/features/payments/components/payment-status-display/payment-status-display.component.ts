import { Component, OnInit, Input } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { IPaymentStatusResponse } from '../../models/IPaymentStatusResponse';

@Component({
    selector: 'app-payment-status-display',
    templateUrl: './payment-status-display.component.html',
    styleUrls: ['./payment-status-display.component.scss']
})
export class PaymentStatusDisplayComponent implements OnInit {
    @Input() saleId!: string;
    @Input() showTitle: boolean = true;
    @Input() compact: boolean = false;

    public isLoading: boolean = false;
    public error: string | null = null;
    public paymentStatus: IPaymentStatusResponse | null = null;

    constructor(
        private paymentService: PaymentService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        if (this.saleId) {
            this.loadPaymentStatus();
        }
    }

    /**
     * Carga el estado completo del pago usando el endpoint GET /api/payments/status/sale/:saleId
     */
    loadPaymentStatus(): void {
        this.isLoading = true;
        this.error = null;

        this.paymentService.getPaymentStatusBySale(this.saleId).subscribe({
            next: (response) => {
                // Normalizar la respuesta del backend para manejar diferencias en estructura
                this.paymentStatus = this.normalizePaymentStatus(response);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error al cargar estado del pago:', error);

                if (error.status === 401) {
                    // Para usuarios invitados, no mostrar error, solo ocultar la información
                    const isAuthenticated = this.authService.isAuthenticated();
                    if (!isAuthenticated) {
                        console.log('Usuario invitado: ocultando información de pago detallada');
                        this.error = null; // No mostrar error para invitados
                    } else {
                        this.error = 'Se requiere autenticación para ver los detalles completos del pago';
                    }
                } else {
                    this.error = 'No se pudo cargar la información del pago';
                }

                this.isLoading = false;
            }
        });
    }

    /**
     * Normaliza la respuesta del backend para manejar diferentes estructuras
     */
    private normalizePaymentStatus(rawResponse: any): IPaymentStatusResponse {
        const payment = rawResponse.payment || rawResponse;

        // Extraer status correctamente
        let status = payment.status;
        if (typeof status === 'object' && status !== null) {
            // Si el status es un objeto, usar code o name
            status = status.code || status.name || 'UNKNOWN';
        }
        status = String(status || 'UNKNOWN');

        // Extraer Payment ID de MercadoPago desde notes
        let mercadoPagoPaymentId = payment.mercadoPagoPaymentId;
        if (!mercadoPagoPaymentId && payment.notes) {
            // Buscar ID de MercadoPago en notes
            const noteMatch = payment.notes.match(/Payment ID MercadoPago:\s*(\d+)/i);
            if (noteMatch) {
                mercadoPagoPaymentId = noteMatch[1];
            }
        }

        // External Reference debería ser el ID de la orden/venta
        const externalReference = payment.externalReference || payment.id || payment.saleId || 'N/A';

        // Inferir provider y método de pago
        let provider = payment.provider || 'MercadoPago';
        let paymentMethod = payment.paymentMethod || 'Tarjeta de Crédito';

        // Si tenemos Payment ID de MP, asumir MercadoPago
        if (mercadoPagoPaymentId) {
            provider = 'MercadoPago';
        }

        const normalizedPayment = {
            id: payment.id || 'N/A',
            saleId: payment.saleId || this.saleId,
            customerId: payment.customerId || payment.customer_id || 'N/A',
            amount: Number(payment.amount || payment.total || 0),
            provider: provider,
            status: status,
            externalReference: externalReference,
            preferenceId: payment.preferenceId || payment.preference_id || 'N/A',
            paymentMethod: paymentMethod,
            idempotencyKey: payment.idempotencyKey || payment.idempotency_key,
            lastVerified: payment.lastVerified || payment.last_verified,
            createdAt: payment.createdAt || payment.created_at || payment.createAt,
            updatedAt: payment.updatedAt || payment.updated_at || payment.updateAt,
            mercadoPagoPaymentId: mercadoPagoPaymentId,
            mercadoPagoStatus: payment.mercadoPagoStatus || status,
            transactionAmount: Number(payment.transactionAmount || payment.amount || payment.total || 0),
            dateApproved: payment.dateApproved || payment.date_approved
        };

        // Normalizar verificación OAuth si existe
        let verification = undefined;
        if (rawResponse.verification) {
            verification = {
                oauthVerified: Boolean(rawResponse.verification.oauthVerified),
                realStatus: String(rawResponse.verification.realStatus || status),
                verifiedAt: rawResponse.verification.verifiedAt || new Date().toISOString(),
                statusMatch: Boolean(rawResponse.verification.statusMatch)
            };
        }

        return {
            success: Boolean(rawResponse.success !== false), // Default true unless explicitly false
            payment: normalizedPayment,
            verification: verification
        };
    }

    /**
     * Refresca la información del pago
     */
    refresh(): void {
        this.loadPaymentStatus();
    }

    /**
     * Obtiene la clase CSS para el badge del estado
     */
    getStatusBadgeClass(status: string): string {
        // Verificar que status sea un string válido
        if (!status || typeof status !== 'string') {
            return 'bg-secondary';
        }

        // Convertir a string y luego a lowercase de forma segura
        const statusStr = String(status).toLowerCase().trim();

        switch (statusStr) {
            case 'approved':
            case 'pagado':
            case 'paid':
            case 'completado':
            case 'completed':
                return 'bg-success';
            case 'pending':
            case 'pendiente':
            case 'pendiente pagado':
            case 'pending_payment':
            case 'awaiting_payment':
                return 'bg-warning text-dark';
            case 'rejected':
            case 'cancelled':
            case 'rechazado':
            case 'cancelado':
            case 'failed':
            case 'error':
                return 'bg-danger';
            case 'in_process':
            case 'processing':
            case 'en_proceso':
            case 'procesando':
                return 'bg-info';
            default:
                // Para estados desconocidos, verificar si parece exitoso
                if (statusStr.includes('pagado') || statusStr.includes('paid') || statusStr.includes('success')) {
                    return 'bg-success';
                }
                if (statusStr.includes('pendiente') || statusStr.includes('pending')) {
                    return 'bg-warning text-dark';
                }
                if (statusStr.includes('cancel') || statusStr.includes('reject') || statusStr.includes('error') || statusStr.includes('fail')) {
                    return 'bg-danger';
                }
                return 'bg-secondary';
        }
    }

    /**
     * Obtiene el ícono para el estado
     */
    getStatusIcon(status: string): string {
        if (!status || typeof status !== 'string') {
            return 'bi-question-circle-fill';
        }

        const statusStr = String(status).toLowerCase().trim();

        switch (statusStr) {
            case 'approved':
            case 'pagado':
            case 'paid':
            case 'completado':
            case 'completed':
                return 'bi-check-circle-fill';
            case 'pending':
            case 'pendiente':
            case 'pendiente pagado':
            case 'pending_payment':
            case 'awaiting_payment':
                return 'bi-clock-fill';
            case 'rejected':
            case 'cancelled':
            case 'rechazado':
            case 'cancelado':
            case 'failed':
            case 'error':
                return 'bi-x-circle-fill';
            case 'in_process':
            case 'processing':
            case 'en_proceso':
            case 'procesando':
                return 'bi-gear-fill';
            default:
                // Para estados desconocidos, verificar patrones
                if (statusStr.includes('pagado') || statusStr.includes('paid') || statusStr.includes('success')) {
                    return 'bi-check-circle-fill';
                }
                if (statusStr.includes('pendiente') || statusStr.includes('pending')) {
                    return 'bi-clock-fill';
                }
                if (statusStr.includes('cancel') || statusStr.includes('reject') || statusStr.includes('error') || statusStr.includes('fail')) {
                    return 'bi-x-circle-fill';
                }
                return 'bi-question-circle-fill';
        }
    }

    /**
     * Copia texto al portapapeles
     */
    copyToClipboard(text: string): void {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                // Opcional: mostrar mensaje de confirmación
                console.log('Payment ID copiado al portapapeles');
            }).catch(err => {
                console.error('Error al copiar al portapapeles:', err);
            });
        } else {
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                console.log('Payment ID copiado al portapapeles (fallback)');
            } catch (err) {
                console.error('Error al copiar al portapapeles (fallback):', err);
            }
            document.body.removeChild(textArea);
        }
    }
}
