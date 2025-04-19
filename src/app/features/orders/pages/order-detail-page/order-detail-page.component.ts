// src/app/features/orders/pages/order-detail-page/order-detail-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Importar Router también
import { Subscription, switchMap } from 'rxjs';
import { IOrder } from '../../models/iorder';
import { OrderService } from '../../services/order.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Location } from '@angular/common'; // Para botón "Volver"

@Component({
  selector: 'app-order-detail-page',
  templateUrl: './order-detail-page.component.html',
  styleUrls: ['./order-detail-page.component.scss']
})
export class OrderDetailPageComponent implements OnInit, OnDestroy {

  order: IOrder | null = null;
  isLoading = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private notificationService: NotificationService,
    private location: Location, // Inyectar Location
    private router: Router // Inyectar Router
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        const orderId = params.get('orderId');
        if (!orderId) {
          this.error = 'No se proporcionó ID de pedido.';
          this.notificationService.showError(this.error, 'Error');
          this.isLoading = false;
          this.goBack(); // Volver si no hay ID
          throw new Error(this.error); // Lanzar error para detener el switchMap
        }
        return this.orderService.getOrderById(orderId);
      })
    ).subscribe({
      next: (data) => {
        this.order = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error fetching order details:", err);
        this.error = 'No se pudo cargar el detalle del pedido.';
        if (err.error && err.error.error) {
          this.error = err.error.error;
        } else if (err.status === 404) {
          this.error = 'Pedido no encontrado.';
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'No tienes permiso para ver este pedido.';
        }
        this.notificationService.showError(this.error ?? 'Error desconocido', 'Error al Cargar Detalle');
        this.isLoading = false;
        // Considera redirigir si hay error grave (ej: 404 o 403)
        // this.router.navigate(['/my-orders']);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  // Método para volver a la lista de pedidos
  goBack(): void {
    // this.location.back(); // Opción 1: Volver a la página anterior exacta
    this.router.navigate(['/my-orders']); // Opción 2: Siempre ir a la lista
  }

  // Helper para formatear estado (igual que en la lista)
  getFormattedStatus(status: 'pending' | 'completed' | 'cancelled'): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }
}