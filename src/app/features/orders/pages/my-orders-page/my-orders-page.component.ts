// src/app/features/orders/pages/my-orders-page/my-orders-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IOrder } from '../../models/iorder';
import { OrderService } from '../../services/order.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Location } from '@angular/common'; // <<<--- IMPORTAR Location
import { Router } from '@angular/router'; // <<<--- IMPORTAR Router (si usas viewOrderDetails)

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
    private notificationService: NotificationService,
    private location: Location, // <<<--- INYECTAR Location
    private router: Router      // <<<--- INYECTAR Router (si usas viewOrderDetails)
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.orderSub?.unsubscribe();
  }

  loadOrders(): void {
    // ... (lógica existente) ...
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
        this.error = 'No se pudo cargar tu historial de pedidos. Intenta de nuevo más tarde.';
        // Usar el mensaje de error del backend si está disponible
        if (err.error && err.error.error) {
          this.error = err.error.error;
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'No estás autorizado para ver esta información.';
        }
        this.notificationService.showError(this.error ?? 'Error desconocido', 'Error al Cargar Pedidos');
        this.isLoading = false;
      }
    });
  }

  // --- Helper para formatear estado (opcional) ---
  getFormattedStatus(status: 'pending' | 'completed' | 'cancelled'): string {
    // ... (lógica existente) ...
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  // --- Método para ver detalles (futuro) ---
  viewOrderDetails(orderId: string): void {
    // ... (lógica existente) ...
    this.router.navigate(['/my-orders', orderId]);
  }

  // --- NUEVO MÉTODO goBack ---
  goBack(): void {
    this.location.back(); // Navega a la página anterior en el historial del navegador
  }
  // --- FIN NUEVO MÉTODO ---
}