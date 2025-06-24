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
    private fb: FormBuilder,
    private router: Router
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
    if (!this.isAddressSelectedOrValid || this.isProcessingOrder) {
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
      // Añadir couponCode si se implementa
    };

    // Añadir datos de dirección al payload
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

    // 1. Crear la orden
    this.orderService.createOrder(orderPayload).pipe(
      tap(() => this.notificationService.showInfo('Procesando pago...', 'Orden Creada')),
      // 2. Si la orden se crea, crear la preferencia de pago
      switchMap(createdOrder => {
        if (!createdOrder || !createdOrder.id) {
          throw new Error('No se recibió ID de la orden creada.');
        }
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

  // Método separado para navegación - fácil de mockear en tests
  private navigateToPayment(url: string): void {
    window.location.href = url;
  }
}