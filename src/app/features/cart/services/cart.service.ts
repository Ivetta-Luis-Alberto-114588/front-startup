// src/app/features/cart/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { ICart, AddCartItemRequest, UpdateCartItemRequest } from '../models/icart'; // Importar interfaces
import { NotificationService } from 'src/app/shared/services/notification.service'; // Para feedback
import { AuthService } from 'src/app/auth/services/auth.service'; // Para obtener token (implícito vía interceptor)

@Injectable({
  providedIn: 'root' // Proveer en el root para que sea un singleton
})
export class CartService {

  private cartApiUrl = `${environment.apiUrl}/api/cart`; // URL base para la API del carrito

  // BehaviorSubject para mantener el estado reactivo del carrito
  // Inicializa con null, indicando que el carrito aún no se ha cargado
  private cartSubject = new BehaviorSubject<ICart | null>(null);

  // Observable público para que los componentes se suscriban a los cambios del carrito
  public cart$: Observable<ICart | null> = this.cartSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService // Aunque no lo usemos directamente, asegura que el interceptor funcione si está logueado
  ) {
    // Opcional: Cargar el carrito inicial si el usuario está autenticado al iniciar el servicio
    // this.loadInitialCartIfAuthenticated();
  }

  /**
   * Obtiene el carrito actual del usuario desde el backend.
   * Actualiza el estado interno (cartSubject).
   * NOTA: Requiere que el usuario esté autenticado (el interceptor añade el token).
   */
  getCart(): Observable<ICart | null> {
    return this.http.get<ICart>(this.cartApiUrl).pipe(
      tap(cart => {
        console.log('Carrito obtenido:', cart);
        this._updateCartState(cart); // Actualiza el BehaviorSubject
      }),
      catchError(err => this.handleError(err, 'obtener el carrito'))
    );
  }

  /**
   * Añade un producto con una cantidad específica al carrito.
   * Llama al endpoint POST /api/cart/items.
   * Actualiza el estado interno con la respuesta del backend.
   * NOTA: Requiere autenticación.
   * @param productId ID del producto a añadir.
   * @param quantity Cantidad a añadir.
   */
  addItem(productId: string, quantity: number): Observable<ICart> {
    const payload: AddCartItemRequest = { productId, quantity };
    return this.http.post<ICart>(`${this.cartApiUrl}/items`, payload).pipe(
      tap(updatedCart => {
        this._updateCartState(updatedCart);
        this.notificationService.showSuccess(`${quantity} x ${updatedCart.items.find(i => i.product.id === productId)?.product.name || 'Producto'} añadido(s) al carrito.`, 'Carrito Actualizado');
      }),
      catchError(err => this.handleError(err, 'añadir item al carrito'))
    );
  }

  /**
   * Actualiza la cantidad de un producto específico en el carrito.
   * Si la cantidad es 0 o menor, el backend debería eliminar el item.
   * Llama al endpoint PUT /api/cart/items/:productId.
   * Actualiza el estado interno con la respuesta del backend.
   * NOTA: Requiere autenticación.
   * @param productId ID del producto a actualizar.
   * @param quantity Nueva cantidad total para el producto.
   */
  updateItemQuantity(productId: string, quantity: number): Observable<ICart> {
    const payload: UpdateCartItemRequest = { quantity };
    return this.http.put<ICart>(`${this.cartApiUrl}/items/${productId}`, payload).pipe(
      tap(updatedCart => {
        this._updateCartState(updatedCart);
        const updatedItem = updatedCart.items.find(i => i.product.id === productId);
        if (updatedItem) {
          this.notificationService.showInfo(`Cantidad de ${updatedItem.product.name} actualizada a ${quantity}.`, 'Carrito Actualizado');
        } else {
          this.notificationService.showInfo(`Producto eliminado del carrito.`, 'Carrito Actualizado');
        }
      }),
      catchError(err => this.handleError(err, 'actualizar cantidad del item'))
    );
  }

  /**
   * Elimina un producto específico del carrito.
   * Llama al endpoint DELETE /api/cart/items/:productId.
   * Actualiza el estado interno con la respuesta del backend.
   * NOTA: Requiere autenticación.
   * @param productId ID del producto a eliminar.
   */
  removeItem(productId: string): Observable<ICart> {
    return this.http.delete<ICart>(`${this.cartApiUrl}/items/${productId}`).pipe(
      tap(updatedCart => {
        this._updateCartState(updatedCart);
        // Es difícil saber el nombre aquí si ya no está en updatedCart, mostramos mensaje genérico
        this.notificationService.showSuccess(`Producto eliminado del carrito.`, 'Carrito Actualizado');
      }),
      catchError(err => this.handleError(err, 'eliminar item del carrito'))
    );
  }

  /**
   * Elimina todos los ítems del carrito del usuario.
   * Llama al endpoint DELETE /api/cart.
   * Actualiza el estado interno con la respuesta del backend (carrito vacío).
   * NOTA: Requiere autenticación.
   */
  clearCart(): Observable<ICart> {
    return this.http.delete<ICart>(this.cartApiUrl).pipe(
      tap(emptiedCart => {
        this._updateCartState(emptiedCart);
        this.notificationService.showSuccess('El carrito ha sido vaciado.', 'Carrito Actualizado');
      }),
      catchError(err => this.handleError(err, 'vaciar el carrito'))
    );
  }

  /**
   * Método privado para actualizar el estado del BehaviorSubject.
   * @param cart El nuevo estado del carrito (o null).
   */
  private _updateCartState(cart: ICart | null): void {
    this.cartSubject.next(cart);
    console.log('Estado del carrito actualizado:', this.cartSubject.value);
  }

  /**
   * Método privado para manejar errores de las llamadas HTTP.
   * @param error El error recibido.
   * @param operation Descripción de la operación que falló.
   */
  private handleError(error: HttpErrorResponse, operation: string = 'operación'): Observable<never> {
    let userMessage = `Ocurrió un error al ${operation}. Por favor, intente de nuevo.`;

    // Intentar obtener un mensaje más específico del backend
    if (error.error && typeof error.error.error === 'string') {
      userMessage = error.error.error; // Usar el mensaje de error del backend si existe
    } else if (error.status === 0) {
      userMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
    } else if (error.status === 401) {
      userMessage = 'No autorizado. Por favor, inicie sesión.';
      // Opcional: Podrías llamar a authService.logout() aquí si es un 401
    } else if (error.status === 404 && operation === 'obtener el carrito') {
      // Si es un 404 al obtener el carrito, no es realmente un error grave,
      // simplemente no existe aún. Emitimos null y no mostramos notificación de error.
      console.log('Carrito no encontrado en el backend (404), emitiendo null.');
      this._updateCartState(null);
      return throwError(() => new Error('Carrito no encontrado')); // Devolvemos un error simple que getCart puede manejar
    }

    console.error(`Error en ${operation}:`, error);
    this.notificationService.showError(userMessage, 'Error en Carrito');

    // Propagar el error para que el componente que llamó también pueda reaccionar si es necesario
    return throwError(() => new Error(userMessage)); // Devolver un observable de error
  }

  /**
   * Opcional: Carga el carrito si el usuario está autenticado al inicio.
   */

  private loadInitialCartIfAuthenticated(): void {
    if (this.authService.isAuthenticated()) {
      this.getCart().subscribe({
        error: (err) => {
          // El error ya se maneja en handleError, pero podríamos loguear aquí si falla la carga inicial
          console.warn('No se pudo cargar el carrito inicial:', err.message);
        }
      });
    } else {
      this._updateCartState(null); // Asegurar que el estado es null si no está autenticado
    }
  }


  /**
   * Obtiene el valor actual del carrito (sincrónico).
   * Útil para comprobaciones rápidas, pero prefiere usar el observable `cart$`.
   */
  public getCurrentCartValue(): ICart | null {
    return this.cartSubject.value;
  }

}