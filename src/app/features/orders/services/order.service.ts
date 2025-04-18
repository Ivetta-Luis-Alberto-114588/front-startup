import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IOrder } from '../models/iorder'; // <-- Define estas interfaces
import { ICreateOrderPayload } from '../models/ICreateOrderPayload'; // <-- Define esta interfaz

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/sales`; // Endpoint de ventas/pedidos

  constructor(private http: HttpClient) { }

  createOrder(payload: ICreateOrderPayload): Observable<IOrder> {
    return this.http.post<IOrder>(this.apiUrl, payload);
  }

  // Añade getMyOrders, getOrderById aquí cuando los necesites
}