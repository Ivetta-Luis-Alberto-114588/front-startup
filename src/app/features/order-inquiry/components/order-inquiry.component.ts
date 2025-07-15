import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderInquiryService } from '../services/order-inquiry.service';
import { PublicOrderResponse } from '../models/order-public.interface';

@Component({
    selector: 'app-order-inquiry',
    templateUrl: './order-inquiry.component.html',
    styleUrls: ['./order-inquiry.component.scss']
})
export class OrderInquiryComponent implements OnInit, OnDestroy {
    order: PublicOrderResponse | null = null;
    isLoading = false;
    error: string | null = null;
    orderId: string = '';

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private orderInquiryService: OrderInquiryService
    ) { }

    ngOnInit(): void {
        this.route.params
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                this.orderId = params['orderId'];
                if (this.orderId) {
                    this.loadOrder();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Carga los datos de la orden
     */
    private loadOrder(): void {
        this.isLoading = true;
        this.error = null;

        this.orderInquiryService.getOrderById(this.orderId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (order) => {
                    this.order = order;
                    this.isLoading = false;
                },
                error: (error) => {
                    this.error = error.message;
                    this.isLoading = false;
                }
            });
    }

    /**
     * Reintentar la carga de la orden
     */
    retryLoad(): void {
        this.loadOrder();
    }

    /**
     * Obtiene la clase CSS para el estado de la orden
     */
    getStatusClass(): string {
        if (!this.order?.status) return '';

        switch (this.order.status.code) {
            case 'PENDING':
                return 'badge bg-warning text-dark';
            case 'CONFIRMED':
                return 'badge bg-primary';
            case 'PREPARING':
                return 'badge bg-info';
            case 'READY':
                return 'badge bg-success';
            case 'DELIVERED':
                return 'badge bg-success';
            case 'CANCELLED':
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    }

    /**
     * Obtiene el texto del estado en español
     */
    getStatusText(): string {
        if (!this.order?.status) return '';

        switch (this.order.status.code) {
            case 'PENDING':
                return 'Pendiente';
            case 'CONFIRMED':
                return 'Confirmado';
            case 'PREPARING':
                return 'En Preparación';
            case 'READY':
                return 'Listo';
            case 'DELIVERED':
                return 'Entregado';
            case 'CANCELLED':
                return 'Cancelado';
            default:
                return this.order.status.name;
        }
    }

    /**
     * Formatea la fecha
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
