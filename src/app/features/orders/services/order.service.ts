// src/app/features/orders/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    // Llama al endpoint específico del backend para "mis pedidos"
    return this.http.get<IOrder[]>(`${this.apiUrl}/my-orders`);
    // Nota: Asume que tu backend devuelve directamente un array de IOrder.
    // Si devuelve un objeto con paginación { total: number, orders: IOrder[] },
    // necesitarías ajustar la interfaz de retorno y usar map() para extraer el array.
  }
  // --- FIN NUEVO MÉTODO ---

  // Podrías añadir getOrderById(id: string): Observable<IOrder> aquí en el futuro
}