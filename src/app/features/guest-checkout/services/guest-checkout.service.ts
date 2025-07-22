import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IGuestOrderRequest, IGuestOrderResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GuestCheckoutService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Crear orden para invitado
   * SIN header Authorization - el backend detecta automáticamente que es guest
   */
  createGuestOrder(orderData: IGuestOrderRequest): Observable<IGuestOrderResponse> {
    return this.http.post<IGuestOrderResponse>(`${this.apiUrl}/api/orders`, orderData, {
      headers: {
        'Content-Type': 'application/json'
        // ❌ NO incluir Authorization para invitados
      }
    });
  }

  /**
   * Generar email único para invitado
   * Formato: guest_timestamp_random1_random2_random3_suffix@checkout.guest
   */
  generateGuestEmail(): string {
    const timestamp = Date.now();
    const random1 = Math.floor(Math.random() * 100000000);
    const random2 = Math.floor(Math.random() * 100000000);
    const random3 = Math.floor(Math.random() * 100000000);
    const suffix = Math.random().toString(36).substring(2, 15);
    return `guest_${timestamp}_${random1}_${random2}_${random3}_${suffix}@checkout.guest`;
  }

  /**
   * Validar si un email es de tipo guest
   */
  isGuestEmail(email: string): boolean {
    return email.endsWith('@checkout.guest') || email.startsWith('guest_');
  }

  /**
   * Convertir carrito local a items de guest order
   */
  convertLocalCartToGuestItems(cartItems: any[]): any[] {
    return cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.productPrice
    }));
  }
}
