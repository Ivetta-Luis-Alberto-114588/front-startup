// src/app/admin/pages/order-status-dashboard/order-status-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { IOrder } from 'src/app/features/orders/models/iorder';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { AdminOrderService, IGroupedOrdersForDashboard, UpdateOrderStatusPayload } from '../../services/admin-order.service';
import { AdminOrderStatusService } from '../../services/admin-order-status.service';
import { OrderStatusService } from 'src/app/shared/services/order-status.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

declare var bootstrap: any;

@Component({
    selector: 'app-order-status-dashboard',
    templateUrl: './order-status-dashboard.component.html',
    styleUrls: ['./order-status-dashboard.component.css']
})
export class OrderStatusDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    dashboardData: IGroupedOrdersForDashboard[] = [];
    allOrderStatuses: IOrderStatus[] = []; // Para poblar el select del modal
    isLoading = false;
    errorMessage: string | null = null;
    isUpdatingStatus = false;

    selectedOrder: IOrder | null = null;
    newStatusId: string = ''; // Guardará el _id del IOrderStatus
    statusChangeNotes: string = '';
    private statusChangeModal: any;    constructor(
        private adminOrderService: AdminOrderService,
        private adminOrderStatusService: AdminOrderStatusService,
        public orderStatusService: OrderStatusService, // Público para usar getStatusIcon en template
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadAllStatusesAndDashboardData(); // Carga primero los estados, luego el dashboard
        const modalElement = document.getElementById('statusChangeModal');
        if (modalElement) {
            this.statusChangeModal = new bootstrap.Modal(modalElement);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.statusChangeModal) {
            this.statusChangeModal.dispose();
        }
    }

    loadAllStatusesAndDashboardData(): void {
        this.isLoading = true;
        this.errorMessage = null;
        this.orderStatusService.getOrderStatuses() // Asumimos que obtiene todos los activos
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    // isLoading se manejará en la carga del dashboard si los estados cargan bien
                })
            )
            .subscribe({
                next: (response) => {
                    if (response && response.orderStatuses) {
                        this.allOrderStatuses = response.orderStatuses.filter(s => s.isActive).sort((a, b) => a.priority - b.priority);
                    } else if (Array.isArray(response)) { // Si getOrderStatuses devuelve IOrderStatus[] directamente
                        this.allOrderStatuses = response.filter(s => s.isActive).sort((a, b) => a.priority - b.priority);
                    } else {
                        this.allOrderStatuses = [];
                    }
                    this.loadDashboardData(); // Cargar datos del dashboard una vez que los estados estén listos
                },                error: (err: HttpErrorResponse) => {
                    this.errorMessage = err.error?.error || 'Error al cargar los tipos de estado de pedido.';
                    this.notificationService.showError(this.errorMessage || 'Error desconocido', 'Error de Configuración');
                    this.isLoading = false;
                }
            });
    }


    loadDashboardData(): void {
        this.isLoading = true; // Podría ya estar en true
        // this.errorMessage = null; // No resetear si ya hubo error de estados
        this.adminOrderService.getOrdersForDashboardView()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (data) => {
                    this.dashboardData = data;
                    // Si los estados no se cargaron antes (por error), intentar obtenerlos de aquí
                    if (this.allOrderStatuses.length === 0 && data.length > 0) {
                        this.allOrderStatuses = data.map(group => group.status).filter(s => s.isActive).sort((a, b) => a.priority - b.priority);
                    }
                    if (data.length === 0 && !this.errorMessage) { // No sobrescribir error de carga de estados
                        this.errorMessage = "No hay datos para el dashboard o no hay estados activos.";
                    }
                },                error: (err: HttpErrorResponse) => {
                    this.errorMessage = err.error?.error || 'Error al cargar los datos del dashboard de pedidos.';
                    this.notificationService.showError(this.errorMessage || 'Error desconocido', 'Error de Carga');
                }
            });
    }

    refreshData(): void {
        this.loadAllStatusesAndDashboardData();
    }

    drop(event: CdkDragDrop<IOrder[]>): void {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            const orderToMove = event.item.data as IOrder;
            const targetGroup = this.dashboardData.find(group => group.orders === event.container.data);

            if (!targetGroup || !targetGroup.status || !orderToMove.id) {
                this.notificationService.showError("Operación de arrastre inválida.", "Error");
                return;
            }

            // Validar transición con el backend (usando el ID del estado de destino)
            const currentStatusId = orderToMove.status?._id; // Viene como objeto IOrderStatus
            const newStatusId = targetGroup.status._id;

            if (!currentStatusId) {
                this.notificationService.showError("El pedido no tiene un estado actual definido.", "Error de Datos");
                return;
            }            this.adminOrderStatusService.validateTransition({ fromStatusId: currentStatusId, toStatusId: newStatusId })
                .pipe(takeUntil(this.destroy$))
                .subscribe((validationResponse: any) => {
                    if (validationResponse.isValid) {
                        const payload: UpdateOrderStatusPayload = { statusId: newStatusId };
                        this.isUpdatingStatus = true;
                        this.adminOrderService.updateOrderStatus(orderToMove.id, payload)
                            .pipe(finalize(() => this.isUpdatingStatus = false))
                            .subscribe({
                                next: (updatedOrder) => {
                                    transferArrayItem(
                                        event.previousContainer.data,
                                        event.container.data,
                                        event.previousIndex,
                                        event.currentIndex
                                    );
                                    const movedOrderInNewList = event.container.data.find(o => o.id === updatedOrder.id);
                                    if (movedOrderInNewList) {
                                        movedOrderInNewList.status = updatedOrder.status; // El backend devuelve el objeto status poblado
                                    }
                                    this.notificationService.showSuccess(`Pedido #${orderToMove.id.substring(0, 8)} movido a "${targetGroup.status.name}".`, 'Estado Actualizado');
                                },
                                error: (err: HttpErrorResponse) => {
                                    const errorMsg = err.error?.error || 'No se pudo actualizar el estado del pedido.';
                                    this.notificationService.showError(errorMsg, 'Error de Transición');
                                }
                            });
                    } else {
                        this.notificationService.showWarning(validationResponse.message || `Transición a "${targetGroup.status.name}" no permitida.`, "Transición Inválida");
                    }
                });
        }
    }

    openStatusChangeModal(order: IOrder): void {
        this.selectedOrder = order;
        this.newStatusId = '';
        this.statusChangeNotes = '';
        if (this.statusChangeModal) {
            this.statusChangeModal.show();
        }
    }

    getTransitionableStatuses(currentOrderStatus: IOrderStatus | string): IOrderStatus[] {
        let currentStatusId: string | undefined;

        if (typeof currentOrderStatus === 'string') {
            const foundStatus = this.allOrderStatuses.find(s =>
                s.name.toLowerCase() === currentOrderStatus.toLowerCase() || s.code.toLowerCase() === currentOrderStatus.toLowerCase()
            );
            currentStatusId = foundStatus?._id;
        } else if (currentOrderStatus && currentOrderStatus._id) {
            currentStatusId = currentOrderStatus._id;
        }

        if (!currentStatusId) {
            return [];
        }

        const currentStatusEntity = this.allOrderStatuses.find(s => s._id === currentStatusId);

        if (!currentStatusEntity || !currentStatusEntity.allowedTransitions || currentStatusEntity.allowedTransitions.length === 0) {
            return [];
        }

        const allowedTransitionIds = currentStatusEntity.allowedTransitions;

        return this.allOrderStatuses.filter(s =>
            allowedTransitionIds.includes(s._id) && s.isActive
        );
    }

    updateOrderStatus(): void {
        if (!this.selectedOrder || !this.selectedOrder.id || !this.newStatusId || this.isUpdatingStatus) {
            return;
        }

        const payload: UpdateOrderStatusPayload = {
            statusId: this.newStatusId,
            notes: this.statusChangeNotes || undefined
        };

        this.isUpdatingStatus = true;
        this.adminOrderService.updateOrderStatus(this.selectedOrder.id, payload)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isUpdatingStatus = false)
            )
            .subscribe({
                next: () => {
                    const newStatusName = this.allOrderStatuses.find(s => s._id === this.newStatusId)?.name || 'desconocido';
                    this.notificationService.showSuccess(`Estado del pedido #${this.selectedOrder!.id.substring(0, 8)} actualizado a ${newStatusName}.`, 'Éxito');
                    if (this.statusChangeModal) {
                        this.statusChangeModal.hide();
                    }
                    this.loadDashboardData();
                },
                error: (err: HttpErrorResponse) => {
                    const errorMsg = err.error?.error || 'No se pudo actualizar el estado.';
                    this.notificationService.showError(errorMsg, 'Error');
                }
            });
    }

    trackByStatusId(index: number, item: IGroupedOrdersForDashboard): string {
        return item.status._id;
    }

    trackByOrderId(index: number, item: IOrder): string {
        return item.id;
    }

    formatDate(dateString: string | Date | undefined): string {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    getTotalOrders(): number {
        return this.dashboardData.reduce((sum, group) => sum + group.orders.length, 0);
    }

    getOrderCountByStatus(statusName: string): number {
        const group = this.dashboardData.find(g => g.status.name.toUpperCase() === statusName.toUpperCase());
        return group ? group.totalOrdersInStatus : 0; // Usar totalOrdersInStatus si existe
    }

    hasOrderStatuses(): boolean {
        return this.dashboardData && this.dashboardData.length > 0;
    }

    isLimitedMode(): boolean {
        return this.hasOrderStatuses() && this.getTotalOrders() === 0 && !!this.errorMessage && !this.isLoading;
    }

    getOrdersByStatus(statusName: string): IOrder[] {
        const group = this.dashboardData.find(g => g.status.name === statusName);
        return group ? group.orders : [];
    }
}