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

  /**
   * Crea una nueva orden adaptando el payload según el método de entrega seleccionado.
   * Valida que los datos requeridos estén presentes según el tipo de entrega.
   */
  createOrder(payload: ICreateOrderPayload): Observable<IOrder> {
    // Validar el payload antes de enviarlo
    const validatedPayload = this.validateAndAdaptPayload(payload);

    return this.http.post<IOrder>(this.apiUrl, validatedPayload).pipe(
      catchError(err => {
        console.error('Error creating order:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Valida y adapta el payload según el método de entrega seleccionado.
   * @param payload - Payload original del checkout
   * @returns Payload validado y adaptado
   */
  private validateAndAdaptPayload(payload: ICreateOrderPayload): ICreateOrderPayload {
    // Clonar el payload para no mutar el original
    const adaptedPayload: ICreateOrderPayload = { ...payload };

    // Validaciones básicas
    if (!payload.items || payload.items.length === 0) {
      throw new Error('El carrito no puede estar vacío');
    }

    if (!payload.deliveryMethod) {
      throw new Error('Debe seleccionar un método de entrega');
    }

    // Agregar notas descriptivas solo si no existen ya
    if (!adaptedPayload.notes) {
      const deliveryMethodName = this.isPickupMethod(payload.deliveryMethod) ? 
        'Retiro en Local' : 'Envío a Domicilio';
      adaptedPayload.notes = `Pedido realizado desde el checkout - Método: ${deliveryMethodName}`;
    }

    // Para métodos que NO requieren dirección (ej: retiro en local),
    // limpiar todos los campos de shipping para evitar confusión en el backend
    if (this.isPickupMethod(payload.deliveryMethod)) {
      // Limpiar todos los campos de shipping
      delete adaptedPayload.selectedAddressId;
      delete adaptedPayload.shippingRecipientName;
      delete adaptedPayload.shippingPhone;
      delete adaptedPayload.shippingStreetAddress;
      delete adaptedPayload.shippingPostalCode;
      delete adaptedPayload.shippingNeighborhoodId;
      delete adaptedPayload.shippingCityId;
      delete adaptedPayload.shippingAdditionalInfo;
    } else {
      // Para métodos que SÍ requieren dirección, validar que tenemos los datos necesarios
      this.validateShippingData(adaptedPayload);
    }

    return adaptedPayload;
  }

  /**
   * Determina si el método de entrega es de tipo "retiro" (no requiere dirección).
   * Nota: En una implementación real, esto podría consultarse desde el backend
   * o basarse en propiedades del método de entrega.
   */
  private isPickupMethod(deliveryMethodId: string): boolean {
    // Por ahora, asumimos que si el ID contiene "pickup" o "retiro", es retiro en local
    // En una implementación real, esto debería basarse en la propiedad `requiresAddress`
    const lowerCaseId = deliveryMethodId.toLowerCase();
    return lowerCaseId.includes('pickup') ||
      lowerCaseId.includes('retiro') ||
      lowerCaseId.includes('local');
  }

  /**
   * Valida que los datos de envío estén completos para métodos que requieren dirección.
   */
  private validateShippingData(payload: ICreateOrderPayload): void {
    // Si se seleccionó una dirección existente, no necesitamos validar los otros campos
    if (payload.selectedAddressId) {
      return;
    }

    // Si no hay dirección seleccionada, validar que tenemos los datos completos
    const requiredFields = [
      { field: 'shippingRecipientName', message: 'Nombre del destinatario es requerido' },
      { field: 'shippingPhone', message: 'Teléfono de contacto es requerido' },
      { field: 'shippingStreetAddress', message: 'Dirección es requerida' },
      { field: 'shippingNeighborhoodId', message: 'Barrio es requerido' }
    ];

    for (const { field, message } of requiredFields) {
      if (!payload[field as keyof ICreateOrderPayload]) {
        throw new Error(message);
      }
    }
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