// src/app/admin/pages/order-list/order-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { IOrder } from 'src/app/features/orders/models/iorder';
import { AdminOrderService, PaginatedAdminOrdersResponse, UpdateOrderStatusPayload } from '../../services/admin-order.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { OrderStatusService } from 'src/app/shared/services/order-status.service';
import { PaymentVerificationService } from 'src/app/features/payments/services/payment-verification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy {

  orders: IOrder[] = [];
  isLoading = false;
  error: string | null = null;
  private orderSub: Subscription | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  isUpdatingStatus: { [orderId: string]: boolean } = {};
  isVerifyingPayment: { [orderId: string]: boolean } = {};
  allOrderStatuses: IOrderStatus[] = [];

  constructor(
    private adminOrderService: AdminOrderService,
    private notificationService: NotificationService,
    private router: Router,
    private orderStatusService: OrderStatusService,
    private paymentVerificationService: PaymentVerificationService
  ) { }

  ngOnInit(): void {
    // Cargar primero los estados para asegurar que estén disponibles
    this.loadAllOrderStatuses().then(() => {
      // Luego cargar las órdenes
      this.loadOrders();
    });
  }

  ngOnDestroy(): void {
    this.orderSub?.unsubscribe();
  }

  loadAllOrderStatuses(): Promise<void> {
    return new Promise((resolve) => {
      this.orderStatusService.getOrderStatuses().subscribe(response => {
        if (response && response.orderStatuses) {
          this.allOrderStatuses = response.orderStatuses.filter(status => status.isActive);
        } else if (Array.isArray(response)) {
          this.allOrderStatuses = response.filter(status => status.isActive);
        }
        resolve();
      });
    });
  }
  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.orderSub = this.adminOrderService.getOrders(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: PaginatedAdminOrdersResponse) => {
          this.orders = response.orders;
          this.totalItems = response.total;
        },
        error: (err) => {
          console.error("Error loading orders:", err);
          this.error = err.error?.error || 'No se pudieron cargar los pedidos.';
          this.notificationService.showError(this.error ?? "Unknown error", 'Error');
          this.orders = [];
          this.totalItems = 0;
        }
      });
  }

  goToOrderDetail(orderId: string): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  onStatusChange(order: IOrder, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newStatusId = selectElement.value; // Esto es el _id del IOrderStatus

    if (!newStatusId || !order.id) return;

    const originalStatusId = order.status?._id; // Guardar el ID del estado original

    if (this.isUpdatingStatus[order.id]) return;

    this.isUpdatingStatus[order.id] = true;
    const payload: UpdateOrderStatusPayload = { statusId: newStatusId };

    this.adminOrderService.updateOrderStatus(order.id, payload)
      .pipe(finalize(() => this.isUpdatingStatus[order.id] = false))
      .subscribe({
        next: (updatedOrder) => {
          this.notificationService.showSuccess(`Estado del pedido #${order.id.slice(0, 8)} actualizado.`, 'Éxito');
          const index = this.orders.findIndex(o => o.id === updatedOrder.id);
          if (index > -1) {
            this.orders[index] = updatedOrder;
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error updating status for order ${order.id}:`, err);
          const errorMsg = err.error?.error || 'No se pudo actualizar el estado del pedido.';
          this.notificationService.showError(errorMsg, 'Error');

          const index = this.orders.findIndex(o => o.id === order.id);
          if (index > -1) {
            const originalStatusObject = this.allOrderStatuses.find(s => s._id === originalStatusId);
            if (originalStatusObject) {
              this.orders[index].status = originalStatusObject;
            } else if (originalStatusId) { // Si no encontramos el objeto completo, al menos revertimos al ID
              this.orders[index].status = { _id: originalStatusId, name: 'Error al revertir', code: 'ERROR', color: '#000', priority: 0, isFinal: false, isActive: false, isDefault: false, allowedTransitions: [] };
            }
          }
        }
      });
  }

  /**
   * Maneja el cambio de estado usando directamente el ID del status (para ngModelChange)
   */
  onStatusChangeById(order: IOrder, newStatusId: string): void {
    if (!newStatusId || !order.id) return;

    const originalStatusId = order.status?._id; // Guardar el ID del estado original

    if (this.isUpdatingStatus[order.id]) return;

    this.isUpdatingStatus[order.id] = true;
    const payload: UpdateOrderStatusPayload = { statusId: newStatusId };

    this.adminOrderService.updateOrderStatus(order.id, payload)
      .pipe(finalize(() => this.isUpdatingStatus[order.id] = false))
      .subscribe({
        next: (updatedOrder) => {
          this.notificationService.showSuccess(`Estado del pedido #${order.id.slice(0, 8)} actualizado.`, 'Éxito');
          const index = this.orders.findIndex(o => o.id === updatedOrder.id);
          if (index > -1) {
            this.orders[index] = updatedOrder;
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error updating status for order ${order.id}:`, err);
          const errorMsg = err.error?.error || 'No se pudo actualizar el estado del pedido.';
          this.notificationService.showError(errorMsg, 'Error');

          const index = this.orders.findIndex(o => o.id === order.id);
          if (index > -1) {
            const originalStatusObject = this.allOrderStatuses.find(s => s._id === originalStatusId);
            if (originalStatusObject) {
              this.orders[index].status = originalStatusObject;
            } else if (originalStatusId) { // Si no encontramos el objeto completo, al menos revertimos al ID
              this.orders[index].status = { _id: originalStatusId, name: 'Error al revertir', code: 'ERROR', color: '#000', priority: 0, isFinal: false, isActive: false, isDefault: false, allowedTransitions: [] };
            }
          }
        }
      });
  }

  // --- Paginación ---
  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) return;
    this.currentPage = page;
    this.loadOrders();
  }

  getFormattedStatus(statusObj: IOrderStatus | string): string {
    let statusName = '';
    if (typeof statusObj === 'string') {
      const foundStatus = this.allOrderStatuses.find(s => s.code.toLowerCase() === statusObj.toLowerCase() || s.name.toLowerCase() === statusObj.toLowerCase() || s._id === statusObj);
      statusName = foundStatus ? foundStatus.name : statusObj;
    } else if (statusObj && statusObj.name) {
      statusName = statusObj.name;
    } else {
      return 'Desconocido';
    }
    return statusName.charAt(0).toUpperCase() + statusName.slice(1);
  }

  getStatusBadgeClass(statusObj: IOrderStatus | string): string {
    let statusNameForClass = '';
    if (typeof statusObj === 'string') {
      const foundStatus = this.allOrderStatuses.find(s => s.code.toLowerCase() === statusObj.toLowerCase() || s.name.toLowerCase() === statusObj.toLowerCase() || s._id === statusObj);
      statusNameForClass = foundStatus ? foundStatus.name : statusObj;
    } else if (statusObj && statusObj.name) {
      statusNameForClass = statusObj.name;
    } else {
      return 'bg-light text-dark';
    }

    switch (statusNameForClass.toLowerCase()) {
      case 'pendiente': return 'bg-warning text-dark';
      case 'completado': return 'bg-success text-white';
      case 'cancelado': return 'bg-danger text-white';
      case 'enviado': return 'bg-info text-dark';
      // Agrega más casos según los nombres de tus estados
      default: return 'bg-secondary text-white'; // Un color por defecto
    }
  } getOrderStatusId(order: IOrder): string {
    if (order.status && order.status._id) {
      return order.status._id;
    }
    return '';
  }

  /**
   * Verifica si el estado de la orden está en la lista de estados disponibles
   */
  isStatusInList(order: IOrder): boolean {
    const statusId = this.getOrderStatusId(order);
    return this.allOrderStatuses.some(status => status._id === statusId);
  }

  /**
   * TrackBy function para mejorar performance en ngFor
   */
  trackByStatusId(index: number, status: IOrderStatus): string {
    return status._id;
  }

  /**
   * TrackBy function para las órdenes
   */
  trackByOrderId(index: number, order: IOrder): string {
    return order.id;
  }

  /**
   * Verificación manual de pago con MercadoPago
   * Muestra notificaciones específicas según si el estado cambió o no
   */
  verifyPaymentManually(order: IOrder): void {
    if (!order.id || this.isVerifyingPayment[order.id]) return;

    // Capturar el estado actual antes de la verificación
    const currentStatusId = order.status?._id;
    const currentStatusName = order.status?.name || 'Desconocido';

    this.isVerifyingPayment[order.id] = true;

    this.paymentVerificationService.manualVerifyAndUpdate(order.id)
      .pipe(finalize(() => this.isVerifyingPayment[order.id] = false))
      .subscribe({
        next: (result) => {
          // Recargar las órdenes para obtener el estado actualizado
          this.reloadOrderAndNotify(order.id, currentStatusId, currentStatusName);
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error verifying payment for order ${order.id}:`, err);
          const errorMsg = err.error?.error || 'No se pudo verificar el estado del pago.';
          this.notificationService.showError(
            `❌ Error al verificar el pago del pedido #${order.id.slice(0, 8)}: ${errorMsg}`,
            'Error de Verificación'
          );
        }
      });
  }

  /**
   * Recarga una orden específica y muestra notificación según cambio de estado
   */
  private reloadOrderAndNotify(orderId: string, previousStatusId: string | undefined, previousStatusName: string): void {
    // Recargar todas las órdenes para asegurar consistencia
    const currentPagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.adminOrderService.getOrders(currentPagination).subscribe({
      next: (response: PaginatedAdminOrdersResponse) => {
        this.orders = response.orders;
        this.totalItems = response.total;

        // Buscar la orden actualizada
        const updatedOrder = this.orders.find(o => o.id === orderId);

        if (updatedOrder) {
          const newStatusId = updatedOrder.status?._id;
          const newStatusName = updatedOrder.status?.name || 'Desconocido';

          // Comparar estados y mostrar notificación apropiada
          if (previousStatusId !== newStatusId) {
            // Estado cambió
            this.notificationService.showSuccess(
              `✅ Estado actualizado del pedido #${orderId.slice(0, 8)}: ${previousStatusName} → ${newStatusName}`,
              'Verificación Exitosa'
            );
          } else {
            // Estado no cambió
            this.notificationService.showInfo(
              `ℹ️ Verificación completada para pedido #${orderId.slice(0, 8)}. El estado se mantiene: ${newStatusName}`,
              'Sin Cambios'
            );
          }
        } else {
          // Orden no encontrada después de la actualización
          this.notificationService.showSuccess(
            `✅ Verificación completada para pedido #${orderId.slice(0, 8)}`,
            'Verificación Exitosa'
          );
        }
      },
      error: (err) => {
        console.error("Error reloading orders after verification:", err);
        this.notificationService.showWarning(
          `⚠️ Verificación completada, pero no se pudo actualizar la vista. Recarga la página para ver cambios.`,
          'Advertencia'
        );
      }
    });
  }
}