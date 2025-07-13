# 📋 Plan de Implementación Detallado - Flujo de Compras con MercadoPago y Efectivo

## 🎯 Objetivos

Implementar un sistema completo de checkout que permita:

1. **Métodos de Entrega**: Pickup (retiro) y Delivery (entrega)
2. **Métodos de Pago**: Efectivo y MercadoPago
3. **Validación Dinámica**: Direcciones solo cuando sea necesario
4. **Usuarios**: Registrados e invitados
5. **Experiencia**: Flujo paso a paso con feedback visual

---

## 📐 Arquitectura del Sistema

### 🏗️ Estructura de Componentes

```
src/app/features/checkout/
├── components/
│   └── checkout-page/
│       ├── checkout-page.component.ts
│       ├── checkout-page.component.html
│       └── checkout-page.component.scss
├── services/
│   └── checkout-state.service.ts
└── models/
    └── checkout-interfaces.ts

src/app/shared/
├── services/
│   ├── delivery-method.service.ts
│   └── payment-method.service.ts
└── models/
    ├── idelivery-method.ts
    └── ipayment-method.ts
```

### 🔗 Dependencias

```typescript
// Servicios requeridos
- AuthService (autenticación)
- CartService (carrito)
- OrderService (órdenes)
- AddressService (direcciones)
- PaymentService (procesamiento pagos)
- CityService (ciudades)
- NeighborhoodService (barrios)
- NotificationService (notificaciones)
```

---

## 🔧 Implementación Paso a Paso

### 1. **Modelos e Interfaces**

#### 1.1 Método de Entrega
```typescript
// src/app/shared/models/idelivery-method.ts
export interface IDeliveryMethod {
  id: string;
  code: string;
  name: string;
  description?: string;
  requiresAddress: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDeliveryMethodsResponse {
  deliveryMethods: IDeliveryMethod[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    next: string | null;
    prev: string | null;
  };
}
```

#### 1.2 Método de Pago
```typescript
// src/app/shared/models/ipayment-method.ts
export interface IPaymentMethod {
  _id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  requiresOnlinePayment: boolean;
  defaultOrderStatusId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethodPublic {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  requiresOnlinePayment: boolean;
  defaultOrderStatusId: string | { _id: string };
}
```

#### 1.3 Checkout State
```typescript
// src/app/features/checkout/models/checkout-interfaces.ts
export type ShippingAddressOption = 
  | { type: 'existing'; address: IAddress }
  | { type: 'new'; addressData: any };

export interface ICreateOrderPayload {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryMethodId: string;
  paymentMethodId: string;
  notes?: string;
  
  // Para dirección existente
  selectedAddressId?: string;
  
  // Para nueva dirección
  shippingRecipientName?: string;
  shippingPhone?: string;
  shippingStreetAddress?: string;
  shippingNeighborhoodId?: string;
  shippingAdditionalInfo?: string;
}
```

### 2. **Servicios**

#### 2.1 Servicio de Métodos de Entrega
```typescript
// src/app/shared/services/delivery-method.service.ts
@Injectable({ providedIn: 'root' })
export class DeliveryMethodService {
  private readonly apiUrl = `${environment.apiUrl}/api`;
  private deliveryMethodsCache$: Observable<IDeliveryMethod[]> | null = null;
  private cacheExpiration = 5 * 60 * 1000; // 5 minutos
  
  constructor(private http: HttpClient) {}

  /**
   * Obtiene métodos de entrega activos con cache
   */
  getActiveDeliveryMethods(): Observable<IDeliveryMethod[]> {
    if (this.isCacheValid()) {
      return this.deliveryMethodsCache$!;
    }

    this.deliveryMethodsCache$ = this.http.get<IDeliveryMethod[]>(`${this.apiUrl}/delivery-methods`)
      .pipe(
        tap(() => this.lastCacheTime = Date.now()),
        shareReplay(1),
        catchError(error => {
          this.deliveryMethodsCache$ = null;
          return throwError(() => error);
        })
      );

    return this.deliveryMethodsCache$;
  }

  /**
   * Busca método por ID
   */
  getDeliveryMethodById(id: string): Observable<IDeliveryMethod | null> {
    return this.getActiveDeliveryMethods().pipe(
      map(methods => methods.find(method => method.id === id) || null)
    );
  }

  /**
   * Busca método por código
   */
  getDeliveryMethodByCode(code: string): Observable<IDeliveryMethod | null> {
    return this.getActiveDeliveryMethods().pipe(
      map(methods => methods.find(method => method.code === code) || null)
    );
  }

  /**
   * Limpia cache
   */
  clearCache(): void {
    this.deliveryMethodsCache$ = null;
  }
}
```

#### 2.2 Servicio de Métodos de Pago
```typescript
// src/app/shared/services/payment-method.service.ts
@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private apiUrl = `${environment.apiUrl}/api/payment-methods`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene métodos de pago activos
   */
  getActivePaymentMethods(): Observable<IPaymentMethod[]> {
    return this.http.get<IPaymentMethodPublic[]>(`${this.apiUrl}/active`)
      .pipe(
        map(publicMethods => this.convertPublicToPrivateFormat(publicMethods)),
        catchError(error => {
          console.error('Error al obtener métodos de pago:', error);
          return this.getFallbackPaymentMethods();
        })
      );
  }

  /**
   * Filtra métodos por método de entrega
   */
  filterPaymentMethodsByDelivery(
    allMethods: IPaymentMethod[], 
    deliveryMethodCode?: string
  ): IPaymentMethod[] {
    if (!deliveryMethodCode) return allMethods;

    // Para pickup: todos los métodos
    if (deliveryMethodCode === 'PICKUP') {
      return allMethods;
    }

    // Para delivery: solo métodos online
    return allMethods.filter(method => method.requiresOnlinePayment);
  }

  /**
   * Convierte formato público a privado
   */
  private convertPublicToPrivateFormat(publicMethods: IPaymentMethodPublic[]): IPaymentMethod[] {
    return publicMethods.map(publicMethod => ({
      _id: publicMethod.id,
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
   * Métodos de respaldo en caso de error
   */
  private getFallbackPaymentMethods(): Observable<IPaymentMethod[]> {
    return of([
      {
        _id: 'fallback-cash',
        name: 'Pago en Efectivo',
        code: 'CASH',
        description: 'Paga en efectivo al retirar tu pedido',
        isActive: true,
        requiresOnlinePayment: false,
        defaultOrderStatusId: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  }
}
```

#### 2.3 Servicio de Estado del Checkout
```typescript
// src/app/features/checkout/services/checkout-state.service.ts
@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  // Estados observables
  private selectedDeliveryMethodSubject = new BehaviorSubject<IDeliveryMethod | null>(null);
  private selectedPaymentMethodIdSubject = new BehaviorSubject<string | null>(null);
  private shippingAddressSubject = new BehaviorSubject<ShippingAddressOption | null>(null);
  private availableDeliveryMethodsSubject = new BehaviorSubject<IDeliveryMethod[]>([]);

  // Observables públicos
  selectedDeliveryMethod$ = this.selectedDeliveryMethodSubject.asObservable();
  selectedPaymentMethodId$ = this.selectedPaymentMethodIdSubject.asObservable();
  shippingAddress$ = this.shippingAddressSubject.asObservable();
  availableDeliveryMethods$ = this.availableDeliveryMethodsSubject.asObservable();

  // Observables derivados
  shouldShowAddressSection$ = this.selectedDeliveryMethod$.pipe(
    map(method => method?.requiresAddress || false)
  );

  isCheckoutValid$ = combineLatest([
    this.selectedDeliveryMethod$,
    this.selectedPaymentMethodId$,
    this.shippingAddress$,
    this.shouldShowAddressSection$
  ]).pipe(
    map(([deliveryMethod, paymentMethodId, shippingAddress, shouldShowAddress]) => {
      if (!deliveryMethod || !paymentMethodId) return false;
      if (shouldShowAddress && !shippingAddress) return false;
      return true;
    })
  );

  // Métodos de gestión de estado
  setSelectedDeliveryMethod(method: IDeliveryMethod | null): void {
    this.selectedDeliveryMethodSubject.next(method);
    
    // Limpiar dirección si no es necesaria
    if (method && !method.requiresAddress) {
      this.setSelectedShippingAddress(null);
    }
  }

  setSelectedPaymentMethodId(paymentMethodId: string | null): void {
    this.selectedPaymentMethodIdSubject.next(paymentMethodId);
  }

  setSelectedShippingAddress(option: ShippingAddressOption | null): void {
    this.shippingAddressSubject.next(option);
  }

  setAvailableDeliveryMethods(methods: IDeliveryMethod[]): void {
    this.availableDeliveryMethodsSubject.next(methods);
  }

  // Métodos de obtención de valores actuales
  getSelectedDeliveryMethod(): IDeliveryMethod | null {
    return this.selectedDeliveryMethodSubject.value;
  }

  getSelectedPaymentMethodId(): string | null {
    return this.selectedPaymentMethodIdSubject.value;
  }

  getSelectedShippingAddress(): ShippingAddressOption | null {
    return this.shippingAddressSubject.value;
  }

  // Utilidades
  doesSelectedMethodRequireAddress(): boolean {
    return this.getSelectedDeliveryMethod()?.requiresAddress || false;
  }

  resetCheckoutState(): void {
    this.setSelectedDeliveryMethod(null);
    this.setSelectedPaymentMethodId(null);
    this.setSelectedShippingAddress(null);
    this.setAvailableDeliveryMethods([]);
  }

  getCheckoutPayload(): {
    deliveryMethod: string | null;
    paymentMethod: string | null;
    shippingInfo: ShippingAddressOption | null;
  } {
    const deliveryMethod = this.getSelectedDeliveryMethod();
    const paymentMethod = this.getSelectedPaymentMethodId();
    const shipping = this.getSelectedShippingAddress();

    return {
      deliveryMethod: deliveryMethod?.id || null,
      paymentMethod,
      shippingInfo: deliveryMethod?.requiresAddress ? shipping : null
    };
  }
}
```

### 3. **Componente Principal**

#### 3.1 Lógica del Componente
```typescript
// src/app/features/checkout/components/checkout-page/checkout-page.component.ts
@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss']
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  // Estados principales
  selectedDeliveryMethod: IDeliveryMethod | null = null;
  selectedPaymentMethod: string | null = null;
  selectedAddressOption: 'existing' | 'new' | null = null;
  selectedExistingAddressId: string | null = null;

  // Datos
  availableDeliveryMethods: IDeliveryMethod[] = [];
  availablePaymentMethods: IPaymentMethod[] = [];
  addresses: IAddress[] = [];
  cities: ICity[] = [];
  neighborhoods: INeighborhood[] = [];

  // Estados de carga
  isLoadingDeliveryMethods = false;
  isLoadingAddresses = false;
  isLoadingCities = false;
  isLoadingNeighborhoods = false;
  isProcessingOrder = false;

  // Observables
  cart$ = this.cartService.cart$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  shouldShowAddressSection$ = this.checkoutStateService.shouldShowAddressSection$;
  isCheckoutValid$ = this.checkoutStateService.isCheckoutValid$;

  // Formulario
  newAddressForm: FormGroup;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private addressService: AddressService,
    private cityService: CityService,
    private neighborhoodService: NeighborhoodService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private checkoutStateService: CheckoutStateService,
    private deliveryMethodService: DeliveryMethodService,
    private paymentMethodService: PaymentMethodService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeCheckout();
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  /**
   * Inicializa el formulario de nueva dirección
   */
  private initializeForm(): void {
    this.newAddressForm = this.fb.group({
      recipientName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]{8,15}$/)]],
      streetAddress: ['', Validators.required],
      postalCode: [''],
      cityId: [null, Validators.required],
      neighborhoodId: [{ value: null, disabled: true }, Validators.required],
      additionalInfo: [''],
      alias: ['']
    });

    // Escuchar cambios en ciudad para cargar barrios
    this.newAddressForm.get('cityId')?.valueChanges.subscribe(cityId => {
      this.onCityChange(cityId);
    });
  }

  /**
   * Inicializa el checkout
   */
  private initializeCheckout(): void {
    // Verificar carrito no vacío
    this.cart$.subscribe(cart => {
      if (!cart || cart.items.length === 0) {
        this.notificationService.showWarning('Tu carrito está vacío.', 'Checkout');
        this.router.navigate(['/cart']);
        return;
      }
    });

    // Cargar métodos de entrega
    this.loadDeliveryMethods();

    // Cargar direcciones si está autenticado
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadUserAddresses();
      } else {
        this.selectedAddressOption = 'new';
        this.loadCities();
      }
    });
  }

  /**
   * Carga métodos de entrega
   */
  private loadDeliveryMethods(): void {
    this.isLoadingDeliveryMethods = true;

    this.deliveryMethodService.getActiveDeliveryMethods().subscribe({
      next: (methods) => {
        this.availableDeliveryMethods = methods;
        this.checkoutStateService.setAvailableDeliveryMethods(methods);
        this.isLoadingDeliveryMethods = false;

        // Autoseleccionar si hay solo uno
        if (methods.length === 1) {
          this.selectDeliveryMethod(methods[0]);
        }
      },
      error: (error) => {
        console.error('Error cargando métodos de entrega:', error);
        this.notificationService.showError(
          'No se pudieron cargar los métodos de entrega.',
          'Error'
        );
        this.isLoadingDeliveryMethods = false;
      }
    });
  }

  /**
   * Selecciona método de entrega
   */
  selectDeliveryMethod(method: IDeliveryMethod): void {
    this.selectedDeliveryMethod = method;
    this.checkoutStateService.setSelectedDeliveryMethod(method);

    // Actualizar métodos de pago
    this.updateAvailablePaymentMethods(method);

    // Limpiar dirección si no es necesaria
    if (!method.requiresAddress) {
      this.selectedAddressOption = null;
      this.selectedExistingAddressId = null;
      this.newAddressForm.reset();
    } else {
      this.handleAddressRequirement();
    }
  }

  /**
   * Maneja el requerimiento de dirección
   */
  private handleAddressRequirement(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth && this.addresses.length > 0) {
        // Usuario con direcciones: no seleccionar automáticamente
        if (!this.selectedAddressOption) {
          // Permitir que el usuario elija
        }
      } else {
        // Usuario sin direcciones o invitado
        this.selectedAddressOption = 'new';
        this.loadCities();
      }
    });
  }

  /**
   * Actualiza métodos de pago disponibles
   */
  private updateAvailablePaymentMethods(method: IDeliveryMethod): void {
    this.selectedPaymentMethod = null;
    this.checkoutStateService.setSelectedPaymentMethodId(null);

    this.paymentMethodService.getActivePaymentMethods().subscribe({
      next: (allMethods) => {
        this.availablePaymentMethods = this.paymentMethodService.filterPaymentMethodsByDelivery(
          allMethods,
          method.code
        );

        // Autoseleccionar si hay solo uno
        if (this.availablePaymentMethods.length === 1) {
          this.selectPaymentMethod(this.availablePaymentMethods[0]._id);
        }
      },
      error: (error) => {
        console.error('Error cargando métodos de pago:', error);
        this.setFallbackPaymentMethods(method);
      }
    });
  }

  /**
   * Selecciona método de pago
   */
  selectPaymentMethod(methodId: string): void {
    this.selectedPaymentMethod = methodId;
    this.checkoutStateService.setSelectedPaymentMethodId(methodId);
  }

  /**
   * Confirma y procesa la orden
   */
  confirmOrder(): void {
    try {
      this.validateOrderBeforeCreation();
      this.isProcessingOrder = true;

      const cart = this.cartService.getCurrentCartValue();
      const orderPayload = this.buildOrderPayload(cart);

      this.processOrder(orderPayload);
    } catch (error: any) {
      this.notificationService.showWarning(error.message || 'Error en la validación del pedido.');
      this.isProcessingOrder = false;
    }
  }

  /**
   * Valida orden antes de crear
   */
  private validateOrderBeforeCreation(): void {
    if (!this.selectedDeliveryMethod) {
      throw new Error('Por favor, selecciona un método de entrega.');
    }

    if (!this.selectedPaymentMethod) {
      throw new Error('Por favor, selecciona un método de pago.');
    }

    if (this.selectedDeliveryMethod.requiresAddress) {
      if (!this.isAddressSelectedOrValid) {
        if (this.selectedAddressOption === 'new') {
          this.newAddressForm.markAllAsTouched();
        }
        throw new Error('Por favor, selecciona o completa una dirección válida.');
      }
    }
  }

  /**
   * Construye payload de orden
   */
  private buildOrderPayload(cart: ICart): ICreateOrderPayload {
    let orderPayload: ICreateOrderPayload = {
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPriceWithTax
      })),
      deliveryMethodId: this.selectedDeliveryMethod!.id,
      paymentMethodId: this.selectedPaymentMethod!,
      notes: `Pedido - ${this.selectedDeliveryMethod!.name}`,
      deliveryMethodCode: this.selectedDeliveryMethod!.code
    };

    // Agregar datos de dirección si es necesario
    if (this.selectedDeliveryMethod!.requiresAddress) {
      if (this.selectedAddressOption === 'existing' && this.selectedExistingAddressId) {
        orderPayload.selectedAddressId = this.selectedExistingAddressId;
      } else if (this.selectedAddressOption === 'new' && this.newAddressForm.valid) {
        const formValue = this.newAddressForm.value;
        orderPayload = {
          ...orderPayload,
          shippingRecipientName: formValue.recipientName,
          shippingPhone: formValue.phone,
          shippingStreetAddress: formValue.streetAddress,
          shippingPostalCode: formValue.postalCode || '',
          shippingNeighborhoodId: formValue.neighborhoodId,
          shippingAdditionalInfo: formValue.additionalInfo || ''
        };
      }
    }

    return orderPayload;
  }

  /**
   * Procesa la orden
   */
  private processOrder(orderPayload: ICreateOrderPayload): void {
    this.orderService.createOrder(orderPayload).pipe(
      tap((createdOrder) => {
        if (this.selectedPaymentMethod === 'cash') {
          this.notificationService.showSuccess('¡Pedido confirmado! Puedes pagarlo en efectivo.');
        } else {
          this.notificationService.showInfo('Procesando pago...');
        }
      }),
      switchMap(createdOrder => {
        if (!createdOrder?.id) {
          throw new Error('No se recibió ID de la orden.');
        }

        // Determinar si es efectivo o MercadoPago
        const selectedMethod = this.availablePaymentMethods.find(
          m => m._id === this.selectedPaymentMethod
        );

        if (selectedMethod?.code === 'CASH') {
          return of({ orderId: createdOrder.id, paymentType: 'cash' });
        }

        // Crear preferencia MercadoPago
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
        this.cartService.clearCart().subscribe();

        if (result.paymentType === 'cash') {
          this.handleCashPaymentSuccess(result.orderId);
        } else if (result.preference?.preference?.init_point) {
          this.navigateToPayment(result.preference.preference.init_point);
        }
      },
      error: (err) => this.handleOrderError(err)
    });
  }

  // Métodos auxiliares para el template
  isDeliveryMethodSelected(method: IDeliveryMethod): boolean {
    return this.selectedDeliveryMethod?.id === method.id;
  }

  get isAddressSelectedOrValid(): boolean {
    if (!this.selectedDeliveryMethod?.requiresAddress) return true;
    
    if (this.selectedAddressOption === 'existing') {
      return !!this.selectedExistingAddressId;
    }
    
    if (this.selectedAddressOption === 'new') {
      return this.newAddressForm.valid;
    }
    
    return false;
  }

  // Métodos de progreso
  getProgressPercentage(): number {
    let progress = 0;
    if (this.isStep1Complete()) progress += 25;
    if (this.isStep2Complete()) progress += 25;
    if (this.isStep3Complete()) progress += 25;
    if (this.canShowStep4()) progress += 25;
    return Math.min(progress, 100);
  }

  isStep1Complete(): boolean {
    return !!this.selectedDeliveryMethod;
  }

  isStep2Complete(): boolean {
    if (!this.selectedDeliveryMethod?.requiresAddress) return true;
    return this.isAddressSelectedOrValid;
  }

  isStep3Complete(): boolean {
    return !!this.selectedPaymentMethod && this.availablePaymentMethods.length > 0;
  }

  canShowStep2(): boolean {
    return this.isStep1Complete();
  }

  canShowStep3(): boolean {
    return this.isStep1Complete() && this.isStep2Complete();
  }

  canShowStep4(): boolean {
    return this.isStep1Complete() && this.isStep2Complete() && this.isStep3Complete();
  }

  // Métodos de utilidad
  getDeliveryMethodIcon(code: string): string {
    const iconMap: { [key: string]: string } = {
      'PICKUP': 'bi-shop',
      'DELIVERY': 'bi-truck',
      'EXPRESS': 'bi-lightning-charge'
    };
    return iconMap[code] || 'bi-box-seam';
  }

  getPaymentMethodIcon(code: string): string {
    const iconMap: { [key: string]: string } = {
      'CASH': 'bi-cash-coin',
      'MERCADO_PAGO': 'bi-credit-card',
      'CREDIT_CARD': 'bi-credit-card'
    };
    return iconMap[code] || 'bi-credit-card';
  }

  // Métodos de navegación y manejo de errores
  private handleCashPaymentSuccess(orderId: string): void {
    this.notificationService.showSuccess(
      '¡Pedido confirmado! Acércate al local para pagar en efectivo.',
      'Pago en Efectivo'
    );

    setTimeout(() => {
      this.router.navigate(['/'], {
        queryParams: { orderConfirmed: 'true', orderId, paymentType: 'cash' }
      });
    }, 3000);
  }

  private navigateToPayment(url: string): void {
    window.location.href = url;
  }

  private handleOrderError(err: any): void {
    let message = 'Ocurrió un error al procesar tu pedido.';

    if (err.status === 400) {
      message = 'Datos inválidos. Verifica la información.';
    } else if (err.status === 409) {
      message = 'Stock insuficiente para algunos productos.';
    } else if (err.status >= 500) {
      message = 'Error del servidor. Inténtalo nuevamente.';
    }

    this.notificationService.showError(message, 'Error en Pedido');
  }

  // Métodos de limpieza
  private cleanupSubscriptions(): void {
    // Limpiar subscripciones si las hay
  }

  // Métodos auxiliares para direcciones
  private loadUserAddresses(): void {
    this.isLoadingAddresses = true;
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        const defaultAddr = addresses.find(a => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressOption = 'existing';
          this.selectedExistingAddressId = defaultAddr.id;
        }
        this.isLoadingAddresses = false;
      },
      error: (err) => {
        console.error('Error cargando direcciones:', err);
        this.selectedAddressOption = 'new';
        this.loadCities();
        this.isLoadingAddresses = false;
      }
    });
  }

  private loadCities(): void {
    this.isLoadingCities = true;
    this.cityService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        this.isLoadingCities = false;
      },
      error: (err) => {
        console.error('Error cargando ciudades:', err);
        this.isLoadingCities = false;
      }
    });
  }

  private onCityChange(cityId: string): void {
    const neighborhoodControl = this.newAddressForm.get('neighborhoodId');
    neighborhoodControl?.reset();
    
    if (cityId) {
      this.loadNeighborhoods(cityId);
      neighborhoodControl?.enable();
    } else {
      this.neighborhoods = [];
      neighborhoodControl?.disable();
    }
  }

  private loadNeighborhoods(cityId: string): void {
    this.isLoadingNeighborhoods = true;
    this.neighborhoodService.getNeighborhoodsByCity(cityId).subscribe({
      next: (neighborhoods) => {
        this.neighborhoods = neighborhoods;
        this.isLoadingNeighborhoods = false;
      },
      error: (err) => {
        console.error('Error cargando barrios:', err);
        this.isLoadingNeighborhoods = false;
      }
    });
  }

  onAddressOptionChange(): void {
    if (this.selectedAddressOption === 'new' && this.cities.length === 0) {
      this.loadCities();
    }
    if (this.selectedAddressOption === 'new') {
      this.selectedExistingAddressId = null;
    }
  }

  onExistingAddressChange(): void {
    // Actualizar estado cuando cambia dirección existente
  }

  retryLoadDeliveryMethods(): void {
    this.loadDeliveryMethods();
  }

  private setFallbackPaymentMethods(method: IDeliveryMethod): void {
    if (method.code === 'PICKUP') {
      this.availablePaymentMethods = [
        {
          _id: 'fallback-cash',
          name: 'Pago en Efectivo',
          code: 'CASH',
          description: 'Paga en efectivo al retirar',
          isActive: true,
          requiresOnlinePayment: false,
          defaultOrderStatusId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } else {
      this.availablePaymentMethods = [];
    }
  }
}
```

---

## 🔗 Integración con Backend

### 🌐 Endpoints Requeridos

#### 1. Métodos de Entrega
```http
GET /api/delivery-methods
```
**Respuesta:**
```json
[
  {
    "id": "662ab638a9c878b4009af9dc",
    "code": "DELIVERY",
    "name": "Entrega a Domicilio",
    "description": "Recibe tu pedido en tu casa",
    "requiresAddress": true,
    "isActive": true
  },
  {
    "id": "662ab638a9c878b4009af9de",
    "code": "PICKUP",
    "name": "Retiro en Local",
    "description": "Retira tu pedido en nuestra tienda",
    "requiresAddress": false,
    "isActive": true
  }
]
```

#### 2. Métodos de Pago
```http
GET /api/payment-methods/active
```
**Respuesta:**
```json
[
  {
    "id": "pm_001",
    "code": "MERCADO_PAGO",
    "name": "Mercado Pago",
    "description": "Pago online con tarjeta o dinero en cuenta",
    "requiresOnlinePayment": true,
    "isActive": true
  },
  {
    "id": "pm_002",
    "code": "CASH",
    "name": "Efectivo",
    "description": "Pago en efectivo al retirar",
    "requiresOnlinePayment": false,
    "isActive": true
  }
]
```

#### 3. Crear Orden
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json
```
**Body (Usuario Registrado):**
```json
{
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "unitPrice": 100
    }
  ],
  "deliveryMethodId": "del_001",
  "paymentMethodId": "pm_001",
  "selectedAddressId": "addr_123",
  "notes": "Pedido desde checkout"
}
```

**Body (Usuario Invitado):**
```json
{
  "items": [
    {
      "productId": "prod_123",
      "quantity": 1,
      "unitPrice": 100
    }
  ],
  "deliveryMethodId": "del_001",
  "paymentMethodId": "pm_001",
  "shippingRecipientName": "Juan Pérez",
  "shippingPhone": "+54 11 1234-5678",
  "shippingStreetAddress": "Av. Corrientes 1234",
  "shippingNeighborhoodId": "neigh_123",
  "shippingAdditionalInfo": "Timbre A",
  "notes": "Pedido desde checkout"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "id": "order_456",
    "customer": {...},
    "items": [...],
    "status": {
      "code": "PENDING",
      "name": "Pendiente"
    },
    "total": 200,
    "deliveryMethod": {...},
    "paymentMethod": {...}
  }
}
```

#### 4. Crear Preferencia de Pago
```http
POST /api/payments/create-preference
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "orderId": "order_456"
}
```

**Respuesta:**
```json
{
  "success": true,
  "preference": {
    "id": "pref_789",
    "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_789",
    "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_789"
  }
}
```

---

## 🎨 Implementación de la UI

### 📱 Estructura del Template

El template está dividido en secciones principales:

1. **Header con Breadcrumb y Título**
2. **Indicador de Progreso Paso a Paso**
3. **Columna Principal (Pasos del Checkout)**
4. **Columna Lateral (Resumen del Pedido)**

### 🎯 Características de la UI

#### 1. Indicador de Progreso
- ✅ Círculos numerados con estados visual
- ✅ Barra de progreso dinámica
- ✅ Colores que indican el estado (gris, azul, verde)
- ✅ Texto descriptivo para cada paso

#### 2. Selección de Métodos de Entrega
- ✅ Cards clickeables con estados hover
- ✅ Iconos representativos
- ✅ Badges informativos (requiere dirección, etc.)
- ✅ Selección visual clara
- ✅ Manejo de estados de carga

#### 3. Formulario de Dirección
- ✅ Aparece dinámicamente si es necesario
- ✅ Opción entre dirección existente o nueva
- ✅ Formulario reactivo con validaciones
- ✅ Carga en cascada de ciudades y barrios
- ✅ Indicadores de carga

#### 4. Selección de Métodos de Pago
- ✅ Radio buttons estilizados
- ✅ Iconos específicos por método
- ✅ Filtrado dinámico según método de entrega
- ✅ Imagen de Mercado Pago

#### 5. Resumen del Pedido
- ✅ Sticky sidebar
- ✅ Detalle de productos
- ✅ Cálculo de totales
- ✅ Resumen de método y dirección
- ✅ Botón de confirmación con estados

---

## 🧪 Testing y Validación

### 🔍 Casos de Prueba

#### 1. Flujo Pickup + Efectivo
```typescript
describe('Pickup + Efectivo', () => {
  it('debe completar checkout sin requerir dirección', () => {
    // Seleccionar pickup
    // Seleccionar efectivo
    // Confirmar pedido
    // Verificar que no se pida dirección
  });
});
```

#### 2. Flujo Delivery + MercadoPago
```typescript
describe('Delivery + MercadoPago', () => {
  it('debe requerir dirección válida', () => {
    // Seleccionar delivery
    // Verificar que aparece sección de dirección
    // Intentar continuar sin dirección
    // Verificar error de validación
  });
});
```

#### 3. Usuario Registrado vs Invitado
```typescript
describe('Tipos de Usuario', () => {
  it('debe cargar direcciones para usuario registrado', () => {
    // Mockear usuario autenticado
    // Mockear direcciones
    // Verificar que aparecen opciones
  });
  
  it('debe mostrar formulario para invitado', () => {
    // Mockear usuario no autenticado
    // Verificar que aparece formulario
  });
});
```

### 🔧 Configuración de Testing

```typescript
// checkout-page.component.spec.ts
beforeEach(() => {
  TestBed.configureTestingModule({
    declarations: [CheckoutPageComponent],
    imports: [ReactiveFormsModule, HttpClientTestingModule],
    providers: [
      { provide: CartService, useValue: mockCartService },
      { provide: AuthService, useValue: mockAuthService },
      { provide: DeliveryMethodService, useValue: mockDeliveryMethodService },
      { provide: PaymentMethodService, useValue: mockPaymentMethodService },
      { provide: CheckoutStateService, useValue: mockCheckoutStateService },
      { provide: OrderService, useValue: mockOrderService },
      { provide: PaymentService, useValue: mockPaymentService }
    ]
  });
});
```

---

## 📈 Optimizaciones y Mejoras

### ⚡ Performance

1. **Lazy Loading**: Cargar componentes bajo demanda
2. **Caching**: Cache inteligente para métodos de entrega/pago
3. **OnPush Strategy**: Optimizar detección de cambios
4. **Debounce**: Para búsquedas y validaciones

### 🔒 Seguridad

1. **Validación Frontend + Backend**
2. **Sanitización de inputs**
3. **Tokens JWT con expiración**
4. **Rate limiting en requests**

### 🎯 UX/UI

1. **Loading States**: Indicadores para todas las operaciones
2. **Error Handling**: Mensajes claros y accionables
3. **Responsive Design**: Funciona en todos los dispositivos
4. **Accessibility**: Cumple estándares WCAG

---

## 🚀 Despliegue y Configuración

### 📦 Variables de Entorno

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-ecommerce.com',
  mercadoPagoPublicKey: 'APP_USR-xxxxx-xxxxx',
  enableCache: true,
  cacheExpirationTime: 300000, // 5 minutos
  maxRetries: 3,
  retryDelay: 1000
};
```

### 🛠️ Build y Deploy

```bash
# Instalar dependencias
npm install

# Ejecutar tests
npm run test

# Build para producción
npm run build --prod

# Verificar build
npm run build:analyze
```

---

## 📋 Checklist Final

### ✅ Implementación Completa

- [ ] **Modelos e Interfaces**
  - [ ] IDeliveryMethod
  - [ ] IPaymentMethod
  - [ ] ICreateOrderPayload
  - [ ] ShippingAddressOption

- [ ] **Servicios**
  - [ ] DeliveryMethodService
  - [ ] PaymentMethodService
  - [ ] CheckoutStateService

- [ ] **Componente**
  - [ ] CheckoutPageComponent
  - [ ] Template con todos los pasos
  - [ ] Validaciones y manejo de errores

- [ ] **Integración**
  - [ ] Endpoints de backend
  - [ ] Manejo de respuestas
  - [ ] Estados de error

- [ ] **Testing**
  - [ ] Tests unitarios
  - [ ] Tests de integración
  - [ ] E2E tests

- [ ] **Optimización**
  - [ ] Performance
  - [ ] Seguridad
  - [ ] Accesibilidad

---

## 🎯 Resultados Esperados

### Para el Usuario Final
- ✅ Experiencia de compra fluida e intuitiva
- ✅ Opciones claras de entrega y pago
- ✅ Feedback inmediato en cada paso
- ✅ Proceso rápido y sin fricciones

### Para el Negocio
- ✅ Reducción de carritos abandonados
- ✅ Flexibilidad en métodos de pago/entrega
- ✅ Automatización de procesos
- ✅ Mejor control de órdenes

### Para el Equipo de Desarrollo
- ✅ Código mantenible y escalable
- ✅ Arquitectura modular
- ✅ Fácil adición de nuevos métodos
- ✅ Testing completo y documentación

---

*📅 Documentación creada: Enero 2025*
*🔄 Última actualización: Enero 2025*
*📝 Versión: 1.0.0*
