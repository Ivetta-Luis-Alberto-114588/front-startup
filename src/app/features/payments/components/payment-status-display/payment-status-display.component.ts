import { Component, OnInit, Input } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
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

    constructor(private paymentService: PaymentService) { }

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
                this.paymentStatus = response;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error al cargar estado del pago:', error);

                if (error.status === 401) {
                    this.error = 'Se requiere autenticación para ver los detalles completos del pago';
                } else {
                    this.error = 'No se pudo cargar la información del pago';
                }

                this.isLoading = false;
            }
        });
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
        const statusStr = String(status).toLowerCase();

        switch (statusStr) {
            case 'approved':
            case 'pagado':
                return 'bg-success';
            case 'pending':
            case 'pendiente':
            case 'pendiente pagado':
                return 'bg-warning text-dark';
            case 'rejected':
            case 'cancelled':
            case 'rechazado':
            case 'cancelado':
                return 'bg-danger';
            case 'in_process':
            case 'processing':
                return 'bg-info';
            default:
                return 'bg-secondary';
        }
    }

    /**
     * Obtiene el ícono para el estado
     */
    getStatusIcon(status: string): string {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'pagado':
                return 'bi-check-circle-fill';
            case 'pending':
            case 'pendiente':
            case 'pendiente pagado':
                return 'bi-clock-fill';
            case 'rejected':
            case 'cancelled':
            case 'rechazado':
            case 'cancelado':
                return 'bi-x-circle-fill';
            case 'in_process':
            case 'processing':
                return 'bi-gear-fill';
            default:
                return 'bi-question-circle-fill';
        }
    }
}
