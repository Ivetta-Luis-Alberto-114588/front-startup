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

    console.log('📤 Sending payload to backend:', JSON.stringify(validatedPayload, null, 2));
    console.log('📤 Payload keys:', Object.keys(validatedPayload));
    console.log('📤 Payload size:', JSON.stringify(validatedPayload).length, 'characters');

    return this.http.post<IOrder>(this.apiUrl, validatedPayload).pipe(
      catchError(err => {
        console.error('❌ COMPLETE Backend error details:', err);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error statusText:', err.statusText);
        console.error('❌ Error headers:', err.headers);

        // Intentar extraer el mensaje de error más específico
        if (err.error) {
          console.error('❌ Error body:', err.error);

          if (typeof err.error === 'string') {
            console.error('❌ Error message (string):', err.error);
          } else if (err.error.message) {
            console.error('❌ Error message (object):', err.error.message);
          } else if (err.error.errors) {
            console.error('❌ Validation errors:', err.error.errors);
          } else if (err.error.details) {
            console.error('❌ Error details:', err.error.details);
          }
        }

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
    console.log('🔧 Starting payload validation...');

    // Clonar el payload para no mutar el original
    const adaptedPayload: ICreateOrderPayload = { ...payload };

    // Validaciones básicas
    if (!payload.items || payload.items.length === 0) {
      throw new Error('El carrito no puede estar vacío');
    }

    if (!payload.deliveryMethod) {
      throw new Error('Debe seleccionar un método de entrega');
    }

    if (!payload.paymentMethodId) {
      throw new Error('Debe seleccionar un método de pago');
    }

    // Validar que cada item tenga los campos requeridos
    payload.items.forEach((item, index) => {
      if (!item.productId) {
        throw new Error(`Item ${index + 1}: productId es requerido`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: quantity debe ser mayor a 0`);
      }
      if (item.unitPrice === undefined || item.unitPrice === null || item.unitPrice < 0) {
        throw new Error(`Item ${index + 1}: unitPrice debe ser un número válido`);
      }
    });

    console.log('✅ Basic validations passed');

    // Agregar notas descriptivas solo si no existen ya
    if (!adaptedPayload.notes) {
      const deliveryMethodName = this.isPickupMethod(payload) ?
        'Retiro en Local' : 'Envío a Domicilio';
      adaptedPayload.notes = `Pedido realizado desde el checkout - Método: ${deliveryMethodName}`;
    }

    // Determinar si es método de retiro
    const isPickup = this.isPickupMethod(payload);
    console.log('🚚 Is pickup method?', isPickup);

    if (isPickup) {
      // Para métodos pickup, limpiar campos de envío excepto selectedAddressId
      console.log('🏪 Pickup method detected - cleaning shipping fields (backend validates conditionally)');

      // TEMPORAL: El backend aún requiere selectedAddressId incluso para pickup
      // Usar un ID dummy hasta que el backend implemente las validaciones condicionales completas
      if (!adaptedPayload.selectedAddressId) {
        adaptedPayload.selectedAddressId = '000000000000000000000000'; // ID dummy para pickup
        console.log('⚠️ TEMPORAL: Added dummy selectedAddressId for pickup method');
      }

      // Remover otros campos de envío ya que con selectedAddressId dummy el backend no los requerirá
      delete adaptedPayload.shippingRecipientName;
      delete adaptedPayload.shippingPhone;
      delete adaptedPayload.shippingStreetAddress;
      delete adaptedPayload.shippingAdditionalInfo;
      delete adaptedPayload.shippingNeighborhoodId;

      console.log('✅ Shipping fields cleaned for pickup method (keeping selectedAddressId)');
    } else {
      // Para métodos que SÍ requieren dirección, validar que tenemos los datos necesarios
      console.log('📍 Validating shipping data for delivery method');
      this.validateShippingData(adaptedPayload);
    }

    // Log final del payload adaptado
    console.log('🔧 Final adapted payload:', adaptedPayload);
    console.log('🔧 Adapted payload keys:', Object.keys(adaptedPayload));

    return adaptedPayload;
  }

  /**
   * Determina si el método de entrega es de tipo "retiro" (no requiere dirección).
   * Primero intenta usar el código, luego hace fallback al ID.
   */
  private isPickupMethod(payload: ICreateOrderPayload): boolean {
    // Si tenemos el código del método, usarlo (más confiable)
    if (payload.deliveryMethodCode) {
      console.log('🚚 Checking pickup method using CODE:', payload.deliveryMethodCode);
      const lowerCaseCode = payload.deliveryMethodCode.toLowerCase();
      const isPickup = lowerCaseCode.includes('pickup') ||
        lowerCaseCode.includes('retiro') ||
        lowerCaseCode.includes('local');

      console.log('Is pickup method (by code)?', isPickup);
      return isPickup;
    }

    // Fallback: usar el ID (menos confiable)
    console.log('🚚 Checking pickup method using ID (fallback):', payload.deliveryMethod);
    const lowerCaseId = payload.deliveryMethod.toLowerCase();
    const isPickup = lowerCaseId.includes('pickup') ||
      lowerCaseId.includes('retiro') ||
      lowerCaseId.includes('local');

    console.log('Is pickup method (by ID)?', isPickup);
    return isPickup;
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