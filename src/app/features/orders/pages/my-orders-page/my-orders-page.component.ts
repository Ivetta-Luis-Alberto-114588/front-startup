// src/app/features/orders/pages/my-orders-page/my-orders-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IOrder } from '../../models/iorder'; // Asegúrate que la ruta sea correcta
import { OrderService } from '../../services/order.service'; // Asegúrate que la ruta sea correcta
import { NotificationService } from 'src/app/shared/services/notification.service'; // Para feedback

@Component({
  selector: 'app-my-orders-page',
  templateUrl: './my-orders-page.component.html',
  styleUrls: ['./my-orders-page.component.scss']
})
export class MyOrdersPageComponent implements OnInit, OnDestroy {

  orders: IOrder[] = [];
  isLoading = false;
  error: string | null = null;
  private orderSub: Subscription | null = null;

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService
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
    this.orders = []; // Limpiar antes de cargar

    this.orderSub = this.orderService.getMyOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoading = false;
        if (this.orders.length === 0) {
          // Opcional: Mostrar un mensaje si no hay pedidos
          // this.notificationService.showInfo("No tienes pedidos anteriores.", "Historial Vacío");
        }
      },
      error: (err) => {
        console.error("Error fetching my orders:", err);
        this.error = 'No se pudo cargar tu historial de pedidos. Intenta de nuevo más tarde.';
        // Usar el mensaje de error del backend si está disponible
        if (err.error && err.error.error) {
          this.error = err.error.error;
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'No estás autorizado para ver esta información.';
        }
        this.notificationService.showError(this.error || 'Error desconocido', 'Error al Cargar Pedidos');
        this.isLoading = false;
      }
    });
  }

  // --- Helper para formatear estado (opcional) ---
  getFormattedStatus(status: 'pending' | 'completed' | 'cancelled'): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  // --- Método para ver detalles (futuro) ---
  viewOrderDetails(orderId: string): void {
    // Navegar a una ruta de detalle de pedido, ej: /my-orders/orderId
    console.log("Navegar a detalles del pedido:", orderId);
    // this.router.navigate(['/my-orders', orderId]); // Necesitarás inyectar Router
  }
}