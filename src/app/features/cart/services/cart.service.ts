// src/app/features/cart/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, from } from 'rxjs';
import { catchError, tap, map, mergeMap, toArray, switchMap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { ICart, AddCartItemRequest, UpdateCartItemRequest } from '../models/icart'; // Importar interfaces
import { NotificationService } from 'src/app/shared/services/notification.service'; // Para feedback
import { AuthService } from 'src/app/auth/services/auth.service'; // Para obtener token (implícito vía interceptor)
import { IGuestCart, IGuestCartItem } from 'src/app/features/guest-checkout/models';

@Injectable({
  providedIn: 'root' // Proveer en el root para que sea un singleton
})
export class CartService {

  private cartApiUrl = `${environment.apiUrl}/api/cart`; // URL base para la API del carrito
  private guestCartStorageKey = 'guest-cart'; // Key para localStorage del carrito invitado

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
    // Cargar carrito inicial basado en estado de autenticación
    this.initializeCart();
  }

  /**
   * Inicializa el carrito basado en si el usuario está autenticado o no
   */
  private initializeCart(): void {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // Usuario autenticado: verificar si hay carrito de invitado para transferir
        const guestCart = this.getCurrentCartValue();
        if (guestCart && guestCart.items.length > 0 && guestCart.id === 'guest-cart') {
          // Hay carrito de invitado con items, transferir
          this.transferGuestCartToAuthenticatedUser().subscribe({
            error: (err) => console.log('Error transferring guest cart:', err)
          });
        } else {
          // No hay carrito de invitado o ya es de usuario autenticado, cargar desde API
          this.getCart().subscribe({
            error: (err) => console.log('Error loading authenticated cart:', err)
          });
        }
      } else {
        // Usuario invitado: cargar desde localStorage
        this.loadGuestCartFromStorage();
      }
    });
  }

  /**
   * Determina si el usuario actual es invitado
   */
  private isGuestUser(): boolean {
    return !this.authService.isAuthenticated();
  }

  /**
   * Cargar carrito de invitado desde localStorage
   */
  private loadGuestCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem(this.guestCartStorageKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Validar que el carrito guardado tenga la estructura correcta
        if (this.validateCartStructure(parsedCart)) {
          this._updateCartState(parsedCart);
        } else {
          // Si la estructura no es válida, crear carrito vacío
          this._updateCartState(this.createEmptyCart());
        }
      } else {
        // No hay carrito guardado, crear uno vacío
        this._updateCartState(this.createEmptyCart());
      }
    } catch (error) {
      console.warn('Error loading guest cart from localStorage:', error);
      this._updateCartState(this.createEmptyCart());
    }
  }

  /**
   * Guardar carrito de invitado en localStorage
   */
  private saveGuestCartToStorage(cart: ICart): void {
    try {
      localStorage.setItem(this.guestCartStorageKey, JSON.stringify(cart));
    } catch (error) {
      console.warn('Error saving guest cart to localStorage:', error);
    }
  }

  /**
   * Validar que el carrito tenga la estructura correcta
   */
  private validateCartStructure(cart: any): boolean {
    return cart &&
      typeof cart.id === 'string' &&
      Array.isArray(cart.items) &&
      typeof cart.total === 'number' &&
      typeof cart.totalItems === 'number';
  }

  /**
   * Convertir guest cart a formato ICart
   * TODO: Implementar conversión completa en futuras iteraciones
   */
  private convertGuestCartToICart(guestCart: IGuestCart): ICart {
    return this.createEmptyCart();
  }

  /**
   * Convertir ICart a guest cart
   * TODO: Implementar conversión completa en futuras iteraciones
   */
  private convertICartToGuestCart(cart: ICart): IGuestCart {
    return {
      items: [],
      total: 0,
      totalItems: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Crear carrito vacío para invitados
   */
  private createEmptyCart(): ICart {
    return {
      id: 'guest-cart',
      userId: 'guest-user',
      user: {
        id: 'guest',
        name: 'Invitado',
        email: 'guest@local.com',
        roles: []
      },
      items: [],
      total: 0,
      totalItems: 0,
      totalTaxAmount: 0,
      subtotalWithoutTax: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Obtiene el carrito actual del usuario desde el backend.
   * Para usuarios autenticados: Cargar desde API backend.
   * Para usuarios invitados: Cargar desde localStorage.
   * Actualiza el estado interno (cartSubject).
   */
  getCart(): Observable<ICart | null> {
    if (this.isGuestUser()) {
      // Usuario invitado: cargar desde localStorage
      const currentCart = this.getCurrentCartValue();
      if (currentCart) {
        return of(currentCart);
      } else {
        this.loadGuestCartFromStorage();
        return of(this.getCurrentCartValue());
      }
    }

    // Usuario autenticado: llamar a la API
    return this.http.get<ICart>(this.cartApiUrl).pipe(
      tap(cart => {
        this._updateCartState(cart); // Actualiza el BehaviorSubject
      }),
      catchError(err => this.handleError(err, 'obtener el carrito'))
    );
  }

  /**
   * Añade un producto con una cantidad específica al carrito.
   * Para usuarios autenticados: Llama al endpoint POST /api/cart/items.
   * Para usuarios invitados: Maneja el carrito localmente en localStorage.
   * Actualiza el estado interno con la respuesta del backend o del localStorage.
   * @param productId ID del producto a añadir.
   * @param quantity Cantidad a añadir.
   */
  addItem(productId: string, quantity: number): Observable<ICart> {
    if (this.isGuestUser()) {
      return this.addItemToGuestCart(productId, quantity);
    }

    // Usuario autenticado: usar API
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
   * Agregar producto al carrito de invitado (localStorage)
   */
  private addItemToGuestCart(productId: string, quantity: number): Observable<ICart> {
    return new Observable(observer => {
      // Primero obtener información del producto desde la API
      this.http.get<any>(`${environment.apiUrl}/api/products/${productId}`).subscribe({
        next: (product) => {
          const currentCart = this.getCurrentCartValue() || this.createEmptyCart();

          // Buscar si el producto ya existe en el carrito
          const existingItemIndex = currentCart.items.findIndex(item => item.product.id === productId);

          if (existingItemIndex >= 0) {
            // Producto ya existe, actualizar cantidad
            currentCart.items[existingItemIndex].quantity += quantity;
            currentCart.items[existingItemIndex].subtotalWithTax =
              currentCart.items[existingItemIndex].quantity * currentCart.items[existingItemIndex].unitPriceWithTax;
          } else {
            // Producto nuevo, agregar al carrito
            const newItem = {
              product: {
                id: product.id,
                name: product.name,
                price: product.price,
                priceWithTax: product.priceWithTax || (product.price * (1 + (product.taxRate || 21) / 100)),
                category: product.category,
                unit: product.unit,
                description: product.description,
                isActive: product.isActive,
                stock: product.stock,
                taxRate: product.taxRate || 21,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
              },
              quantity: quantity,
              priceAtTime: product.priceWithTax || (product.price * (1 + (product.taxRate || 21) / 100)),
              taxRate: product.taxRate || 21,
              unitPriceWithTax: product.priceWithTax || (product.price * (1 + (product.taxRate || 21) / 100)),
              subtotalWithTax: quantity * (product.priceWithTax || (product.price * (1 + (product.taxRate || 21) / 100)))
            };
            currentCart.items.push(newItem);
          }

          // Recalcular totales
          this.recalculateCartTotals(currentCart);

          // Guardar en localStorage y actualizar estado
          this.saveGuestCartToStorage(currentCart);
          this._updateCartState(currentCart);

          this.notificationService.showSuccess(`${quantity} x ${product.name} añadido(s) al carrito.`, 'Carrito Actualizado');

          observer.next(currentCart);
          observer.complete();
        },
        error: (err) => {
          console.error('Error obteniendo información del producto:', err);
          this.notificationService.showError('No se pudo obtener la información del producto.', 'Error');
          observer.error(err);
        }
      });
    });
  }

  /**
   * Actualiza la cantidad de un producto específico en el carrito.
   * Para usuarios autenticados: Llama al endpoint PUT /api/cart/items/:productId.
   * Para usuarios invitados: Maneja el carrito localmente en localStorage.
   * Si la cantidad es 0 o menor, elimina el item.
   * @param productId ID del producto a actualizar.
   * @param quantity Nueva cantidad total para el producto.
   */
  updateItemQuantity(productId: string, quantity: number): Observable<ICart> {
    if (this.isGuestUser()) {
      return this.updateGuestCartItemQuantity(productId, quantity);
    }

    // Usuario autenticado: usar API
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
   * Actualizar cantidad de producto en carrito de invitado (localStorage)
   */
  private updateGuestCartItemQuantity(productId: string, quantity: number): Observable<ICart> {
    return new Observable(observer => {
      const currentCart = this.getCurrentCartValue();
      if (!currentCart) {
        observer.error(new Error('No hay carrito disponible'));
        return;
      }

      const itemIndex = currentCart.items.findIndex(item => item.product.id === productId);

      if (itemIndex >= 0) {
        const item = currentCart.items[itemIndex];

        if (quantity <= 0) {
          // Eliminar item si cantidad es 0 o menor
          currentCart.items.splice(itemIndex, 1);
          this.notificationService.showInfo(`${item.product.name} eliminado del carrito.`, 'Carrito Actualizado');
        } else {
          // Actualizar cantidad
          currentCart.items[itemIndex].quantity = quantity;
          currentCart.items[itemIndex].subtotalWithTax = quantity * item.unitPriceWithTax;
          this.notificationService.showInfo(`Cantidad de ${item.product.name} actualizada a ${quantity}.`, 'Carrito Actualizado');
        }

        // Recalcular totales
        this.recalculateCartTotals(currentCart);

        // Guardar en localStorage y actualizar estado
        this.saveGuestCartToStorage(currentCart);
        this._updateCartState(currentCart);

        observer.next(currentCart);
        observer.complete();
      } else {
        const error = new Error('Producto no encontrado en el carrito');
        this.notificationService.showError('Producto no encontrado en el carrito.', 'Error');
        observer.error(error);
      }
    });
  }

  /**
   * Elimina un producto específico del carrito.
   * Para usuarios autenticados: Llama al endpoint DELETE /api/cart/items/:productId.
   * Para usuarios invitados: Maneja el carrito localmente en localStorage.
   * @param productId ID del producto a eliminar.
   */
  removeItem(productId: string): Observable<ICart> {
    if (this.isGuestUser()) {
      return this.removeGuestCartItem(productId);
    }

    // Usuario autenticado: usar API
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
   * Eliminar producto del carrito de invitado (localStorage)
   */
  private removeGuestCartItem(productId: string): Observable<ICart> {
    return new Observable(observer => {
      const currentCart = this.getCurrentCartValue();
      if (!currentCart) {
        observer.error(new Error('No hay carrito disponible'));
        return;
      }

      const itemIndex = currentCart.items.findIndex(item => item.product.id === productId);

      if (itemIndex >= 0) {
        const removedItem = currentCart.items[itemIndex];
        currentCart.items.splice(itemIndex, 1);

        // Recalcular totales
        this.recalculateCartTotals(currentCart);

        // Guardar en localStorage y actualizar estado
        this.saveGuestCartToStorage(currentCart);
        this._updateCartState(currentCart);

        this.notificationService.showSuccess(`${removedItem.product.name} eliminado del carrito.`, 'Carrito Actualizado');

        observer.next(currentCart);
        observer.complete();
      } else {
        const error = new Error('Producto no encontrado en el carrito');
        this.notificationService.showError('Producto no encontrado en el carrito.', 'Error');
        observer.error(error);
      }
    });
  }

  /**
   * Elimina todos los ítems del carrito del usuario.
   * Para usuarios autenticados: Llama al endpoint DELETE /api/cart.
   * Para usuarios invitados: Limpia el carrito localStorage.
   */
  clearCart(): Observable<ICart> {
    if (this.isGuestUser()) {
      return this.clearGuestCart();
    }

    // Usuario autenticado: usar API
    return this.http.delete<ICart>(this.cartApiUrl).pipe(
      tap(emptiedCart => {
        this._updateCartState(emptiedCart);
        this.notificationService.showSuccess('El carrito ha sido vaciado.', 'Carrito Actualizado');
      }),
      catchError(err => this.handleError(err, 'vaciar el carrito'))
    );
  }

  /**
   * Limpiar carrito de invitado (localStorage)
   */
  private clearGuestCart(): Observable<ICart> {
    return new Observable(observer => {
      const emptyCart = this.createEmptyCart();

      // Limpiar localStorage
      localStorage.removeItem(this.guestCartStorageKey);

      // Actualizar estado
      this._updateCartState(emptyCart);

      this.notificationService.showSuccess('El carrito ha sido vaciado.', 'Carrito Actualizado');

      observer.next(emptyCart);
      observer.complete();
    });
  }

  /**
   * Limpiar carrito local (solo estado, sin petición al backend)
   * Útil para usuarios guest
   */
  clearLocalCart(): void {
    const emptyCart = this.createEmptyCart();
    this._updateCartState(emptyCart);
    this.notificationService.showSuccess('Carrito limpiado', 'Info');
  }

  /**
   * Método privado para actualizar el estado del BehaviorSubject.
   * @param cart El nuevo estado del carrito (o null).
   */
  private _updateCartState(cart: ICart | null): void {
    this.cartSubject.next(cart);
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
      this._updateCartState(null);
      return throwError(() => new Error('Carrito no encontrado')); // Devolvemos un error simple que getCart puede manejar
    }

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

  /**
   * MÉTODO TEMPORAL para testing - agregar productos de prueba al carrito guest
   * DEPRECADO: Usar addItem() con productos reales en su lugar
   */
  addTestProductsToGuestCart(): void {
    this.notificationService.showInfo('Los productos de prueba han sido deshabilitados. Usa el catálogo de productos para agregar items reales al carrito.', 'Funcionalidad Actualizada');
  }

  /**
   * Recalcula los totales de un carrito
   */
  private recalculateCartTotals(cart: ICart): void {
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.total = cart.items.reduce((total, item) => total + item.subtotalWithTax, 0);

    // Calcular subtotal sin impuestos y total de impuestos
    cart.subtotalWithoutTax = cart.items.reduce((total, item) => {
      const priceWithoutTax = item.unitPriceWithTax / (1 + item.taxRate / 100);
      return total + (priceWithoutTax * item.quantity);
    }, 0);

    cart.totalTaxAmount = cart.total - cart.subtotalWithoutTax;
    cart.updatedAt = new Date();
  }

  /**
   * Transferir carrito de invitado a usuario autenticado
   * Se llama cuando un usuario invitado se autentica
   */
  transferGuestCartToAuthenticatedUser(): Observable<ICart | null> {
    const guestCart = this.getCurrentCartValue();

    if (!guestCart || guestCart.items.length === 0) {
      // No hay carrito de invitado o está vacío
      return this.getCart(); // Obtener carrito del usuario autenticado
    }

    // Transferir items del carrito de invitado al carrito del usuario autenticado
    const transferObservables = guestCart.items.map(item =>
      this.http.post<ICart>(`${this.cartApiUrl}/items`, {
        productId: item.product.id,
        quantity: item.quantity
      }).pipe(
        catchError(err => {
          console.warn(`Error transferring item ${item.product.name}:`, err);
          return of(null); // Continuar con otros items aunque falle uno
        })
      )
    );

    // Ejecutar todas las transferencias y luego limpiar carrito local
    return from(transferObservables).pipe(
      mergeMap(obs => obs),
      toArray(),
      switchMap(() => {
        // Limpiar carrito de invitado
        localStorage.removeItem(this.guestCartStorageKey);
        // Obtener carrito actualizado del backend
        return this.getCart();
      }),
      tap(() => {
        this.notificationService.showSuccess('Carrito sincronizado correctamente.', 'Bienvenido');
      }),
      catchError(err => {
        console.error('Error transferring guest cart:', err);
        // Aún así obtener carrito del usuario autenticado
        return this.getCart();
      })
    );
  }
}