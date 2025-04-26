// src/app/admin/pages/order-list/order-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { IOrder } from 'src/app/features/orders/models/iorder';
import { AdminOrderService, PaginatedAdminOrdersResponse, UpdateOrderStatusPayload } from '../../services/admin-order.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy {

  orders: IOrder[] = []; // Inicializado como array vacío
  isLoading = false;
  error: string | null = null;
  private orderSub: Subscription | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  isUpdatingStatus: { [orderId: string]: boolean } = {};

  constructor(
    private adminOrderService: AdminOrderService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.orderSub?.unsubscribe();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    // Asegurarse de que orders sea un array vacío antes de la llamada
    // this.orders = []; // Ya se inicializa en la declaración, pero puedes asegurarlo aquí si prefieres
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.orderSub = this.adminOrderService.getOrders(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: PaginatedAdminOrdersResponse) => {
          // --- VERIFICACIÓN Y ASIGNACIÓN SEGURA ---
          if (response && Array.isArray(response.orders)) {
            this.orders = response.orders;
            this.totalItems = response.total ?? response.orders.length; // Usar total si existe, sino length
          } else {
            // Si la respuesta no es válida, asignar array vacío y mostrar error
            console.error("Respuesta inválida de la API de pedidos:", response);
            this.orders = [];
            this.totalItems = 0;
            this.error = 'Respuesta inesperada del servidor al cargar pedidos.';
            this.notificationService.showError(this.error, 'Error');
          }
          // --- FIN VERIFICACIÓN ---
        },
        error: (err) => {
          console.error("Error loading orders:", err); // Mantener log de error
          this.error = err.error?.error || 'No se pudieron cargar los pedidos.';
          this.notificationService.showError(this.error ?? "Unknown error", 'Error');
          this.orders = []; // Asegurar que orders sea un array vacío en caso de error
          this.totalItems = 0;
        }
      });
  }

  // --- Navegación ---
  goToOrderDetail(orderId: string): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  // --- Actualización de Estado ---
  onStatusChange(order: IOrder, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value as 'pending' | 'completed' | 'cancelled';

    const originalStatus = order.status;
    // No actualices visualmente aquí hasta confirmar con el backend
    // order.status = newStatus;

    this.updateStatusDirectly(order, newStatus, originalStatus);
  }

  updateStatusDirectly(order: IOrder, newStatus: 'pending' | 'completed' | 'cancelled', originalStatus?: string): void {
    if (this.isUpdatingStatus[order.id]) return;

    this.isUpdatingStatus[order.id] = true;
    const payload: UpdateOrderStatusPayload = { status: newStatus };

    this.adminOrderService.updateOrderStatus(order.id, payload)
      .pipe(finalize(() => this.isUpdatingStatus[order.id] = false))
      .subscribe({
        next: (updatedOrder) => {
          this.notificationService.showSuccess(`Estado del pedido #${order.id.slice(0, 8)} actualizado a ${this.getFormattedStatus(newStatus)}.`, 'Éxito');
          const index = this.orders.findIndex(o => o.id === updatedOrder.id);
          if (index > -1) {
            // Actualizar el objeto completo para reflejar cualquier otro cambio del backend
            this.orders[index] = updatedOrder;
          }
        },
        error: (err) => {
          console.error(`Error updating status for order ${order.id}:`, err);
          const errorMsg = err.error?.error || 'No se pudo actualizar el estado del pedido.';
          this.notificationService.showError(errorMsg, 'Error');
          // Revertir el cambio visual si falló (si modificaste order.status antes)
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index > -1 && originalStatus) {
            // Revertir buscando el estado original en la lista actual (más seguro)
            const orderInList = this.orders[index];
            if (orderInList) {
              orderInList.status = originalStatus as any;
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

  // --- Helper para formatear estado ---
  getFormattedStatus(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'shipped': return 'Enviado';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Desconocido'; // Manejar null/undefined
    }
  }
}