// src/app/features/orders/pages/my-orders-page/my-orders-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IOrder } from '../../models/iorder';
import { OrderService } from '../../services/order.service'; // <-- Importa la interfaz si la tienes en el servicio
import { PaginatedOrdersResponse } from '../../models/IPaginatedOrdersResponse'; // <-- Importa la interfaz de respuesta paginada
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
  totalItems = 0; // Añadir para paginación futura
  currentPage = 1; // Añadir para paginación futura
  itemsPerPage = 10; // Añadir para paginación futura
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
    this.orders = []; // Limpiar antes de cargar
    // Podrías pasar la paginación aquí si el servicio la soporta
    // const pagination = { page: this.currentPage, limit: this.itemsPerPage };

    // --- AJUSTE AQUÍ ---
    // Especifica el tipo de respuesta esperado si lo tienes definido en el servicio
    this.orderSub = this.orderService.getMyOrders(/* pagination */).subscribe({
      // Espera un objeto con 'total' y 'orders'
      next: (response: PaginatedOrdersResponse | any) => { // Usa 'any' si no tienes la interfaz
        // Verificar si la respuesta tiene la estructura esperada
        if (response && Array.isArray(response.orders)) {
          this.orders = response.orders; // <-- Asigna el array de pedidos
          this.totalItems = response.total ?? response.orders.length; // <-- Asigna el total
          console.log('Pedidos cargados:', this.orders); // Ahora debería mostrar solo el array
          console.log('Total de pedidos:', this.totalItems);
        } else {
          // Si la respuesta no tiene la estructura esperada
          console.error("Respuesta inválida de la API getMyOrders:", response);
          this.orders = [];
          this.totalItems = 0;
          this.error = 'Respuesta inesperada del servidor al cargar mis pedidos.';
          this.notificationService.showError(this.error, 'Error');
        }
        this.isLoading = false;
        if (this.orders.length === 0 && !this.error) { // Mostrar mensaje solo si no hay error
          // this.notificationService.showInfo("No tienes pedidos anteriores.", "Historial Vacío");
        }
      },
      error: (err) => {
        this.error = 'No se pudo cargar tu historial de pedidos. Intenta de nuevo más tarde.';
        if (err.error && err.error.error) {
          this.error = err.error.error;
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'No estás autorizado para ver esta información.';
        }
        this.notificationService.showError(this.error ?? 'Error desconocido', 'Error al Cargar Pedidos');
        this.isLoading = false;
        this.orders = []; // Asegurar array vacío en error
        this.totalItems = 0;
      }
    });
    // --- FIN AJUSTE ---
  }

  // --- Helper para formatear estado ---
  getFormattedStatus(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'shipped': return 'Enviado';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Desconocido';
    }
  }

  // --- Método para ver detalles ---
  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/my-orders', orderId]);
  }

  // --- Método goBack ---
  goBack(): void {
    this.location.back();
  }

  // --- Método para paginación (si la implementas) ---
  // loadPage(page: number): void {
  //   if (page === this.currentPage || this.isLoading) return;
  //   this.currentPage = page;
  //   this.loadOrders();
  // }
}