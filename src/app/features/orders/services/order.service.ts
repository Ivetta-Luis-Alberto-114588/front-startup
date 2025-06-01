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
   */
  getMyOrders(): Observable<IOrder[]> {
    console.log('DEBUG - OrderService.getMyOrders called');
    console.log('DEBUG - Making request to:', `${this.apiUrl}/my-orders`);
    
    // Llama al endpoint específico del backend para "mis pedidos"
    return this.http.get<any>(`${this.apiUrl}/my-orders`).pipe(
      map((response: any) => {
        console.log('DEBUG - getMyOrders response:', response);
        
        // Check if response has orders property (paginated response)
        if (response && response.orders && Array.isArray(response.orders)) {
          console.log('DEBUG - Found orders array in response:', response.orders.length, 'orders');
          return response.orders;
        }
        
        // If response is direct array
        if (Array.isArray(response)) {
          console.log('DEBUG - Response is direct array:', response.length, 'orders');
          return response;
        }
        
        console.warn('DEBUG - Unexpected response format:', response);
        return [];
      }),
      catchError(err => {
        console.error('DEBUG - Error in getMyOrders:', err);
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
   */
  getOrderById(orderId: string): Observable<IOrder> {
    // Sanitize the orderId to make sure it's clean
    const cleanOrderId = orderId.trim();
    const url = `${this.apiUrl}/${cleanOrderId}`;
    
    console.log('DEBUG - OrderService.getOrderById called');
    console.log('DEBUG - apiUrl:', this.apiUrl);
    console.log('DEBUG - original orderId:', orderId);
    console.log('DEBUG - cleaned orderId:', cleanOrderId);
    console.log('DEBUG - typeof orderId:', typeof orderId);
    console.log('DEBUG - orderId length:', orderId.length);
    console.log('DEBUG - final URL:', url);
    
    // Log HTTP request details
    console.log('DEBUG - Making HTTP GET request to:', url);
    
    // Llama al endpoint GET /api/sales/:id
    return this.http.get<IOrder>(url).pipe(
      catchError(err => {
        console.error('DEBUG - Error en getOrderById:', err);
        console.error('DEBUG - Error status:', err.status);
        console.error('DEBUG - Error message:', err.message);
        console.error('DEBUG - Error URL:', err.url);
        if (err.error) {
          console.error('DEBUG - Server error details:', err.error);
        }
        if (err.headers) {
          console.error('DEBUG - Response headers:', err.headers);
        }
        return throwError(() => err);
      })
    );
  }
  // --- FIN NUEVO MÉTODO ---
}