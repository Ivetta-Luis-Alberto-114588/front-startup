// src/app/features/orders/pages/my-orders-page/my-orders-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IOrder } from '../../models/iorder';
import { OrderService } from '../../services/order.service';
import { PaginatedOrdersResponse } from '../../models/IPaginatedOrdersResponse';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-orders-page',
  templateUrl: './my-orders-page.component.html',
  styleUrls: ['./my-orders-page.component.scss']
})
export class MyOrdersPageComponent implements OnInit, OnDestroy {

  orders: IOrder[] = [];
  isLoading = false;
  error: string | null = null;
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;
  private orderSub: Subscription | null = null;

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
    private location: Location,
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
    this.orders = [];

    this.orderSub = this.orderService.getMyOrders().subscribe({
      next: (response: PaginatedOrdersResponse | any) => {
        if (response && Array.isArray(response.orders)) {
          this.orders = response.orders;
          this.totalItems = response.total ?? response.orders.length;
          console.log('Pedidos cargados:', this.orders);
          console.log('Total de pedidos:', this.totalItems);

          // Debug temporal para ver la estructura del status
          if (this.orders.length > 0) {
            console.log('DEBUG - Primer pedido completo:', this.orders[0]);
            console.log('DEBUG - Status del primer pedido:', this.orders[0].status);
            console.log('DEBUG - Tipo del status:', typeof this.orders[0].status);
            if (this.orders[0].status && typeof this.orders[0].status === 'object') {
              console.log('DEBUG - Propiedades del objeto status:', Object.keys(this.orders[0].status));
            }
          }
        } else {
          console.error("Respuesta inválida de la API getMyOrders:", response);
          this.orders = response || [];
          this.totalItems = this.orders.length;
        }

        this.isLoading = false;
        if (this.orders.length === 0 && !this.error) {
          this.error = "No tienes pedidos realizados aún.";
        }
      },
      error: (err) => {
        console.error("Error cargando mis pedidos:", err);
        this.error = 'No se pudo cargar tu historial de pedidos. Intenta de nuevo más tarde.';
        if (err.error && err.error.error) {
          console.error("Detalle del error:", err.error.error);
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'No estás autorizado para ver esta información.';
        }
        this.isLoading = false;
        this.orders = [];
        this.totalItems = 0;
      }
    });
  }

  // Helper para formatear estado
  getFormattedStatus(status: any): string {
    // Manejar diferentes tipos de status
    let statusString = '';

    if (typeof status === 'string') {
      statusString = status;
    } else if (status && typeof status === 'object') {
      // Si status es un objeto (como los OrderStatus), buscar propiedades comunes
      statusString = status.name || status.code || status.status || '';
    } else if (status) {
      statusString = String(status);
    }

    // Normalizar a lowercase para comparación
    const normalizedStatus = statusString.toLowerCase();

    switch (normalizedStatus) {
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'completed':
      case 'completado':
      case 'finished':
      case 'finalizado':
        return 'Completado';
      case 'cancelled':
      case 'canceled':
      case 'cancelado':
        return 'Cancelado';
      case 'shipped':
      case 'enviado':
      case 'shipping':
        return 'Enviado';
      case 'processing':
      case 'procesando':
        return 'Procesando';
      case 'confirmed':
      case 'confirmado':
        return 'Confirmado';
      default:
        if (statusString && typeof statusString === 'string' && statusString.length > 0) {
          return statusString.charAt(0).toUpperCase() + statusString.slice(1);
        }
        return 'Estado Desconocido';
    }
  }

  // Helper para clases de badge de estado
  getStatusBadgeClass(status: any): string {
    // Obtener el string del status
    let statusString = '';

    if (typeof status === 'string') {
      statusString = status;
    } else if (status && typeof status === 'object') {
      statusString = status.name || status.code || status.status || '';
    } else if (status) {
      statusString = String(status);
    }

    const normalizedStatus = statusString.toLowerCase();

    switch (normalizedStatus) {
      case 'pending':
      case 'pendiente':
        return 'bg-warning text-dark';
      case 'completed':
      case 'completado':
      case 'finished':
      case 'finalizado':
        return 'bg-success';
      case 'cancelled':
      case 'canceled':
      case 'cancelado':
        return 'bg-danger';
      case 'shipped':
      case 'enviado':
      case 'shipping':
        return 'bg-info';
      case 'processing':
      case 'procesando':
        return 'bg-primary';
      case 'confirmed':
      case 'confirmado':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  }  // Método para ver detalles
  viewOrderDetails(orderId: string): void {
    console.log('DEBUG - viewOrderDetails called with orderId:', orderId);
    console.log('DEBUG - typeof orderId:', typeof orderId);
    console.log('DEBUG - orderId length:', orderId?.length);
    
    // Test the API call before navigation
    console.log('DEBUG - Testing getOrderById before navigation...');
    this.orderService.getOrderById(orderId).subscribe({
      next: (orderDetail) => {
        console.log('DEBUG - getOrderById SUCCESS:', orderDetail);
        // Navigate only if API call succeeds
        this.router.navigate(['/my-orders', orderId]);
      },
      error: (err) => {
        console.error('DEBUG - getOrderById FAILED:', err);
        console.error('DEBUG - Error status:', err.status);
        console.error('DEBUG - Error details:', err.error);
        
        // Show user-friendly error message
        let errorMessage = 'No se pudo cargar el detalle del pedido.';
        if (err.status === 400) {
          errorMessage = 'ID de pedido inválido.';
        } else if (err.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (err.status === 403) {
          errorMessage = 'No tienes permiso para ver este pedido.';
        } else if (err.status === 404) {
          errorMessage = 'Pedido no encontrado.';
        }
        
        this.notificationService.showError(errorMessage, 'Error al Cargar Detalle');
      }
    });
  }

  // Método para volver
  goBack(): void {
    this.location.back();
  }
}