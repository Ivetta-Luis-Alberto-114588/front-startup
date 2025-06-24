// src/app/admin/services/admin-order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IOrder } from 'src/app/features/orders/models/iorder'; // Reutilizar interfaz
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { IOrderStatus } from 'src/app/shared/models/iorder-status'; // NUEVO

// Interfaz para la respuesta paginada de la lista de pedidos de admin
export interface PaginatedAdminOrdersResponse {
  total: number;
  orders: IOrder[]; // Asumiendo que el backend devuelve IOrder poblado
}

// Interfaz para el payload de actualización de estado
export interface UpdateOrderStatusPayload {
  statusId: string; // Debería ser el ID del OrderStatus
  notes?: string;
}

// NUEVA INTERFAZ PARA EL DASHBOARD
export interface IGroupedOrdersForDashboard {
  status: IOrderStatus;
  orders: IOrder[];
  totalOrdersInStatus: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {

  private adminApiUrl = `${environment.apiUrl.trim()}/api/admin/orders`;

  constructor(private http: HttpClient) { }

  // GET /api/admin/orders
  getOrders(pagination: PaginationDto): Observable<PaginatedAdminOrdersResponse> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
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
  }  // NUEVO MÉTODO para el dashboard - construye los datos desde endpoints existentes
  getOrdersForDashboardView(): Observable<IGroupedOrdersForDashboard[]> {
    // Obtener pedidos y estados en paralelo
    const pagination: PaginationDto = { page: 1, limit: 1000 }; // Ajustar según necesidades

    // Llamadas paralelas a pedidos y estados
    const orders$ = this.getOrders(pagination);
    const statuses$ = this.http.get<any>(`${environment.apiUrl}/api/order-statuses`);

    return forkJoin([orders$, statuses$]).pipe(
      map(([ordersResponse, statusesResponse]: [PaginatedAdminOrdersResponse, any]) => {
        // console.log('=== DEBUG DASHBOARD DATA ===');
        // console.log('Orders Response:', ordersResponse);
        console.log('Number of orders:', ordersResponse.orders?.length || 0);
        // console.log('Statuses Response:', statusesResponse);
        // console.log('Number of statuses:', statusesResponse?.orderStatuses?.length || (Array.isArray(statusesResponse) ? statusesResponse.length : 0));

        // Extraer estados activos
        let allStatuses: IOrderStatus[] = [];
        if (statusesResponse && statusesResponse.orderStatuses) {
          allStatuses = statusesResponse.orderStatuses.filter((s: any) => s.isActive);
        } else if (Array.isArray(statusesResponse)) {
          allStatuses = statusesResponse.filter((s: any) => s.isActive);
        }

        // Mapear campos del backend al frontend para estados
        allStatuses = allStatuses.map((status: any) => ({
          _id: status.id || status._id,
          name: status.name,
          code: status.code,
          description: status.description,
          color: status.color,
          priority: status.order, // Mapear 'order' del backend a 'priority'
          isActive: status.isActive,
          isDefault: status.isDefault,
          isFinal: status.canTransitionTo ? status.canTransitionTo.length === 0 : true,
          allowedTransitions: status.canTransitionTo || [],
          createdAt: status.createdAt ? new Date(status.createdAt) : undefined,
          updatedAt: status.updatedAt ? new Date(status.updatedAt) : undefined
        }));

        // Crear Map para agrupar órdenes por estado
        const groupedOrders = new Map<string, IGroupedOrdersForDashboard>();

        // Inicializar columnas para todos los estados (incluso sin órdenes)
        allStatuses.forEach(status => {
          groupedOrders.set(status._id, {
            status: status,
            orders: [],
            totalOrdersInStatus: 0
          });
        });

        // Agrupar órdenes existentes en sus estados correspondientes
        ordersResponse.orders.forEach(order => {
          // Obtener ID de estado (algunos objetos vienen con `id` en lugar de `_id`)
          const statusId = order.status?._id || (order.status as any).id || '';
          if (groupedOrders.has(statusId)) {
            const group = groupedOrders.get(statusId)!;
            // Normalizar order.status al objeto completo
            const fullStatus = allStatuses.find(s => s._id === statusId);
            if (fullStatus) {
              order.status = fullStatus;
            }
            group.orders.push(order);
            group.totalOrdersInStatus = group.orders.length;
          }
        });

        // Convertir Map a Array y ordenar por prioridad del estado
        return Array.from(groupedOrders.values()).sort((a, b) => {
          const priorityA = a.status?.priority || 999;
          const priorityB = b.status?.priority || 999;
          return priorityA - priorityB;
        });
      })
    );
  }
}