// src/app/features/orders/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IOrder } from '../models/iorder';
import { ICreateOrderPayload } from '../models/ICreateOrderPayload';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/sales`; // Endpoint base

  constructor(private http: HttpClient) { }

  createOrder(payload: ICreateOrderPayload): Observable<IOrder> {
    return this.http.post<IOrder>(this.apiUrl, payload);
  }

  // --- NUEVO MÉTODO ---
  /**
   * Obtiene el historial de pedidos para el usuario autenticado.
   * Requiere que el interceptor añada el token JWT.
   * @returns Un Observable con el array de pedidos del usuario.
   */  getMyOrders(): Observable<IOrder[]> {
    // Llama al endpoint específico del backend para "mis pedidos"
    return this.http.get<any>(`${this.apiUrl}/my-orders`).pipe(
      map((response: any) => {
        // Check if response has orders property (paginated response)
        if (response && response.orders && Array.isArray(response.orders)) {
          return response.orders;
        }
        
        // If response is direct array
        if (Array.isArray(response)) {
          return response;
        }
        
        return [];
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }
  // --- FIN NUEVO MÉTODO ---

  // --- NUEVO MÉTODO ---
  /**
   * Obtiene los detalles de un pedido específico por su ID.
   * Requiere que el interceptor añada el token JWT.
   * @param orderId El ID del pedido a obtener.
   * @returns Un Observable con los detalles del pedido.
   */  getOrderById(orderId: string): Observable<IOrder> {
    // Sanitize the orderId to make sure it's clean
    const cleanOrderId = orderId.trim();
    const url = `${this.apiUrl}/${cleanOrderId}`;
    
    // Llama al endpoint GET /api/sales/:id
    return this.http.get<IOrder>(url).pipe(
      catchError(err => {
        return throwError(() => err);
      })
    );
  }
  // --- FIN NUEVO MÉTODO ---
}