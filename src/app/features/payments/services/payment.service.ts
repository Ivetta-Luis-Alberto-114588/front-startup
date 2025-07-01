import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ICreatePaymentResponse } from '../../orders/models/ICreatePaymentResponse';
import { IPaymentStatusResponse } from '../models/IPaymentStatusResponse';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api/payments`;

  constructor(private http: HttpClient) { }

  createPaymentPreference(saleId: string): Observable<ICreatePaymentResponse> {
    // El backend espera el ID de la venta en la URL
    return this.http.post<ICreatePaymentResponse>(`${this.apiUrl}/sale/${saleId}`, {});
  }

  /**
   * Obtiene el estado completo de un pago por ID de venta (saleId)
   * Incluye verificación OAuth y datos de MercadoPago
   */
  getPaymentStatusBySale(saleId: string): Observable<IPaymentStatusResponse> {
    return this.http.get<IPaymentStatusResponse>(`${this.apiUrl}/status/sale/${saleId}`);
  }
}