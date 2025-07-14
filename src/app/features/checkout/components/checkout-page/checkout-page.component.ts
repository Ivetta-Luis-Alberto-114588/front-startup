// src/app/features/checkout/components/checkout-page/checkout-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, switchMap, tap, catchError, EMPTY, of, finalize, map } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { CartService } from 'src/app/features/cart/services/cart.service';
import { ICart } from 'src/app/features/cart/models/icart';
import { AddressService } from 'src/app/features/customers/services/address.service';
import { CityService } from 'src/app/features/customers/services/city.service';
import { NeighborhoodService } from 'src/app/features/customers/services/neighborhood.service';
import { IAddress } from 'src/app/features/customers/models/iaddress';
import { ICity } from 'src/app/features/customers/models/icity';
import { INeighborhood } from 'src/app/features/customers/models/ineighborhood';
import { OrderService } from 'src/app/features/orders/services/order.service';
import { PaymentService } from 'src/app/features/payments/services/payment.service';
import { ICreateOrderPayload } from 'src/app/features/orders/models/ICreateOrderPayload';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { OrderNotificationService } from 'src/app/features/orders/services/order-notification.service';
import { TelegramNotificationService } from 'src/app/shared/services/telegram-notification.service';
import { CheckoutStateService, ShippingAddressOption } from '../../services/checkout-state.service'; // Importa el servicio de estado
import { DeliveryMethodService } from 'src/app/shared/services/delivery-method.service';
import { PaymentMethodService } from 'src/app/shared/services/payment-method.service';
import { IDeliveryMethod } from 'src/app/shared/models/idelivery-method';
import { IPaymentMethod } from 'src/app/shared/models/ipayment-method';
// import { TelegramNotificationService } from 'src/app/shared/services/telegram-notification.service'; // Ya no necesario

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss']
})
export class CheckoutPageComponent implements OnInit, OnDestroy {

  cart$: Observable<ICart | null>;
  isAuthenticated$: Observable<boolean>;
  addresses: IAddress[] = [];
  cities: ICity[] = [];
  neighborhoods: INeighborhood[] = [];

  // Propiedades para métodos de entrega
  availableDeliveryMethods: IDeliveryMethod[] = [];
  selectedDeliveryMethod: IDeliveryMethod | null = null;
  isLoadingDeliveryMethods = false;

  // Propiedades para métodos de pago
  availablePaymentMethods: IPaymentMethod[] = [];
  selectedPaymentMethod: string | null = null;

  // Estados derivados del CheckoutStateService
  shouldShowAddressSection$ = this.checkoutStateService.shouldShowAddressSection$;
  isCheckoutValid$ = this.checkoutStateService.isCheckoutValid$;

  selectedAddressOption: 'existing' | 'new' | null = null;
  selectedExistingAddressId: string | null = null;
  newAddressForm: FormGroup;

  isLoadingAddresses = false;
  isLoadingCities = false;
  isLoadingNeighborhoods = false;
  isProcessingOrder = false; // Para el botón final

  private cartSubscription: Subscription | null = null;
  private addressSubscription: Subscription | null = null;
  private citySubscription: Subscription | null = null;
  private neighborhoodSubscription: Subscription | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private addressService: AddressService,
    private cityService: CityService,
    private neighborhoodService: NeighborhoodService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private checkoutStateService: CheckoutStateService, // Inyecta el servicio de estado
    private deliveryMethodService: DeliveryMethodService, // Nuevo servicio
    private paymentMethodService: PaymentMethodService, // Nuevo servicio para métodos de pago
    private fb: FormBuilder,
    private router: Router,
    private orderNotificationService: OrderNotificationService,
    private telegramNotificationService: TelegramNotificationService
  ) {
    this.cart$ = this.cartService.cart$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;

    // Inicializar formulario de nueva dirección
    this.newAddressForm = this.fb.group({
      recipientName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]{8,15}$/)]],
      streetAddress: ['', Validators.required],
      postalCode: [''],
      cityId: [null, Validators.required], // Empezar con null
      neighborhoodId: [{ value: null, disabled: true }, Validators.required], // Empezar deshabilitado
      additionalInfo: [''],
      alias: [''],
      // No incluimos isDefault aquí, se maneja al guardar si es necesario
    });
  }

  ngOnInit(): void {
    // Cargar métodos de entrega disponibles
    this.loadDeliveryMethods();

    // Redirigir si el carrito está vacío
    this.cartSubscription = this.cart$.subscribe(cart => {
      if (!cart || cart.items.length === 0) {
        this.notificationService.showWarning('Tu carrito está vacío.', 'Checkout');
        this.router.navigate(['/cart']);
      }
    });

    // Cargar direcciones si el usuario está autenticado
    this.authService.isAuthenticated$.pipe(
      tap(isAuth => {
        if (isAuth) {
          this.loadUserAddresses();
        } else {
          this.selectedAddressOption = 'new'; // Invitado siempre usa nueva dirección
          this.loadCities(); // Cargar ciudades para el formulario de invitado
        }
      })
    ).subscribe();

    // Escuchar cambios en la ciudad seleccionada para cargar barrios
    this.newAddressForm.get('cityId')?.valueChanges.subscribe(cityId => {
      const neighborhoodControl = this.newAddressForm.get('neighborhoodId');
      neighborhoodControl?.reset(); // Limpiar barrio anterior
      if (cityId) {
        this.loadNeighborhoods(cityId);
        neighborhoodControl?.enable();
      } else {
        this.neighborhoods = [];
        neighborhoodControl?.disable();
      }
    });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.addressSubscription?.unsubscribe();
    this.citySubscription?.unsubscribe();
    this.neighborhoodSubscription?.unsubscribe();
  }

  loadUserAddresses(): void {
    this.isLoadingAddresses = true;
    this.addressSubscription = this.addressService.getAddresses().pipe(
      finalize(() => this.isLoadingAddresses = false)
    ).subscribe({
      next: (addrs) => {
        this.addresses = addrs;
        // Preseleccionar la dirección default si existe
        const defaultAddr = addrs.find(a => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressOption = 'existing';
          this.selectedExistingAddressId = defaultAddr.id;
          this.updateCheckoutState(); // Actualizar estado
        } else if (addrs.length > 0) {
          // Opcional: preseleccionar la primera si no hay default
          // this.selectedAddressOption = 'existing';
          // this.selectedExistingAddressId = addrs[0].id;
          // this.updateCheckoutState();
        } else {
          // Si no tiene direcciones, forzar nueva dirección
          this.selectedAddressOption = 'new';
          this.loadCities(); // Cargar ciudades para el formulario
          this.updateCheckoutState();
        }
      },
      error: (err) => {
        this.notificationService.showError('No se pudieron cargar tus direcciones.', 'Error');
        this.selectedAddressOption = 'new'; // Permitir ingresar nueva si falla la carga
        this.loadCities();
      }
    });
  }

  loadCities(): void {
    this.isLoadingCities = true;
    this.citySubscription = this.cityService.getCities().pipe(
      finalize(() => this.isLoadingCities = false)
    ).subscribe({
      next: (cities) => this.cities = cities,
      error: (err) => this.notificationService.showError('No se pudieron cargar las ciudades.', 'Error')
    });
  }

  loadNeighborhoods(cityId: string): void {
    this.isLoadingNeighborhoods = true;
    this.newAddressForm.get('neighborhoodId')?.disable(); // Deshabilitar mientras carga
    this.neighborhoodSubscription = this.neighborhoodService.getNeighborhoodsByCity(cityId).pipe(
      finalize(() => {
        this.isLoadingNeighborhoods = false;
        this.newAddressForm.get('neighborhoodId')?.enable(); // Habilitar al terminar
      })
    ).subscribe({
      next: (neighborhoods) => this.neighborhoods = neighborhoods,
      error: (err) => this.notificationService.showError('No se pudieron cargar los barrios.', 'Error')
    });
  }

  onAddressOptionChange(): void {
    // Si cambia a 'new', cargar ciudades si no están cargadas
    if (this.selectedAddressOption === 'new' && this.cities.length === 0) {
      this.loadCities();
    }
    // Limpiar selección existente si cambia a 'new'
    if (this.selectedAddressOption === 'new') {
      this.selectedExistingAddressId = null;
    }
    this.updateCheckoutSteps(); // Actualizar estado de los pasos
  }

  onExistingAddressChange(): void {
    this.updateCheckoutSteps(); // Actualizar estado de los pasos
  }

  // Método para actualizar el estado del checkout
  updateCheckoutState(): void {
    if (this.selectedAddressOption === 'existing' && this.selectedExistingAddressId) {
      const selectedAddress = this.addresses.find(a => a.id === this.selectedExistingAddressId);
      if (selectedAddress) {
        this.checkoutStateService.setSelectedShippingAddress({ type: 'existing', address: selectedAddress });
      } else {
        this.checkoutStateService.setSelectedShippingAddress(null); // Dirección no encontrada
      }
    } else if (this.selectedAddressOption === 'new') {
      // Podríamos guardar los datos del formulario aquí si fuera multi-paso,
      // pero para página única, los leeremos al confirmar.
      // Por ahora, solo indicamos que es 'new'.
      this.checkoutStateService.setSelectedShippingAddress({ type: 'new', addressData: null }); // O null temporalmente
    } else {
      this.checkoutStateService.setSelectedShippingAddress(null); // Ninguna opción seleccionada
    }
  }

  // Helper para saber si la dirección está lista para confirmar
  get isAddressSelectedOrValid(): boolean {
    // Si el método de entrega no requiere dirección, siempre es válido
    if (!this.selectedDeliveryMethod?.requiresAddress) {
      return true;
    }

    if (this.selectedAddressOption === 'existing') {
      return !!this.selectedExistingAddressId;
    }
    if (this.selectedAddressOption === 'new') {
      return this.newAddressForm.valid;
    }
    return false;
  }

  // Lógica final para confirmar y pagar
  confirmOrder(): void {
    try {
      // Validaciones usando el nuevo servicio mejorado
      this.validateOrderBeforeCreation();

      // Validación extra: asegurar que el método de pago es válido para el método de entrega
      if (this.selectedDeliveryMethod && this.selectedPaymentMethod) {
        const validPaymentIds = this.availablePaymentMethods.map(m => m._id);
        if (!validPaymentIds.includes(this.selectedPaymentMethod)) {
          this.notificationService.showWarning('El método de pago seleccionado no es válido para la forma de entrega elegida.', 'Validación');
          return;
        }
      }

      this.isProcessingOrder = true;
      const cart = this.cartService.getCurrentCartValue();

      if (!cart || cart.items.length === 0) {
        this.notificationService.showError('Tu carrito está vacío.');
        this.isProcessingOrder = false;
        this.router.navigate(['/cart']);
        return;
      }

      // Construir el payload con las mejoras del servicio
      const orderPayload = this.buildOrderPayload(cart);

      // Crear la orden con las validaciones integradas
      this.processOrder(orderPayload);

    } catch (error: any) {
      this.notificationService.showWarning(error.message || 'Error en la validación del pedido.');
      this.isProcessingOrder = false;
    }
  }

  /**
   * Validaciones específicas antes de crear la orden
   */
  private validateOrderBeforeCreation(): void {
    // Validar método de entrega
    if (!this.selectedDeliveryMethod) {
      throw new Error('Por favor, selecciona un método de entrega.');
    }

    // Validar método de pago
    if (!this.selectedPaymentMethod) {
      throw new Error('Por favor, selecciona un método de pago.');
    }

    // Validar dirección solo si el método requiere dirección
    if (this.selectedDeliveryMethod.requiresAddress) {
      if (!this.isAddressSelectedOrValid) {
        // Solo marcar el formulario como touched si realmente se requiere dirección
        if (this.selectedAddressOption === 'new') {
          this.newAddressForm.markAllAsTouched(); // Mostrar errores del formulario
        }
        throw new Error('Por favor, selecciona o completa una dirección de envío válida.');
      }
    }

    // Validar que no esté ya procesando
    if (this.isProcessingOrder) {
      throw new Error('Ya se está procesando tu pedido.');
    }
  }

  /**
   * Construye el payload adaptado según el método de entrega
   */
  private buildOrderPayload(cart: ICart): ICreateOrderPayload {
    console.log('🔍 Building order payload...');
    console.log('Selected delivery method:', this.selectedDeliveryMethod);
    console.log('Selected payment method:', this.selectedPaymentMethod);

    if (!this.selectedDeliveryMethod) {
      throw new Error('No se ha seleccionado un método de entrega');
    }

    if (!this.selectedPaymentMethod) {
      throw new Error('No se ha seleccionado un método de pago');
    }

    let orderPayload: ICreateOrderPayload = {
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPriceWithTax
      })),
      deliveryMethodId: this.selectedDeliveryMethod.id,
      // ¡AGREGAR EL PAYMENT METHOD ID!
      paymentMethodId: this.selectedPaymentMethod,
      notes: `Pedido realizado desde el checkout - Método: ${this.selectedDeliveryMethod.name}`,
      // Agregar el código del método para facilitar la validación en el backend
      deliveryMethodCode: this.selectedDeliveryMethod.code
    };

    console.log('Base payload:', orderPayload);

    // Añadir datos de dirección SOLO si el método de entrega lo requiere
    if (this.selectedDeliveryMethod.requiresAddress) {
      console.log('📍 Delivery method requires address');
      if (this.selectedAddressOption === 'existing' && this.selectedExistingAddressId) {
        orderPayload.selectedAddressId = this.selectedExistingAddressId;
        console.log('Using existing address:', this.selectedExistingAddressId);
      } else if (this.selectedAddressOption === 'new' && this.newAddressForm.valid) {
        const formValue = this.newAddressForm.value;
        console.log('Using new address form:', formValue);
        orderPayload = {
          ...orderPayload,
          shippingRecipientName: formValue.recipientName,
          shippingPhone: formValue.phone,
          shippingStreetAddress: formValue.streetAddress,
          shippingPostalCode: formValue.postalCode || '',
          shippingNeighborhoodId: formValue.neighborhoodId,
          shippingAdditionalInfo: formValue.additionalInfo || ''
        };

        // Para invitados, agregar datos del cliente si no está autenticado
        // NOTA: Esto se maneja de forma síncrona ahora
        // En una implementación real, necesitarías verificar el estado de autenticación primero
        // orderPayload.customerName = formValue.recipientName;
        // orderPayload.customerEmail = 'guest@checkout.com'; // Temporal - necesitarías campo email
      }
    } else {
      console.log('🏪 Delivery method does NOT require address (pickup)');
    }

    // Validación adicional para debugging
    console.log('Final payload validation:');
    console.log('- Has items?', orderPayload.items?.length > 0);
    console.log('- Has deliveryMethodId?', !!orderPayload.deliveryMethodId);
    console.log('- Has deliveryMethodCode?', !!orderPayload.deliveryMethodCode);
    console.log('- Has paymentMethodId?', !!orderPayload.paymentMethodId);
    console.log('- RequiresAddress?', this.selectedDeliveryMethod.requiresAddress);
    console.log('- Has shipping data?', !!(orderPayload.selectedAddressId || orderPayload.shippingRecipientName));

    console.log('Final payload to send:', orderPayload);
    return orderPayload;
  }

  /**
   * Procesa la orden con manejo de errores mejorado
   */
  private processOrder(orderPayload: ICreateOrderPayload): void {
    // Buscar el método de pago seleccionado y obtener su code
    const selectedPayment = this.availablePaymentMethods.find(m => m._id === this.selectedPaymentMethod);
    const selectedPaymentCode = selectedPayment?.code?.toUpperCase() || '';

    this.orderService.createOrder(orderPayload).pipe(
      tap((createdOrder) => {
        console.log('✅ Orden creada exitosamente con método:', this.selectedDeliveryMethod?.name);

        // Mostrar mensaje según el tipo de pago
        if (selectedPaymentCode === 'CASH') {
          this.notificationService.showSuccess('¡Pedido confirmado! Puedes retirarlo y pagar en efectivo.', 'Orden Creada');
        } else {
          this.notificationService.showInfo('Procesando pago...', 'Orden Creada');
        }
      }),
      // Decidir si crear preferencia de pago o finalizar directamente
      switchMap(createdOrder => {
        if (!createdOrder?.id) {
          throw new Error('No se recibió ID de la orden creada.');
        }

        // Si es pago en efectivo, no crear preferencia de pago
        if (selectedPaymentCode === 'CASH') {
          return of({ orderId: createdOrder.id, paymentType: 'cash' });
        }

        // Si es Mercado Pago, crear preferencia de pago
        if (selectedPaymentCode === 'MERCADO_PAGO') {
          return this.paymentService.createPaymentPreference(createdOrder.id).pipe(
            map((preference: any) => ({ orderId: createdOrder.id, paymentType: 'mercado_pago', preference }))
          );
        }

        // Si el método de pago no es soportado, finalizar con éxito simple
        return of({ orderId: createdOrder.id, paymentType: selectedPaymentCode.toLowerCase() });
      }),
      catchError(err => {
        this.handleOrderError(err);
        return EMPTY;
      }),
      finalize(() => this.isProcessingOrder = false)
    ).subscribe({
      next: (result: any) => {
        console.log('✅ Resultado del procesamiento:', result);

        // Limpiar carrito en ambos casos
        this.cartService.clearCart().subscribe({
          next: () => {
            console.log('✅ Carrito limpiado exitosamente');

            if (result.paymentType === 'cash') {
              // Para pago en efectivo, redirigir a una página de confirmación
              this.handleCashPaymentSuccess(result.orderId);
            } else if (result.paymentType === 'mercado_pago') {
              if (result.preference?.preference?.init_point) {
                // Para Mercado Pago, redirigir al pago
                this.navigateToPayment(result.preference.preference.init_point);
              } else {
                // Error: no se pudo obtener el init_point para Mercado Pago
                this.notificationService.showError('No se pudo inicializar el pago. Inténtalo nuevamente.', 'Error de Pago');
                this.isProcessingOrder = false;
              }
            } else {
              this.notificationService.showSuccess('¡Pedido confirmado!', 'Orden Creada');
            }
          },
          error: (err) => {
            console.warn('⚠️ Error al limpiar carrito:', err);
            // Continuar según el tipo de pago
            if (result.paymentType === 'cash') {
              this.handleCashPaymentSuccess(result.orderId);
            } else if (result.paymentType === 'mercado_pago') {
              if (result.preference?.preference?.init_point) {
                this.navigateToPayment(result.preference.preference.init_point);
              } else {
                this.notificationService.showError('No se pudo inicializar el pago. Inténtalo nuevamente.', 'Error de Pago');
                this.isProcessingOrder = false;
              }
            }
          }
        });
      },
      error: (err) => {
        console.error('❌ Error final en processOrder:', err);
        this.handleOrderError(err);
      }
    });
  }

  /**
   * Maneja errores específicos en la creación de órdenes
   */
  private handleOrderError(err: any): void {
    console.error('❌ Error al procesar orden:', err);

    let message = 'Ocurrió un error al procesar tu pedido.';

    // Manejo de errores específicos
    if (err.status === 400) {
      message = err.error?.message || 'Datos del pedido inválidos. Verifica la información.';
    } else if (err.status === 404) {
      message = 'Algunos productos ya no están disponibles.';
    } else if (err.status === 409) {
      message = 'Stock insuficiente para algunos productos.';
    } else if (err.status >= 500) {
      message = 'Error del servidor. Inténtalo nuevamente en unos minutos.';
    } else if (err.message?.includes('Network')) {
      message = 'Error de conexión. Verifica tu conexión a internet.';
    }

    this.notificationService.showError(message, 'Error en Pedido');
  }

  // ===========================================
  // MÉTODOS PARA DELIVERY METHODS
  // ===========================================

  /**
   * Carga los métodos de entrega disponibles desde el servidor
   */
  private loadDeliveryMethods(): void {
    this.isLoadingDeliveryMethods = true;

    this.deliveryMethodService.getActiveDeliveryMethods().subscribe({
      next: (methodsRaw) => {
        const methods: IDeliveryMethod[] = Array.isArray(methodsRaw) ? methodsRaw : [];
        this.availableDeliveryMethods = methods;
        this.checkoutStateService.setAvailableDeliveryMethods(methods);
        this.isLoadingDeliveryMethods = false;

        // Si solo hay un método disponible, seleccionarlo automáticamente
        if (methods.length === 1) {
          this.selectDeliveryMethod(methods[0]);
        }
      },
      error: (error) => {
        console.error('Error loading delivery methods:', error);
        this.notificationService.showError(
          'No se pudieron cargar los métodos de entrega. Por favor, recarga la página.',
          'Error'
        );
        this.availableDeliveryMethods = [];
        this.isLoadingDeliveryMethods = false;
      }
    });
  }

  /**
   * Selecciona un método de entrega
   */
  selectDeliveryMethod(method: IDeliveryMethod): void {
    this.selectedDeliveryMethod = method;
    this.checkoutStateService.setSelectedDeliveryMethod(method);

    // Actualizar métodos de pago disponibles basados en el método de entrega
    this.updateAvailablePaymentMethods(method);

    // Si el método no requiere dirección, limpiar la selección de dirección y errores
    if (!method.requiresAddress) {
      this.selectedAddressOption = null;
      this.selectedExistingAddressId = null;
      this.newAddressForm.reset();
      // Limpiar cualquier estado de error del formulario
      Object.keys(this.newAddressForm.controls).forEach(key => {
        this.newAddressForm.get(key)?.setErrors(null);
      });
    } else {
      // Si requiere dirección y es un usuario autenticado, mostrar opciones
      this.authService.isAuthenticated$.pipe(
        tap(isAuth => {
          if (isAuth && this.addresses.length > 0) {
            // Si tiene direcciones guardadas, no seleccionar automáticamente
            if (!this.selectedAddressOption) {
              // No seleccionar nada por defecto para que el usuario elija
            }
          } else {
            // Usuario invitado o sin direcciones, usar nueva dirección
            this.selectedAddressOption = 'new';
            this.loadCities(); // Cargar ciudades para el formulario
          }
        })
      ).subscribe();
    }

    // Actualizar estado de los pasos
    this.updateCheckoutSteps();
  }

  /**
   * Actualiza los métodos de pago disponibles basados en el método de entrega seleccionado
   */
  updateAvailablePaymentMethods(method: IDeliveryMethod): void {
    // Resetear selección de pago anterior
    this.selectedPaymentMethod = null;
    this.checkoutStateService.setSelectedPaymentMethodId(null);

    // Obtener métodos de pago reales del backend
    this.paymentMethodService.getActivePaymentMethods().subscribe({
      next: (allPaymentMethods) => {
        console.log('🔍 Todos los métodos de pago obtenidos:', allPaymentMethods);

        // Filtrar métodos según el tipo de entrega
        this.availablePaymentMethods = this.paymentMethodService.filterPaymentMethodsByDelivery(
          allPaymentMethods,
          method.code
        );

        console.log('🔍 Métodos de pago filtrados para', method.code, ':', this.availablePaymentMethods);

        // Debug: verificar estructura de los métodos de pago
        if (this.availablePaymentMethods.length > 0) {
          console.log('🔍 Primer método de pago:', this.availablePaymentMethods[0]);
          console.log('🔍 ID del primer método:', this.availablePaymentMethods[0]._id);
          console.log('🔍 Estructura completa:', JSON.stringify(this.availablePaymentMethods[0], null, 2));
        }

        // Si solo hay un método disponible, seleccionarlo automáticamente
        if (this.availablePaymentMethods.length === 1) {
          this.selectedPaymentMethod = this.availablePaymentMethods[0]._id;
          this.checkoutStateService.setSelectedPaymentMethodId(this.availablePaymentMethods[0]._id);
          console.log('✅ Método de pago seleccionado automáticamente:', this.availablePaymentMethods[0]._id);
        }
      },
      error: (error) => {
        console.error('❌ Error al obtener métodos de pago:', error);
        // Fallback: usar métodos hardcodeados temporalmente
        this.setFallbackPaymentMethods(method);
      }
    });
  }

  /**
   * Métodos de pago de respaldo en caso de error del backend
   */
  private setFallbackPaymentMethods(method: IDeliveryMethod): void {
    console.warn('⚠️ Usando métodos de pago de respaldo');

    if (method.code === 'PICKUP' || method.code === 'pickup' || method.code === 'local-pickup' || method.name.toLowerCase().includes('retiro')) {
      // Para retiro en local: incluir efectivo como opción temporal
      this.availablePaymentMethods = [
        {
          _id: 'fallback-cash', // ID temporal - será reemplazado por ID real del backend
          name: 'Pago en Efectivo',
          code: 'CASH',
          description: 'Paga en efectivo al retirar tu pedido',
          isActive: true,
          defaultOrderStatusId: '',
          requiresOnlinePayment: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } else {
      // Para delivery: mostrar error, no métodos disponibles
      this.availablePaymentMethods = [];
      this.notificationService.showError('No se pudieron cargar los métodos de pago. Por favor, recarga la página.');
    }
  }

  /**
   * Selecciona un método de pago
   */
  selectPaymentMethod(methodId: string): void {
    console.log('🔍 selectPaymentMethod llamado con:', methodId, typeof methodId);
    this.selectedPaymentMethod = methodId;
    // Notificar al CheckoutStateService para la validación global
    this.checkoutStateService.setSelectedPaymentMethodId(methodId);
    console.log('✅ Método de pago seleccionado:', methodId);
  }

  /**
   * Verifica si un método de entrega está seleccionado
   */
  isDeliveryMethodSelected(method: IDeliveryMethod): boolean {
    return this.selectedDeliveryMethod?.id === method.id;
  }

  /**
   * Reintenta cargar los métodos de entrega en caso de error
   */
  retryLoadDeliveryMethods(): void {
    this.loadDeliveryMethods();
  }

  /**
   * Obtiene el icono de Bootstrap correspondiente al código del método de entrega
   */
  getDeliveryMethodIcon(code: string): string {
    const iconMap: { [key: string]: string } = {
      'SHIPPING': 'bi-truck',
      'PICKUP': 'bi-shop',
      'EXPRESS': 'bi-lightning-charge',
      'SCHEDULED': 'bi-calendar-check'
    };
    return iconMap[code] || 'bi-box-seam';
  }

  /**
   * Obtiene el icono apropiado para un método de pago según su código
   */
  getPaymentMethodIcon(code: string): string {
    switch (code?.toUpperCase()) {
      case 'CASH':
        return 'bi-cash-coin';
      case 'CREDIT_CARD':
        return 'bi-credit-card';
      case 'DEBIT_CARD':
        return 'bi-credit-card-2-front';
      case 'BANK_TRANSFER':
        return 'bi-bank';
      case 'MERCADO_PAGO':
        return 'bi-credit-card';
      default:
        return 'bi-credit-card';
    }
  }

  /**
   * Calcula el porcentaje de progreso del checkout
   */
  getProgressPercentage(): number {
    let progress = 0;

    // Paso 1: Método de entrega seleccionado (25%)
    if (this.isStep1Complete()) {
      progress += 25;
    }

    // Paso 2: Dirección completa si es requerida (25%)
    if (this.isStep2Complete()) {
      progress += 25;
    }

    // Paso 3: Método de pago (25%)
    if (this.isStep3Complete()) {
      progress += 25;
    }

    // Paso 4: Todo listo para confirmar (25%)
    if (this.canShowStep4()) {
      progress += 25;
    }

    return Math.min(progress, 100);
  }

  /**
   * Verifica si el paso 1 (método de entrega) está completo
   */
  isStep1Complete(): boolean {
    return !!this.selectedDeliveryMethod;
  }

  /**
   * Verifica si el paso 2 (dirección) está completo o no es requerido
   */
  isStep2Complete(): boolean {
    if (!this.selectedDeliveryMethod?.requiresAddress) {
      return true; // No requiere dirección, paso completado automáticamente
    }

    if (this.selectedAddressOption === 'existing') {
      return !!this.selectedExistingAddressId;
    }

    if (this.selectedAddressOption === 'new') {
      return this.newAddressForm.valid;
    }

    return false;
  }

  /**
   * Verifica si el paso 3 (método de pago) está completo
   */
  isStep3Complete(): boolean {
    return !!this.selectedPaymentMethod && this.availablePaymentMethods.length > 0;
  }

  /**
   * Verifica si se puede mostrar el paso 2 (dirección)
   */
  canShowStep2(): boolean {
    return this.isStep1Complete();
  }

  /**
   * Verifica si se puede mostrar el paso 3 (método de pago)
   */
  canShowStep3(): boolean {
    return this.isStep1Complete() && this.isStep2Complete();
  }

  /**
   * Verifica si se puede mostrar el paso 4 (confirmación)
   */
  canShowStep4(): boolean {
    return this.isStep1Complete() && this.isStep2Complete() && this.isStep3Complete();
  }

  /**
   * Actualiza el estado del checkout cuando se hacen cambios
   */
  private updateCheckoutSteps(): void {
    // Actualizar el estado global del checkout
    this.updateCheckoutState();
  }

  /**
   * Maneja el éxito de un pago en efectivo
   */
  private handleCashPaymentSuccess(orderId: string): void {
    // Mostrar mensaje de éxito breve
    this.notificationService.showSuccess(
      '¡Pedido confirmado exitosamente! Acércate al local para retirar y pagar en efectivo.',
      'Pago en Efectivo'
    );

    // Enviar notificación por mail y telegram antes de redirigir
    // 1. Notificación por mail (OrderNotificationService)
    // 2. Notificación por Telegram (TelegramNotificationService)
    // Se puede mejorar con forkJoin si ambas devuelven Observable

    // Obtener datos mínimos para la notificación
    const orderIdStr = orderId?.toString();
    // Obtener el carrito actual
    const cart = this.cartService.getCurrentCartValue();
    const customerName = cart?.user?.name || '';
    const customerEmail = cart?.user?.email || '';
    const total = cart?.total || 0;
    const items = (cart?.items || []).map(item => ({
      name: item.product?.name || '',
      quantity: item.quantity,
      price: item.unitPriceWithTax || item.priceAtTime || 0
    }));

    // Construir el payload para el nuevo endpoint manual
    const subject = `Nueva orden en efectivo #${orderIdStr}`;
    // Mensaje de texto plano para Telegram y email
    const plainMessage = `🛒 Nueva orden en efectivo\nID: ${orderIdStr}\nCliente: ${customerName}\nEmail: ${customerEmail}\nTotal: $${total}\nItems: ${items.map(i => `${i.quantity} x ${i.name}`).join(', ')}`;
    const payload = {
      subject,
      message: plainMessage,
      emailTo: customerEmail,
      telegramChatId: '736207422' // chatId por defecto según logs backend
    };

    // Enviar la notificación manual y también por Telegram directo
    this.orderNotificationService.sendManualNotification(payload).subscribe({
      next: () => {
        // Además, enviar por Telegram directo (requiere token admin en localStorage)
        this.telegramNotificationService.sendMessage(plainMessage)
          .finally(() => {
            setTimeout(() => {
              this.router.navigate(['/my-orders', orderIdStr]);
            }, 2000);
          });
      },
      error: () => {
        // Igual intentar Telegram aunque falle la manual
        this.telegramNotificationService.sendMessage(plainMessage)
          .finally(() => {
            setTimeout(() => {
              this.router.navigate(['/my-orders', orderIdStr]);
            }, 2000);
          });
      }
    });
  }

  // Método separado para navegación - fácil de mockear en tests
  private navigateToPayment(url: string): void {
    window.location.href = url;
  }
}