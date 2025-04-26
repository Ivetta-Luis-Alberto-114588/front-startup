// src/app/admin/services/admin-order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IOrder } from 'src/app/features/orders/models/iorder'; // Reutilizar interfaz
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

// Interfaz para la respuesta paginada de la lista de pedidos de admin
export interface PaginatedAdminOrdersResponse {
  total: number;
  orders: IOrder[]; // Asumiendo que el backend devuelve IOrder poblado
}

// Interfaz para el payload de actualización de estado
export interface UpdateOrderStatusPayload {
  status: 'pending' | 'completed' | 'cancelled' | 'shipped'; // Añade más estados si los tienes
  notes?: string; // Opcional
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {

  private adminApiUrl = `${environment.apiUrl.trim()}/api/admin/orders`;

  constructor(private http: HttpClient) { }

  // GET /api/admin/orders
  getOrders(pagination: PaginationDto): Observable<PaginatedAdminOrdersResponse> {
    // Asumiendo que el backend devuelve { total: number, orders: IOrder[] }
    // Nota: El backend llama a la propiedad 'orders', no 'products' como en el servicio de productos
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    // Aquí podrías añadir parámetros para filtros si los implementas (ej: status, date)
    return this.http.get<PaginatedAdminOrdersResponse>(this.adminApiUrl, { params });
  }

  // GET /api/admin/orders/:id
  getOrderById(id: string): Observable<IOrder> {
    return this.http.get<IOrder>(`${this.adminApiUrl}/${id}`);
  }

  // PATCH /api/admin/orders/:id/status
  updateOrderStatus(id: string, payload: UpdateOrderStatusPayload): Observable<IOrder> {
    return this.http.patch<IOrder>(`${this.adminApiUrl}/${id}/status`, payload);
  }

  // --- Métodos Opcionales para Filtros (Ejemplos) ---

  // GET /api/admin/orders/by-customer/:customerId
  getOrdersByCustomer(customerId: string, pagination: PaginationDto): Observable<PaginatedAdminOrdersResponse> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<PaginatedAdminOrdersResponse>(`${this.adminApiUrl}/by-customer/${customerId}`, { params });
  }

  // POST /api/admin/orders/by-date-range
  getOrdersByDateRange(startDate: string, endDate: string, pagination: PaginationDto): Observable<PaginatedAdminOrdersResponse> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    const body = { startDate, endDate };
    return this.http.post<PaginatedAdminOrdersResponse>(`${this.adminApiUrl}/by-date-range`, body, { params });
  }
}