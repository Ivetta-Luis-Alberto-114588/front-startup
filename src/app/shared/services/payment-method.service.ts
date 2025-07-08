// src/app/shared/services/payment-method.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPaymentMethod, IPaymentMethodPublic } from '../models/ipayment-method';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {

  private apiUrl = `${environment.apiUrl}/api/payment-methods`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los métodos de pago activos para el checkout
   * GET /api/payment-methods/active
   */
  getActivePaymentMethods(): Observable<IPaymentMethod[]> {
    return this.http.get<IPaymentMethodPublic[]>(`${this.apiUrl}/active`).pipe(
      map(publicMethods => this.convertPublicToPrivateFormat(publicMethods)),
      catchError(error => {
        console.error('❌ Error al obtener métodos de pago activos:', error);
        // Fallback: intentar endpoint de admin con filtro
        return this.http.get<{ data: IPaymentMethod[] }>(`${this.apiUrl}?isActive=true&limit=100`).pipe(
          map(response => response.data || response as any)
        );
      })
    );
  }

  /**
   * Convierte métodos de pago del formato público al formato interno
   */
  private convertPublicToPrivateFormat(publicMethods: IPaymentMethodPublic[]): IPaymentMethod[] {
    return publicMethods.map(publicMethod => ({
      _id: publicMethod.id, // Convertir 'id' a '_id'
      name: publicMethod.name,
      code: publicMethod.code,
      description: publicMethod.description,
      isActive: publicMethod.isActive,
      requiresOnlinePayment: publicMethod.requiresOnlinePayment,
      defaultOrderStatusId: typeof publicMethod.defaultOrderStatusId === 'object' 
        ? publicMethod.defaultOrderStatusId._id 
        : publicMethod.defaultOrderStatusId || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * Filtra métodos de pago según el método de entrega
   * @param allMethods Todos los métodos de pago disponibles
   * @param deliveryMethodCode Código del método de entrega
   */
  filterPaymentMethodsByDelivery(allMethods: IPaymentMethod[], deliveryMethodCode?: string): IPaymentMethod[] {
    if (!deliveryMethodCode) {
      return allMethods;
    }

    // Para retiro en local, permitir efectivo y otros métodos
    if (deliveryMethodCode === 'PICKUP' || deliveryMethodCode === 'pickup' || deliveryMethodCode === 'local-pickup') {
      return allMethods; // Todos los métodos disponibles para pickup
    }

    // Para delivery, solo métodos que requieren pago online
    return allMethods.filter(method => method.requiresOnlinePayment);
  }
}
