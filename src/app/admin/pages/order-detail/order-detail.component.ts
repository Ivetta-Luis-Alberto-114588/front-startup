// src/app/admin/pages/order-detail/order-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { IOrder } from 'src/app/features/orders/models/iorder';
import { AdminOrderService, UpdateOrderStatusPayload } from '../../services/admin-order.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit, OnDestroy {

  order: IOrder | null = null;
  isLoading = false;
  isUpdatingStatus = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;
  private updateSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private adminOrderService: AdminOrderService,
    private notificationService: NotificationService,
    private location: Location,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const orderId = params.get('id'); // El nombre del parámetro en la ruta es 'id'
      if (orderId) {
        this.loadOrderDetails(orderId);
      } else {
        this.error = 'ID de pedido no encontrado en la URL.';
        this.notificationService.showError(this.error, 'Error');
        this.goBack();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.updateSub?.unsubscribe();
  }

  loadOrderDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.adminOrderService.getOrderById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.order = data;
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error loading order ${id}:`, err);
          this.error = err.error?.error || `No se pudo cargar el pedido (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? "Unknown error", 'Error');
          if (err.status === 404 || err.status === 403) { // Redirigir si no encontrado o no autorizado
            this.router.navigate(['/admin/orders']);
          }
        }
      });
  }

  updateStatus(newStatus: 'pending' | 'completed' | 'cancelled' | 'shipped'): void {
    if (!this.order || this.isUpdatingStatus || this.order.status === newStatus) {
      return;
    }

    this.isUpdatingStatus = true;
    const payload: UpdateOrderStatusPayload = { status: newStatus };

    this.updateSub = this.adminOrderService.updateOrderStatus(this.order.id, payload)
      .pipe(finalize(() => this.isUpdatingStatus = false))
      .subscribe({
        next: (updatedOrder) => {
          this.order = updatedOrder; // Actualizar el pedido local con la respuesta
          this.notificationService.showSuccess(`Estado del pedido actualizado a ${this.getFormattedStatus(newStatus)}.`, 'Éxito');
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error updating status for order ${this.order?.id}:`, err);
          const errorMsg = err.error?.error || 'No se pudo actualizar el estado del pedido.';
          this.notificationService.showError(errorMsg, 'Error');
          // No revertimos el estado visual aquí, ya que la actualización falló
        }
      });
  }


  goBack(): void {
    this.router.navigate(['/admin/orders']); // Volver siempre a la lista de admin
  }

  getFormattedStatus(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'shipped': return 'Enviado';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
}