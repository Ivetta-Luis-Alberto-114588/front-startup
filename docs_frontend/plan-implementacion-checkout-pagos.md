# 📋 Plan de Implementación Completo: Checkout con Métodos de Entrega y Pago

## 📖 Resumen Ejecutivo

Este plan detalla todas las modificaciones necesarias para implementar un sistema de checkout que soporte:
- **Métodos de entrega**: PICKUP (retiro en local) y DELIVERY (entrega a domicilio)
- **Métodos de pago**: CASH (efectivo) y MERCADO_PAGO (MercadoPago)
- **Validación de direcciones**: Solo requerida para DELIVERY
- **Flujo de estados**: Desde creación hasta completado

---

## 🎯 Objetivos del Plan

1. **Implementar lógica de métodos de entrega** que determine cuándo se requiere dirección
2. **Implementar lógica de métodos de pago** que filtre opciones según el método de entrega
3. **Validar formularios dinámicamente** según las reglas de negocio
4. **Integrar con backend** usando los endpoints documentados
5. **Manejar estados de orden** correctamente según el flujo de pago

---

## 📊 Análisis de Estado Actual

### ✅ Componentes Existentes
- `CheckoutPageComponent` - Componente principal del checkout
- `PaymentSuccessComponent` - Manejo de éxito de pago
- `PaymentFailureComponent` - Manejo de fallo de pago
- `PaymentStatusDisplayComponent` - Mostrar estado de pago
- `CheckoutStateService` - Servicio de estado del checkout

### ✅ Servicios Existentes
- `DeliveryMethodService` - Consultar métodos de entrega
- `PaymentMethodService` - Consultar métodos de pago
- `OrderService` - Crear y gestionar órdenes
- `PaymentService` - Crear preferencias de pago
- `AddressService` - Gestionar direcciones

### ⚠️ Problemas Identificados
1. **Lógica de validación de dirección** no está completamente implementada
2. **Filtrado de métodos de pago** según método de entrega falta
3. **Manejo de estados** necesita mejoras
4. **Integración con backend** requiere ajustes

---

## 🔧 Modificaciones Requeridas

### 1. Modelos y Tipos (src/app/shared/models/)

#### 1.1 Actualizar IDeliveryMethod
```typescript
// src/app/shared/models/idelivery-method.ts
export interface IDeliveryMethod {
  id: string;
  code: string;
  name: string;
  description?: string;
  requiresAddress: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

#### 1.2 Actualizar IPaymentMethod
```typescript
// src/app/shared/models/ipayment-method.ts
export interface IPaymentMethod {
  _id: string;
  code: 'CASH' | 'MERCADO_PAGO';
  name: string;
  description: string;
  isActive: boolean;
  requiresOnlinePayment: boolean;
  allowsManualConfirmation: boolean;
  defaultOrderStatusId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 1.3 Actualizar IOrderStatus
```typescript
// src/app/shared/models/iorder-status.ts
export interface IOrderStatus {
  _id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  order: number;
  isActive: boolean;
  isDefault: boolean;
  canTransitionTo: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 2. Servicios (src/app/shared/services/)

#### 2.1 PaymentMethodService - Filtrado por método de entrega
```typescript
// src/app/shared/services/payment-method.service.ts
export class PaymentMethodService {
  
  // Método existente mejorado
  filterPaymentMethodsByDelivery(
    allMethods: IPaymentMethod[], 
    deliveryMethodCode: string
  ): IPaymentMethod[] {
    // Si es PICKUP, permitir CASH y MERCADO_PAGO
    if (deliveryMethodCode === 'PICKUP') {
      return allMethods.filter(method => 
        method.code === 'CASH' || method.code === 'MERCADO_PAGO'
      );
    }
    
    // Si es DELIVERY, solo MERCADO_PAGO
    if (deliveryMethodCode === 'DELIVERY') {
      return allMethods.filter(method => 
        method.code === 'MERCADO_PAGO'
      );
    }
    
    return allMethods;
  }
}
```

#### 2.2 DeliveryMethodService - Consulta de métodos
```typescript
// src/app/shared/services/delivery-method.service.ts
export class DeliveryMethodService {
  
  // Método existente - verificar implementación
  getActiveDeliveryMethods(): Observable<IDeliveryMethod[]> {
    return this.http.get<IDeliveryMethod[]>(
      `${environment.apiUrl}/api/delivery-methods`
    );
  }
  
  // Método existente - verificar implementación
  requiresAddress(methodId: string): Observable<boolean> {
    return this.getDeliveryMethodById(methodId).pipe(
      map(method => method?.requiresAddress || false)
    );
  }
}
```

#### 2.3 OrderService - Validación de payload
```typescript
// src/app/features/orders/services/order.service.ts
export class OrderService {
  
  createOrder(payload: ICreateOrderPayload): Observable<IOrder> {
    // Validar y adaptar payload según método de entrega
    const validatedPayload = this.validateAndAdaptPayload(payload);
    
    return this.http.post<IOrder>(
      `${environment.apiUrl}/api/orders`,
      validatedPayload
    );
  }
  
  private validateAndAdaptPayload(payload: ICreateOrderPayload): ICreateOrderPayload {
    const isPickup = this.isPickupMethod(payload);
    
    if (isPickup) {
      // Para PICKUP, remover todos los campos de dirección
      const { 
        selectedAddressId, 
        shippingRecipientName, 
        shippingPhone, 
        shippingStreetAddress, 
        shippingNeighborhoodId,
        shippingCityId,
        shippingPostalCode,
        shippingAdditionalInfo,
        ...cleanPayload 
      } = payload;
      
      return cleanPayload;
    }
    
    // Para DELIVERY, validar que tenemos dirección
    this.validateShippingData(payload);
    return payload;
  }
  
  private isPickupMethod(payload: ICreateOrderPayload): boolean {
    return payload.deliveryMethodCode === 'PICKUP';
  
  private validateShippingData(payload: ICreateOrderPayload): void {
    if (!payload.selectedAddressId) {
      const requiredFields = [
        'shippingRecipientName',
        'shippingPhone', 
        'shippingStreetAddress',
        'shippingNeighborhoodId'
      ];
      
      for (const field of requiredFields) {
        if (!payload[field as keyof ICreateOrderPayload]) {
          throw new Error(`${field} es requerido para entrega a domicilio`);
        }
      }
    }
  }
}
```

### 3. Componentes (src/app/features/checkout/)

#### 3.1 CheckoutPageComponent - Lógica principal
```typescript
// src/app/features/checkout/components/checkout-page/checkout-page.component.ts
export class CheckoutPageComponent implements OnInit, OnDestroy {
  
  // Propiedades existentes
  availableDeliveryMethods: IDeliveryMethod[] = [];
  selectedDeliveryMethod: IDeliveryMethod | null = null;
  availablePaymentMethods: IPaymentMethod[] = [];
  selectedPaymentMethod: string | null = null;
  
  ngOnInit(): void {
    this.loadDeliveryMethods();
    this.loadCart();
    this.loadUserAddresses();
  }
  
  // Cargar métodos de entrega
  private loadDeliveryMethods(): void {
    this.deliveryMethodService.getActiveDeliveryMethods().subscribe({
      next: (methods) => {
        this.availableDeliveryMethods = methods;
        this.checkoutStateService.setAvailableDeliveryMethods(methods);
      },
      error: (error) => {
        console.error('Error loading delivery methods:', error);
        this.notificationService.showError('Error al cargar métodos de entrega');
      }
    });
  }
  
  // Seleccionar método de entrega
  selectDeliveryMethod(method: IDeliveryMethod): void {
    this.selectedDeliveryMethod = method;
    this.checkoutStateService.setSelectedDeliveryMethod(method);
    
    // Actualizar métodos de pago disponibles
    this.updateAvailablePaymentMethods(method);
    
    // Si no requiere dirección, limpiar selección de dirección
    if (!method.requiresAddress) {
      this.selectedAddressOption = null;
      this.selectedExistingAddressId = null;
  // Actualizar métodos de pago según método de entrega
  updateAvailablePaymentMethods(method: IDeliveryMethod): void {
    this.selectedPaymentMethod = null;
    this.paymentMethodService.getActivePaymentMethods().subscribe({
        this.availablePaymentMethods = this.paymentMethodService
          .filterPaymentMethodsByDelivery(allMethods, method.code);
        
        // Auto-seleccionar si solo hay un método
        if (this.availablePaymentMethods.length === 1) {
          this.selectedPaymentMethod = this.availablePaymentMethods[0]._id;
          this.checkoutStateService.setSelectedPaymentMethodId(this.availablePaymentMethods[0]._id);
        }
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
        this.setFallbackPaymentMethods(method);
      }
    });
  }
  
  // Validar que el checkout esté completo
  canConfirmOrder(): boolean {
    if (!this.selectedDeliveryMethod) return false;
    if (!this.selectedPaymentMethod) return false;
    
    // Si el método requiere dirección, validar que esté seleccionada
    if (this.selectedDeliveryMethod.requiresAddress) {
      return this.isAddressSelectedOrValid;
    }
    
    return true;
  }
  
  // Confirmar orden
  confirmOrder(): void {
    try {
      if (!this.canConfirmOrder()) {
        this.notificationService.showWarning('Complete todos los campos requeridos');
        return;
      }
      
      this.isProcessingOrder = true;
      const cart = this.cartService.getCurrentCartValue();
      
      if (!cart || cart.items.length === 0) {
        this.notificationService.showError('Tu carrito está vacío');
        this.router.navigate(['/cart']);
        return;
      }
      
      const orderPayload = this.buildOrderPayload(cart);
      this.processOrder(orderPayload);
      
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Error al procesar orden');
      this.isProcessingOrder = false;
    }
  }
  
  // Construir payload de orden
  private buildOrderPayload(cart: ICart): ICreateOrderPayload {
    const payload: ICreateOrderPayload = {
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPriceWithTax
      })),
      deliveryMethodId: this.selectedDeliveryMethod!.id,
      deliveryMethodCode: this.selectedDeliveryMethod!.code,
      paymentMethodCode: this.getSelectedPaymentMethodCode(),
      notes: `Pedido desde checkout - ${this.selectedDeliveryMethod!.name}`
    };
    
    // Agregar datos de dirección solo si es requerida
    if (this.selectedDeliveryMethod!.requiresAddress) {
      if (this.selectedAddressOption === 'existing') {
        payload.selectedAddressId = this.selectedExistingAddressId;
      } else if (this.selectedAddressOption === 'new') {
        const formData = this.newAddressForm.value;
        payload.shippingRecipientName = formData.recipientName;
        payload.shippingPhone = formData.phone;
        payload.shippingStreetAddress = formData.streetAddress;
        payload.shippingNeighborhoodId = formData.neighborhoodId;
        payload.shippingCityId = formData.cityId;
        payload.shippingPostalCode = formData.postalCode;
        payload.shippingAdditionalInfo = formData.additionalInfo;
      }
    }
    
    return payload;
  }
  
  // Obtener código del método de pago seleccionado
  private getSelectedPaymentMethodCode(): string {
    const selectedMethod = this.availablePaymentMethods.find(
      method => method._id === this.selectedPaymentMethod
    );
    return selectedMethod?.code || 'MERCADO_PAGO';
  }
  
  // Procesar orden
  private processOrder(orderPayload: ICreateOrderPayload): void {
    this.orderService.createOrder(orderPayload).pipe(
      tap((createdOrder) => {
        const paymentMethodCode = this.getSelectedPaymentMethodCode();
        
        if (paymentMethodCode === 'CASH') {
          this.notificationService.showSuccess(
            '¡Pedido confirmado! Puedes retirarlo y pagar en efectivo.',
            'Orden Creada'
          );
        } else {
          this.notificationService.showInfo('Procesando pago...', 'Orden Creada');
        }
      }),
      switchMap(createdOrder => {
        if (!createdOrder?.id) {
          throw new Error('No se recibió ID de la orden creada');
        }
        
        const paymentMethodCode = this.getSelectedPaymentMethodCode();
        
        if (paymentMethodCode === 'CASH') {
          return of({ orderId: createdOrder.id, paymentType: 'cash' });
        }
        
        // Para MercadoPago, crear preferencia
        return this.paymentService.createPaymentPreference(createdOrder.id).pipe(
          map((preference: any) => ({
            orderId: createdOrder.id,
            paymentType: 'mercado_pago',
            preference
          }))
        );
      }),
      catchError(err => {
        this.handleOrderError(err);
        return EMPTY;
      }),
      finalize(() => this.isProcessingOrder = false)
    ).subscribe({
      next: (result: any) => {
        // Limpiar carrito
        this.cartService.clearCart().subscribe({
          next: () => {
            if (result.paymentType === 'cash') {
              this.handleCashPaymentSuccess(result.orderId);
            } else if (result.preference?.preference?.init_point) {
              this.navigateToPayment(result.preference.preference.init_point);
            } else {
              this.notificationService.showError('Error al inicializar pago');
            }
          },
          error: (err) => {
            // Continuar con el flujo aunque falle limpiar carrito
            if (result.paymentType === 'cash') {
              this.handleCashPaymentSuccess(result.orderId);
            } else if (result.preference?.preference?.init_point) {
              this.navigateToPayment(result.preference.preference.init_point);
            }
          }
        });
      }
    });
  }
  
  // Manejar éxito de pago en efectivo
  private handleCashPaymentSuccess(orderId: string): void {
    this.notificationService.showSuccess(
      '¡Pedido confirmado! Acércate al local para retirar y pagar en efectivo.',
      'Pago en Efectivo'
    );
    
    setTimeout(() => {
      this.router.navigate(['/'], {
        queryParams: {
          orderConfirmed: 'true',
          orderId: orderId,
          paymentType: 'cash'
        }
      });
    }, 3000);
  }
  
  // Redirigir a MercadoPago
  private navigateToPayment(url: string): void {
    window.location.href = url;
  }
  
  // Manejar errores de orden
  private handleOrderError(error: any): void {
    console.error('Error creating order:', error);
    let errorMessage = 'Error al crear la orden';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    this.notificationService.showError(errorMessage);
  }
}
```

#### 3.2 CheckoutPageComponent - Template
```html
<!-- src/app/features/checkout/components/checkout-page/checkout-page.component.html -->

<!-- Paso 1: Método de Entrega -->
<div class="card mb-4">
  <div class="card-header">
    <h5>Paso 1: Método de Entrega</h5>
  </div>
  <div class="card-body">
    <div class="row">
      <div class="col-md-6 mb-3" *ngFor="let method of availableDeliveryMethods">
        <div class="form-check">
          <input 
            class="form-check-input" 
            type="radio" 
            name="deliveryMethod"
            [id]="'delivery-' + method.id"
            [checked]="selectedDeliveryMethod?.id === method.id"
            (change)="selectDeliveryMethod(method)">
          <label class="form-check-label" [for]="'delivery-' + method.id">
            <strong>{{ method.name }}</strong>
            <div class="text-muted">{{ method.description }}</div>
            <div class="mt-1">
              <span *ngIf="method.requiresAddress" class="badge bg-warning text-dark">
                Requiere dirección
              </span>
              <span *ngIf="!method.requiresAddress" class="badge bg-info">
                Retiro inmediato
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Paso 2: Dirección (solo si se requiere) -->
<div class="card mb-4" *ngIf="selectedDeliveryMethod?.requiresAddress">
  <div class="card-header">
    <h5>Paso 2: Dirección de Entrega</h5>
  </div>
  <div class="card-body">
    <!-- Opciones de dirección existente/nueva -->
    <div class="mb-3" *ngIf="isAuthenticated$ | async">
      <label class="form-label">Selecciona una opción:</label>
      <div class="form-check">
        <input 
          class="form-check-input" 
          type="radio" 
          name="addressOption"
          id="existing-address"
          value="existing"
          [(ngModel)]="selectedAddressOption"
          (change)="onAddressOptionChange()">
        <label class="form-check-label" for="existing-address">
          Usar dirección guardada
        </label>
      </div>
      <div class="form-check">
        <input 
          class="form-check-input" 
          type="radio" 
          name="addressOption"
          id="new-address"
          value="new"
          [(ngModel)]="selectedAddressOption"
          (change)="onAddressOptionChange()">
        <label class="form-check-label" for="new-address">
          Ingresar nueva dirección
        </label>
      </div>
    </div>
    
    <!-- Selector de dirección existente -->
    <div *ngIf="selectedAddressOption === 'existing' && addresses.length > 0">
      <select 
        class="form-select" 
        [(ngModel)]="selectedExistingAddressId"
        (change)="onExistingAddressChange()">
        <option value="">Selecciona una dirección...</option>
        <option *ngFor="let address of addresses" [value]="address.id">
          {{ address.streetAddress }} - {{ address.neighborhood?.name }}, {{ address.city?.name }}
        </option>
      </select>
    </div>
    
    <!-- Formulario de nueva dirección -->
    <div *ngIf="selectedAddressOption === 'new' || !(isAuthenticated$ | async)">
      <form [formGroup]="newAddressForm">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Nombre del destinatario *</label>
            <input 
              type="text" 
              class="form-control" 
              formControlName="recipientName"
              [class.is-invalid]="newAddressForm.get('recipientName')?.invalid && newAddressForm.get('recipientName')?.touched">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Teléfono *</label>
            <input 
              type="tel" 
              class="form-control" 
              formControlName="phone"
              [class.is-invalid]="newAddressForm.get('phone')?.invalid && newAddressForm.get('phone')?.touched">
          </div>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Dirección *</label>
          <input 
            type="text" 
            class="form-control" 
            formControlName="streetAddress"
            [class.is-invalid]="newAddressForm.get('streetAddress')?.invalid && newAddressForm.get('streetAddress')?.touched">
        </div>
        
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Ciudad *</label>
            <select 
              class="form-select" 
              formControlName="cityId"
              (change)="onCityChange()"
              [class.is-invalid]="newAddressForm.get('cityId')?.invalid && newAddressForm.get('cityId')?.touched">
              <option value="">Selecciona una ciudad...</option>
              <option *ngFor="let city of cities" [value]="city.id">
                {{ city.name }}
              </option>
            </select>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Barrio *</label>
            <select 
              class="form-select" 
              formControlName="neighborhoodId"
              [disabled]="!newAddressForm.get('cityId')?.value"
              [class.is-invalid]="newAddressForm.get('neighborhoodId')?.invalid && newAddressForm.get('neighborhoodId')?.touched">
              <option value="">Selecciona un barrio...</option>
              <option *ngFor="let neighborhood of neighborhoods" [value]="neighborhood.id">
                {{ neighborhood.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Código Postal</label>
          <input 
            type="text" 
            class="form-control" 
            formControlName="postalCode">
        </div>
        
        <div class="mb-3">
          <label class="form-label">Información adicional</label>
          <textarea 
            class="form-control" 
            formControlName="additionalInfo" 
            rows="2"></textarea>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Paso 3: Método de Pago -->
<div class="card mb-4" *ngIf="selectedDeliveryMethod && (!selectedDeliveryMethod.requiresAddress || isAddressSelectedOrValid)">
  <div class="card-header">
    <h5>Paso 3: Método de Pago</h5>
  </div>
  <div class="card-body">
    <div *ngIf="availablePaymentMethods.length > 0; else noPaymentMethods">
      <div class="form-check mb-3" *ngFor="let method of availablePaymentMethods">
        <input 
          class="form-check-input" 
          type="radio" 
          name="paymentMethod"
          [id]="'payment-' + method._id"
          [value]="method._id"
          [checked]="selectedPaymentMethod === method._id"
          (change)="selectPaymentMethod(method._id)">
        <label class="form-check-label d-flex align-items-center" [for]="'payment-' + method._id">
          <i [class]="getPaymentMethodIcon(method.code)" class="me-2 text-primary"></i>
          <div>
            <strong>{{ method.name }}</strong>
            <div class="text-muted">{{ method.description }}</div>
          </div>
        </label>
      </div>
    </div>
    
    <ng-template #noPaymentMethods>
      <div class="alert alert-warning">
        No hay métodos de pago disponibles para este método de entrega.
      </div>
    </ng-template>
  </div>
</div>

<!-- Paso 4: Confirmación -->
<div class="card mb-4" *ngIf="canConfirmOrder()">
  <div class="card-header">
    <h5>Paso 4: Confirmación</h5>
  </div>
  <div class="card-body">
    <div class="row">
      <div class="col-md-8">
        <h6>Resumen del pedido:</h6>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between" *ngFor="let item of (cart$ | async)?.items">
            <span>{{ item.product.name }} x{{ item.quantity }}</span>
            <span>{{ item.subtotal | currency:'ARS':'symbol':'1.2-2' }}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between">
            <strong>Total:</strong>
            <strong>{{ (cart$ | async)?.total | currency:'ARS':'symbol':'1.2-2' }}</strong>
          </li>
        </ul>
        
        <div class="mt-3">
          <p><strong>Método de entrega:</strong> {{ selectedDeliveryMethod?.name }}</p>
          <p><strong>Método de pago:</strong> {{ getSelectedPaymentMethodName() }}</p>
          <p *ngIf="selectedDeliveryMethod?.requiresAddress">
            <strong>Dirección:</strong> {{ getSelectedAddressDisplay() }}
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="card-footer">
    <button 
      class="btn btn-primary btn-lg" 
      [disabled]="isProcessingOrder || !canConfirmOrder()"
      (click)="confirmOrder()">
      <span *ngIf="isProcessingOrder" class="spinner-border spinner-border-sm me-2"></span>
      {{ isProcessingOrder ? 'Procesando...' : 'Confirmar Pedido' }}
    </button>
  </div>
</div>
```

### 4. Estado del Checkout (src/app/features/checkout/services/)

#### 4.1 CheckoutStateService - Mejorado
```typescript
// src/app/features/checkout/services/checkout-state.service.ts
@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  
  // Observables para validación
  isCheckoutValid$: Observable<boolean> = combineLatest([
    this.selectedDeliveryMethod$,
    this.selectedPaymentMethodId$,
    this.shippingAddress$,
    this.shouldShowAddressSection$
  ]).pipe(
    map(([deliveryMethod, paymentMethodId, shippingAddress, shouldShowAddress]) => {
      if (!deliveryMethod) return false;
      if (!paymentMethodId) return false;
      if (shouldShowAddress && !shippingAddress) return false;
      return true;
    })
  );
  
  // Método para validar checkout completo
  validateCheckout(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    const deliveryMethod = this.getSelectedDeliveryMethod();
    if (!deliveryMethod) {
      errors.push('Selecciona un método de entrega');
    }
    
    const paymentMethodId = this.getSelectedPaymentMethodId();
    if (!paymentMethodId) {
      errors.push('Selecciona un método de pago');
    }
    
    if (deliveryMethod?.requiresAddress) {
      const address = this.getSelectedShippingAddress();
      if (!address) {
        errors.push('Selecciona o ingresa una dirección de entrega');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Método para obtener payload del checkout
  getCheckoutPayload(): any {
    const deliveryMethod = this.getSelectedDeliveryMethod();
    const paymentMethodId = this.getSelectedPaymentMethodId();
    const shippingAddress = this.getSelectedShippingAddress();
    
    return {
      deliveryMethod,
      paymentMethodId,
      shippingAddress: deliveryMethod?.requiresAddress ? shippingAddress : null
    };
  }
}
```

---

## 🌐 Endpoints del Backend

### 1. Métodos de Entrega
```http
GET /api/delivery-methods
```
**Respuesta:**
```json
[
  {
    "id": "delivery-1",
    "code": "DELIVERY",
    "name": "Entrega a Domicilio",
    "description": "Recibe tu pedido en la puerta de tu casa",
    "requiresAddress": true,
    "isActive": true
  },
  {
    "id": "pickup-1",
    "code": "PICKUP",
    "name": "Retiro en Local",
    "description": "Acércate a nuestra tienda a retirar tu pedido",
    "requiresAddress": false,
    "isActive": true
  }
]
```

### 2. Métodos de Pago
```http
GET /api/payment-methods/active
```
**Respuesta:**
```json
[
  {
    "_id": "686d1dce998b63247984d428",
    "code": "CASH",
    "name": "Efectivo",
    "description": "Pago en efectivo al momento de la entrega o retiro en el local",
    "isActive": true,
    "requiresOnlinePayment": false,
    "allowsManualConfirmation": true,
    "defaultOrderStatusId": "686d1dcd998b63247984d41a"
  },
  {
    "_id": "686d1dce998b63247984d42a",
    "code": "MERCADO_PAGO",
    "name": "Mercado Pago",
    "description": "Pago online con tarjeta de crédito, débito o dinero en cuenta",
    "isActive": true,
    "requiresOnlinePayment": true,
    "allowsManualConfirmation": false,
    "defaultOrderStatusId": "686d1dcd998b63247984d41a"
  }
]
```

### 3. Crear Orden
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>
```

**Body para PICKUP:**
```json
{
  "items": [
    { "productId": "prod123", "quantity": 2, "unitPrice": 100 }
  ],
  "deliveryMethodId": "pickup-1",
  "deliveryMethodCode": "PICKUP",
  "paymentMethodCode": "CASH",
  "notes": "Pedido para retiro en local"
}
```

**Body para DELIVERY:**
```json
{
  "items": [
    { "productId": "prod123", "quantity": 2, "unitPrice": 100 }
  ],
  "deliveryMethodId": "delivery-1",
  "deliveryMethodCode": "DELIVERY",
  "paymentMethodCode": "MERCADO_PAGO",
  "selectedAddressId": "address123",
  "notes": "Pedido para entrega a domicilio"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "id": "order123",
    "status": {
      "code": "AWAITING_PAYMENT",
      "name": "Esperando Pago",
      "color": "#fd7e14"
    },
    "total": 200,
    "items": [...],
    "deliveryMethod": {...},
    "paymentMethod": {...}
  }
}
```

### 4. Crear Preferencia de Pago (MercadoPago)
```http
POST /api/payments/sale/:saleId
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "payment": {
    "id": "payment123",
    "saleId": "order123",
    "amount": 200.00,
    "provider": "mercado_pago",
    "status": "pending"
  },
  "preference": {
    "id": "preference123",
    "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
    "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
  }
}
```

---

## 📊 Flujo de Estados

### Estados de la Orden
```
PENDING → AWAITING_PAYMENT → PENDIENTE PAGADO → CONFIRMED → COMPLETED
              ↓                       ↓            ↓
           CANCELLED            CANCELLED    CANCELLED
```

### Estados por Método de Pago
- **CASH**: PENDING → AWAITING_PAYMENT → (pago manual) → CONFIRMED → COMPLETED
- **MERCADO_PAGO**: PENDING → AWAITING_PAYMENT → (webhook) → PENDIENTE PAGADO → CONFIRMED → COMPLETED

---

## 🔍 Validaciones

### 1. Validaciones de Frontend
```typescript
// Validación de método de entrega
if (!selectedDeliveryMethod) {
  throw new Error('Selecciona un método de entrega');
}

// Validación de método de pago
if (!selectedPaymentMethod) {
  throw new Error('Selecciona un método de pago');
}

// Validación de dirección (solo para DELIVERY)
if (selectedDeliveryMethod.requiresAddress) {
  if (selectedAddressOption === 'existing' && !selectedExistingAddressId) {
    throw new Error('Selecciona una dirección guardada');
  }
  
  if (selectedAddressOption === 'new' && !newAddressForm.valid) {
    throw new Error('Completa todos los campos de la dirección');
  }
}

// Validación de carrito
if (!cart || cart.items.length === 0) {
  throw new Error('El carrito está vacío');
}
```

### 2. Validaciones de Backend
- **Método de entrega**: Debe existir y estar activo
- **Método de pago**: Debe existir y estar activo
- **Dirección**: Solo requerida si el método de entrega la requiere
- **Items**: Deben existir y tener stock disponible

---

## 🧪 Pruebas

### 1. Casos de Prueba
```typescript
describe('Checkout Flow', () => {
  
  it('should load delivery methods on init', () => {
    component.ngOnInit();
    expect(deliveryMethodService.getActiveDeliveryMethods).toHaveBeenCalled();
  });
  
  it('should update payment methods when delivery method changes', () => {
    const pickupMethod = { code: 'PICKUP', requiresAddress: false };
    component.selectDeliveryMethod(pickupMethod);
    expect(paymentMethodService.getActivePaymentMethods).toHaveBeenCalled();
  });
  
  it('should require address for DELIVERY method', () => {
    const deliveryMethod = { code: 'DELIVERY', requiresAddress: true };
    component.selectDeliveryMethod(deliveryMethod);
    expect(component.selectedDeliveryMethod?.requiresAddress).toBe(true);
  });
  
  it('should not require address for PICKUP method', () => {
    const pickupMethod = { code: 'PICKUP', requiresAddress: false };
    component.selectDeliveryMethod(pickupMethod);
    expect(component.selectedDeliveryMethod?.requiresAddress).toBe(false);
  });
  
  it('should filter payment methods by delivery method', () => {
    const allMethods = [
      { code: 'CASH', _id: '1' },
      { code: 'MERCADO_PAGO', _id: '2' }
    ];
    
    // Para PICKUP, ambos métodos disponibles
    let filtered = service.filterPaymentMethodsByDelivery(allMethods, 'PICKUP');
    expect(filtered.length).toBe(2);
    
    // Para DELIVERY, solo MercadoPago
    filtered = service.filterPaymentMethodsByDelivery(allMethods, 'DELIVERY');
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('MERCADO_PAGO');
  });
  
  it('should create order with correct payload for PICKUP', () => {
    const payload = {
      deliveryMethodCode: 'PICKUP',
      paymentMethodCode: 'CASH',
      selectedAddressId: 'address123'
    };
    
    const validatedPayload = service.validateAndAdaptPayload(payload);
    expect(validatedPayload.selectedAddressId).toBeUndefined();
  });
  
  it('should create order with address for DELIVERY', () => {
    const payload = {
      deliveryMethodCode: 'DELIVERY',
      paymentMethodCode: 'MERCADO_PAGO',
      selectedAddressId: 'address123'
    };
    
    const validatedPayload = service.validateAndAdaptPayload(payload);
    expect(validatedPayload.selectedAddressId).toBe('address123');
  });
});
```

---

## 🚀 Implementación Paso a Paso

### Fase 1: Preparación (1-2 días)
1. ✅ Actualizar modelos e interfaces
2. ✅ Verificar servicios existentes
3. ✅ Configurar endpoints en environment

### Fase 2: Lógica de Negocio (2-3 días)
1. ✅ Implementar filtrado de métodos de pago
2. ✅ Mejorar validación de payload en OrderService
3. ✅ Actualizar CheckoutStateService

### Fase 3: Componentes UI (3-4 días)
1. ✅ Actualizar CheckoutPageComponent
2. ✅ Mejorar template con validaciones dinámicas
3. ✅ Implementar manejo de errores

### Fase 4: Integración (2-3 días)
1. ✅ Probar flujo completo PICKUP + CASH
2. ✅ Probar flujo completo DELIVERY + MERCADO_PAGO
3. ✅ Validar estados de orden

### Fase 5: Pruebas (1-2 días)
1. ✅ Escribir pruebas unitarias
2. ✅ Pruebas de integración
3. ✅ Pruebas E2E

---

## 📋 Checklist de Implementación

### Backend (Verificar)
- [ ] Endpoint `/api/delivery-methods` funcionando
- [ ] Endpoint `/api/payment-methods/active` funcionando
- [ ] Endpoint `/api/orders` acepta payload sin dirección para PICKUP
- [ ] Webhook de MercadoPago actualiza estados correctamente
- [ ] Estados de orden configurados correctamente

### Frontend (Implementar)
- [ ] Modelos actualizados
- [ ] PaymentMethodService.filterPaymentMethodsByDelivery()
- [ ] OrderService.validateAndAdaptPayload()
- [ ] CheckoutStateService mejorado
- [ ] CheckoutPageComponent actualizado
- [ ] Template con validaciones dinámicas
- [ ] Manejo de errores
- [ ] Pruebas unitarias
- [ ] Documentación

### Validaciones (Verificar)
- [ ] Método de entrega obligatorio
- [ ] Método de pago obligatorio
- [ ] Dirección obligatoria solo para DELIVERY
- [ ] Carrito no vacío
- [ ] Productos con stock

### Flujos (Probar)
- [ ] PICKUP + CASH → Orden confirmada
- [ ] DELIVERY + MERCADO_PAGO → Redirección a pago
- [ ] Webhook MercadoPago → Estado actualizado
- [ ] Manejo de errores en cada paso

---

## 🎯 Resultados Esperados

### Para el Usuario
1. **Flujo intuitivo** con pasos claros
2. **Validaciones en tiempo real** que guían la experiencia
3. **Opciones de pago relevantes** según el método de entrega
4. **Confirmación clara** del estado de la orden

### Para el Negocio
1. **Órdenes estructuradas** con información completa
2. **Estados claros** para seguimiento
3. **Notificaciones automáticas** via webhook
4. **Flexibilidad** para agregar nuevos métodos

### Para el Desarrollador
1. **Código mantenible** con separación de responsabilidades
2. **Validaciones centralizadas** y reutilizables
3. **Pruebas completas** para cada caso
4. **Documentación clara** del flujo

---

## 📞 Información Adicional

### Contacto para Dudas
- **Backend**: Revisar endpoints en ambiente de desarrollo
- **Frontend**: Seguir este plan paso a paso
- **Pruebas**: Usar datos de prueba proporcionados

### Recursos Adicionales
- Documentación de MercadoPago
- Guías de Angular Reactive Forms
- Best practices para manejo de estados

---

*Este plan ha sido diseñado para asegurar una implementación completa y robusta del sistema de checkout con métodos de entrega y pago.*
