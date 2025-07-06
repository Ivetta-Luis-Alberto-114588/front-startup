// src/app/features/checkout/components/checkout-page/checkout-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, switchMap, tap, catchError, EMPTY, of, finalize } from 'rxjs';
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
import { CheckoutStateService, ShippingAddressOption } from '../../services/checkout-state.service'; // Importa el servicio de estado
import { DeliveryMethodService } from 'src/app/shared/services/delivery-method.service';
import { IDeliveryMethod } from 'src/app/shared/models/idelivery-method';
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
    private fb: FormBuilder,
    private router: Router
    // private telegramNotificationService: TelegramNotificationService // Ya no necesario
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
    this.updateCheckoutState(); // Actualizar estado al cambiar opción
  }

  onExistingAddressChange(): void {
    this.updateCheckoutState(); // Actualizar estado al seleccionar dirección existente
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
    // Validar que se haya seleccionado un método de entrega
    if (!this.selectedDeliveryMethod) {
      this.notificationService.showWarning('Por favor, selecciona un método de entrega.');
      return;
    }

    // Validar dirección solo si el método requiere dirección
    if (this.selectedDeliveryMethod.requiresAddress && (!this.isAddressSelectedOrValid || this.isProcessingOrder)) {
      this.notificationService.showWarning('Por favor, selecciona o completa una dirección de envío válida.');
      this.newAddressForm.markAllAsTouched(); // Mostrar errores del formulario si es 'new'
      return;
    }

    this.isProcessingOrder = true;
    const cart = this.cartService.getCurrentCartValue(); // Obtener carrito actual

    if (!cart || cart.items.length === 0) {
      this.notificationService.showError('Tu carrito está vacío.');
      this.isProcessingOrder = false;
      this.router.navigate(['/cart']);
      return;
    }

    // Construir el payload para la API de creación de orden
    let orderPayload: ICreateOrderPayload = {
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPriceWithTax // Enviar precio CON IVA como unitPrice
      })),
      deliveryMethod: this.selectedDeliveryMethod.id, // Usar el método seleccionado
      // Añadir couponCode si se implementa
    };

    // Añadir datos de dirección al payload SOLO si el método de entrega lo requiere
    if (this.selectedDeliveryMethod.requiresAddress) {
      if (this.selectedAddressOption === 'existing') {
        orderPayload.selectedAddressId = this.selectedExistingAddressId;
      } else if (this.selectedAddressOption === 'new') {
        const formValue = this.newAddressForm.value;
        orderPayload = {
          ...orderPayload,
          shippingRecipientName: formValue.recipientName,
          shippingPhone: formValue.phone,
          shippingStreetAddress: formValue.streetAddress,
          shippingPostalCode: formValue.postalCode,
          shippingNeighborhoodId: formValue.neighborhoodId,
          // shippingCityId: formValue.cityId, // El backend lo deriva del barrio
          shippingAdditionalInfo: formValue.additionalInfo,
          // Si es invitado, añadir customerName y customerEmail (necesitarías campos extra en el form)
        };
      }
    }

    // 1. Crear la orden
    this.orderService.createOrder(orderPayload).pipe(
      tap(() => this.notificationService.showInfo('Procesando pago...', 'Orden Creada')),
      // 2. Si la orden se crea, crear la preferencia de pago
      switchMap(createdOrder => {
        if (!createdOrder || !createdOrder.id) {
          throw new Error('No se recibió ID de la orden creada.');
        }


        //enviar notificación a Telegram
        // this.telegramNotificationService.sendMessage("checkout-page.component.ts --> " + JSON.stringify({ text: createdOrder, parse_mode: 'HTML' }))


        return this.paymentService.createPaymentPreference(createdOrder.id);
      }),
      catchError(err => {
        const message = err.error?.error || err.message || 'Ocurrió un error al procesar tu pedido.';
        this.notificationService.showError(message, 'Error');
        this.isProcessingOrder = false;
        return EMPTY; // Detener el flujo
      }),
      finalize(() => this.isProcessingOrder = false) // Asegurar que el flag se resetea
    ).subscribe({
      next: (preference) => {


        // ✅ NOTIFICACIÓN ELIMINADA - Ahora se envía desde el backend cuando el pago es aprobado
        // una vez que se creo la orden
        // this.telegramNotificationService.sendMessage('[checkout-page.component.ts] Preferencia de pago creada:' + JSON.stringify({ text: preference, parse_mode: 'HTML' }))



        if (preference?.preference?.init_point) {
          // 3. Redirigir a Mercado Pago
          this.notificationService.showSuccess('Redirigiendo a Mercado Pago...');
          // IMPORTANTE: NO limpiar el carrito aquí - se limpiará solo cuando el pago sea exitoso
          this.navigateToPayment(preference.preference.init_point);
        } else {
          this.notificationService.showError('No se pudo iniciar el proceso de pago.', 'Error');
        }
      }
      // El error ya se maneja en catchError
    });
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
      next: (methods) => {
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

    // Si el método no requiere dirección, limpiar la selección de dirección
    if (!method.requiresAddress) {
      this.selectedAddressOption = null;
      this.selectedExistingAddressId = null;
      this.newAddressForm.reset();
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
   * Calcula el porcentaje de progreso del checkout
   */
  getProgressPercentage(): number {
    let progress = 0;

    // Paso 1: Método de entrega seleccionado (33%)
    if (this.selectedDeliveryMethod) {
      progress += 33;
    }

    // Paso 2: Dirección completa si es requerida (33%)
    if (!this.selectedDeliveryMethod?.requiresAddress ||
      (this.selectedAddressOption === 'existing' && this.selectedExistingAddressId) ||
      (this.selectedAddressOption === 'new' && this.newAddressForm.valid)) {
      progress += 33;
    }

    // Paso 3: Método de pago (siempre disponible) (34%)
    progress += 34;

    return Math.min(progress, 100);
  }

  // Método separado para navegación - fácil de mockear en tests
  private navigateToPayment(url: string): void {
    window.location.href = url;
  }
}