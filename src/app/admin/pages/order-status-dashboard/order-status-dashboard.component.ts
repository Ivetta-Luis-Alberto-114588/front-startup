// src/app/admin/pages/order-status-dashboard/order-status-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { IOrder } from 'src/app/features/orders/models/iorder';
import { OrderStatusService } from 'src/app/shared/services/order-status.service';
import { AdminOrderService, UpdateOrderStatusPayload } from '../../services/admin-order.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

declare var bootstrap: any; // Para usar Bootstrap modal

@Component({
    selector: 'app-order-status-dashboard',
    templateUrl: './order-status-dashboard.component.html',
    styleUrls: ['./order-status-dashboard.component.css']
})
export class OrderStatusDashboardComponent implements OnInit, OnDestroy {
    // Subjects para el manejo de subscripciones
    private destroy$ = new Subject<void>();

    // Estados del componente
    isLoading = true;
    errorMessage: string | null = null;
    isUpdatingStatus = false;

    // Datos principales
    orderStatuses: IOrderStatus[] = [];
    allOrders: IOrder[] = [];
    ordersGroupedByStatus: { [statusCode: string]: IOrder[] } = {};

    // Para el modal de cambio de estado
    selectedOrder: IOrder | null = null;
    newStatusId: string = '';
    statusChangeNotes: string = '';
    private statusChangeModal: any;

    constructor(
        public orderStatusService: OrderStatusService,
        private adminOrderService: AdminOrderService
    ) { }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        // Cerrar modal si está abierto
        if (this.statusChangeModal) {
            this.statusChangeModal.dispose();
        }
    }    /**
     * Carga los datos principales del dashboard
     */
    loadDashboardData(): void {
        this.isLoading = true;
        this.errorMessage = null;

        // Primero cargar los estados de pedidos
        this.orderStatusService.getOrderStatuses()
            .pipe(
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    console.log('Order statuses response:', response);

                    // Validar que la respuesta tiene la estructura esperada
                    if (!response || !Array.isArray(response.orderStatuses)) {
                        this.errorMessage = 'Error: La respuesta del servidor para estados de pedidos no es válida.';
                        this.isLoading = false;
                        return;
                    }

                    this.orderStatuses = response.orderStatuses
                        .filter((status: IOrderStatus) => status.isActive)
                        .sort((a: IOrderStatus, b: IOrderStatus) => a.order - b.order);
                    
                    console.log('Order statuses loaded:', this.orderStatuses.length, 'active statuses');
                    
                    // Luego cargar las órdenes
                    this.loadOrders();
                },
                error: (error) => {
                    console.error('Error loading order statuses:', error);
                    this.errorMessage = 'Error al cargar los estados de pedidos: ' + (error.error?.error || error.message);
                    this.isLoading = false;
                    
                    // Inicializar arreglos vacíos para evitar errores en la template
                    this.orderStatuses = [];
                    this.allOrders = [];
                    this.ordersGroupedByStatus = {};
                }
            });
    }/**
     * Carga las órdenes con manejo de errores mejorado
     */
    private loadOrders(): void {
        const pagination: PaginationDto = { page: 1, limit: 50 }; // Reducir límite para evitar timeouts

        this.adminOrderService.getOrders(pagination)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response) => {
                    this.allOrders = response.orders || [];
                    this.groupOrdersByStatus();
                    console.log('Orders loaded successfully:', this.allOrders.length, 'orders');
                },
                error: (error) => {
                    console.error('Error loading orders:', error);

                    if (error.status === 500 && error.error?.error?.includes('Cast to ObjectId failed')) {
                        this.errorMessage = 'Error del servidor: Hay un problema con los datos de las órdenes en la base de datos. ' +
                                          'Las referencias de estado no son válidas. Por favor, contacte al administrador del sistema para corregir los datos.';
                    } else if (error.status === 500) {
                        this.errorMessage = 'Error interno del servidor al cargar las órdenes. Por favor, contacte al administrador del sistema.';
                    } else {
                        this.errorMessage = 'Error al cargar las órdenes: ' + (error.error?.error || error.message);
                    }

                    // Inicializar con arreglo vacío para mostrar al menos la estructura de estados
                    this.allOrders = [];
                    this.groupOrdersByStatus();
                    
                    // Agregar información adicional para debugging
                    console.warn('Dashboard funcionando en modo limitado - solo se muestran los estados sin órdenes');
                }
            });
    }

    /**
     * Agrupa las órdenes por código de estado
     */
    private groupOrdersByStatus(): void {
        this.ordersGroupedByStatus = {};

        // Inicializar grupos para todos los estados
        this.orderStatuses.forEach(status => {
            this.ordersGroupedByStatus[status.code] = [];
        });    // Agrupar órdenes por estado
        this.allOrders.forEach(order => {
            if (order.status) {
                // Mapear status del order a código de estado del order status
                const statusCodeMap: { [key: string]: string } = {
                    'pending': 'PENDING',
                    'processing': 'PROCESSING',
                    'paid': 'PAID',
                    'preparing': 'PREPARING',
                    'ready': 'READY',
                    'shipped': 'SHIPPED',
                    'completed': 'COMPLETED',
                    'cancelled': 'CANCELLED'
                };

                const statusCode = statusCodeMap[order.status];
                if (statusCode && this.ordersGroupedByStatus[statusCode]) {
                    this.ordersGroupedByStatus[statusCode].push(order);
                }
            }
        });        // Ordenar órdenes dentro de cada grupo por fecha (más recientes primero)
        Object.keys(this.ordersGroupedByStatus).forEach(statusCode => {
            this.ordersGroupedByStatus[statusCode].sort((a: IOrder, b: IOrder) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });
        });
    }

    /**
     * Actualiza los datos del dashboard
     */
    refreshData(): void {
        this.loadDashboardData();
    }

    /**
     * Obtiene el total de órdenes
     */
    getTotalOrders(): number {
        return this.allOrders.length;
    }

    /**
     * Obtiene el número de órdenes por estado
     */
    getOrderCountByStatus(statusCode: string): number {
        return this.ordersGroupedByStatus[statusCode]?.length || 0;
    }

    /**
     * Obtiene las órdenes de un estado específico
     */
    getOrdersByStatus(statusCode: string): IOrder[] {
        return this.ordersGroupedByStatus[statusCode] || [];
    }
    /**
     * Obtiene los estados a los que puede transicionar una orden
     */
    getTransitionableStatuses(currentStatus: string): IOrderStatus[] {
        // Mapear status del order a ID del order status
        const statusMap: { [key: string]: string } = {
            'pending': 'PENDING',
            'processing': 'PROCESSING',
            'paid': 'PAID',
            'preparing': 'PREPARING',
            'ready': 'READY',
            'shipped': 'SHIPPED',
            'completed': 'COMPLETED',
            'cancelled': 'CANCELLED'
        };

        const statusCode = statusMap[currentStatus];
        if (!statusCode) return [];

        const currentOrderStatus = this.orderStatuses.find(s => s.code === statusCode);
        if (!currentOrderStatus) return [];        return currentOrderStatus.canTransitionTo
            .map((id: string) => this.orderStatuses.find(s => s.id === id))
            .filter((status: IOrderStatus | undefined) => status !== undefined) as IOrderStatus[];
    }

    /**
     * Abre el modal para cambiar el estado de una orden
     */
    openStatusChangeModal(order: IOrder): void {
        this.selectedOrder = order;
        this.newStatusId = '';
        this.statusChangeNotes = '';

        // Inicializar el modal de Bootstrap
        const modalElement = document.getElementById('statusChangeModal');
        if (modalElement) {
            this.statusChangeModal = new bootstrap.Modal(modalElement);
            this.statusChangeModal.show();
        }
    }

    /**
     * Actualiza el estado de una orden
     */
    updateOrderStatus(): void {
        if (!this.selectedOrder || !this.newStatusId) {
            return;
        }

        this.isUpdatingStatus = true;

        const newStatus = this.orderStatuses.find(s => s.id === this.newStatusId);
        if (!newStatus) {
            this.isUpdatingStatus = false;
            return;
        }

        // Mapear el código de estado al formato esperado por el backend
        const statusCodeMap: { [key: string]: string } = {
            'PENDING': 'pending',
            'PROCESSING': 'processing',
            'PAID': 'paid',
            'PREPARING': 'preparing',
            'READY': 'ready',
            'SHIPPED': 'shipped',
            'COMPLETED': 'completed',
            'CANCELLED': 'cancelled'
        };

        const payload: UpdateOrderStatusPayload = {
            status: statusCodeMap[newStatus.code] as any || 'pending',
            notes: this.statusChangeNotes || undefined
        };

        this.adminOrderService.updateOrderStatus(this.selectedOrder.id!, payload)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.isUpdatingStatus = false;
                })
            )
            .subscribe({
                next: (updatedOrder) => {
                    // Actualizar la orden en la lista local
                    const orderIndex = this.allOrders.findIndex(o => o.id === updatedOrder.id);
                    if (orderIndex !== -1) {
                        this.allOrders[orderIndex] = updatedOrder;
                        this.groupOrdersByStatus();
                    }

                    // Cerrar el modal
                    if (this.statusChangeModal) {
                        this.statusChangeModal.hide();
                    }

                    // Limpiar variables
                    this.selectedOrder = null;
                    this.newStatusId = '';
                    this.statusChangeNotes = '';
                },
                error: (error) => {
                    console.error('Error updating order status:', error);
                    // Podrías mostrar un toast o mensaje de error aquí
                    alert('Error al actualizar el estado del pedido: ' + (error.message || 'Error desconocido'));
                }
            });
    }

    /**
     * Formatea una fecha para mostrar
     */
    formatDate(date: string | Date | undefined): string {
        if (!date) return 'Fecha no disponible';

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Fecha inválida';

        return dateObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * TrackBy functions para mejorar performance
     */
    trackByStatusId(index: number, status: IOrderStatus): string {
        return status.id;
    }

    trackByOrderId(index: number, order: IOrder): string {
        return order.id || index.toString();
    }

    /**
     * Handles backend errors gracefully
     */
    private handleBackendError(error: any): void {
        console.error('Backend error:', error);

        if (error.status === 500 && error.error?.error?.includes('Cast to ObjectId failed')) {
            this.errorMessage = 'Error del servidor: Problema con las referencias de estado en las órdenes. ' +
                              'Por favor, contacte al administrador del sistema.';
        } else {
            this.errorMessage = 'Error al cargar los datos: ' + (error.error?.error || error.message);
        }
    }

    /**
     * Verifica si hay datos disponibles para mostrar
     */
    hasOrderStatuses(): boolean {
        return this.orderStatuses.length > 0;
    }

    /**
     * Verifica si hay órdenes cargadas
     */
    hasOrders(): boolean {
        return this.allOrders.length > 0;
    }

    /**
     * Verifica si el dashboard está en modo limitado (solo estados, sin órdenes)
     */
    isLimitedMode(): boolean {
        return this.hasOrderStatuses() && !this.hasOrders() && !this.isLoading;
    }

    /**
     * Obtiene un mensaje informativo sobre el estado del dashboard
     */
    getDashboardStatusMessage(): string {
        if (this.isLoading) {
            return 'Cargando datos del dashboard...';
        }
        
        if (this.errorMessage && !this.hasOrderStatuses()) {
            return 'No se pudieron cargar los datos del dashboard.';
        }
        
        if (this.isLimitedMode()) {
            return `Dashboard funcionando en modo limitado: Se muestran ${this.orderStatuses.length} estados de pedidos, pero no se pueden cargar las órdenes debido a problemas en el servidor.`;
        }
        
        if (this.hasOrderStatuses() && this.hasOrders()) {
            return `Dashboard completamente funcional: ${this.orderStatuses.length} estados y ${this.allOrders.length} órdenes cargadas.`;
        }
        
        return 'Iniciando dashboard...';
    }
}
