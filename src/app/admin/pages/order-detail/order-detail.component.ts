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
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { OrderStatusService } from 'src/app/shared/services/order-status.service';

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
  private allStatuses: IOrderStatus[] = [];

  constructor(
    private route: ActivatedRoute,
    private adminOrderService: AdminOrderService,
    private notificationService: NotificationService,
    private location: Location,
    private router: Router,
    private orderStatusService: OrderStatusService
  ) { }

  ngOnInit(): void {
    this.loadAllOrderStatuses();
    this.routeSub = this.route.paramMap.subscribe(params => {
      const orderId = params.get('id');
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

  loadAllOrderStatuses(): void {
    this.orderStatusService.getOrderStatuses().subscribe(response => {
      if (response && response.orderStatuses) {
        this.allStatuses = response.orderStatuses;
      } else if (Array.isArray(response)) {
        this.allStatuses = response;
      }
    });
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
          if (err.status === 404 || err.status === 403) {
            this.router.navigate(['/admin/orders']);
          }
        }
      });
  }

  // El parámetro `targetStatusCodeOrName` puede ser el 'code' (PENDING) o 'name' ("Pendiente") del estado.
  // Internamente buscaremos su _id.
  updateStatus(targetStatusCodeOrName: string): void {
    if (!this.order || this.isUpdatingStatus || !this.order.id) {
      return;
    }

    const targetStatusObject = this.allStatuses.find(s =>
      s.code.toLowerCase() === targetStatusCodeOrName.toLowerCase() ||
      s.name.toLowerCase() === targetStatusCodeOrName.toLowerCase()
    );

    if (!targetStatusObject) {
      this.notificationService.showError(`Estado '${targetStatusCodeOrName}' no reconocido.`, 'Error');
      return;
    }

    // this.order.status es ahora un objeto IOrderStatus
    if (this.order.status && this.order.status._id === targetStatusObject._id) {
      this.notificationService.showInfo('El pedido ya se encuentra en este estado.', 'Información');
      return;
    }

    this.isUpdatingStatus = true;
    const payload: UpdateOrderStatusPayload = {
      statusId: targetStatusObject._id // Enviar el _id del estado
    };

    this.updateSub = this.adminOrderService.updateOrderStatus(this.order.id, payload)
      .pipe(finalize(() => this.isUpdatingStatus = false))
      .subscribe({
        next: (updatedOrder) => {
          this.order = updatedOrder;
          this.notificationService.showSuccess(`Estado del pedido actualizado a ${targetStatusObject.name}.`, 'Éxito');
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error updating status for order ${this.order?.id}:`, err);
          const errorMsg = err.error?.error || 'No se pudo actualizar el estado del pedido.';
          this.notificationService.showError(errorMsg, 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  getFormattedStatus(statusObj: IOrderStatus | string): string {
    let statusName = '';
    if (typeof statusObj === 'string') {
      // Intentar encontrar el objeto IOrderStatus si solo tenemos el string (ej. 'pending')
      const foundStatus = this.allStatuses.find(s => s.code.toLowerCase() === statusObj.toLowerCase() || s.name.toLowerCase() === statusObj.toLowerCase());
      statusName = foundStatus ? foundStatus.name : statusObj;
    } else if (statusObj && statusObj.name) {
      statusName = statusObj.name;
    } else {
      return 'Desconocido';
    }

    // Capitalizar la primera letra, el resto como venga (asumiendo que ya está bien en `status.name`)
    return statusName.charAt(0).toUpperCase() + statusName.slice(1);
  }
}