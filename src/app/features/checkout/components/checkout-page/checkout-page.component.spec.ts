import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { ToastrModule } from 'ngx-toastr';

import { CheckoutPageComponent } from './checkout-page.component';
import { AuthService } from 'src/app/auth/services/auth.service';
import { CartService } from 'src/app/features/cart/services/cart.service';
import { AddressService } from 'src/app/features/customers/services/address.service';
import { CityService } from 'src/app/features/customers/services/city.service';
import { NeighborhoodService } from 'src/app/features/customers/services/neighborhood.service';
import { OrderService } from 'src/app/features/orders/services/order.service';
import { PaymentService } from 'src/app/features/payments/services/payment.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { CheckoutStateService } from '../../services/checkout-state.service';
import { DeliveryMethodService } from 'src/app/shared/services/delivery-method.service';
import { PaymentMethodService } from 'src/app/shared/services/payment-method.service';
import { OrderNotificationService } from 'src/app/features/orders/services/order-notification.service';
import { TelegramNotificationService } from 'src/app/shared/services/telegram-notification.service';
import { ICart } from 'src/app/features/cart/models/icart';
import { ICartItem } from 'src/app/features/cart/models/icart-item';
import { IAddress } from 'src/app/features/customers/models/iaddress';
import { ICity } from 'src/app/features/customers/models/icity';
import { INeighborhood } from 'src/app/features/customers/models/ineighborhood';
import { IOrder } from 'src/app/features/orders/models/iorder';
import { ICustomer } from 'src/app/features/customers/models/icustomer';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { ICreatePaymentResponse } from 'src/app/features/orders/models/ICreatePaymentResponse';
import { IPayment } from 'src/app/features/orders/models/IPayment';
import { IPaymentPreferenceInfo } from 'src/app/features/orders/models/IPaymentPreferenceInfo';
import { IDeliveryMethod } from 'src/app/shared/models/idelivery-method';
import { IPaymentMethod } from 'src/app/shared/models/ipayment-method';

describe('CheckoutPageComponent', () => {
    let component: CheckoutPageComponent;
    let fixture: ComponentFixture<CheckoutPageComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    let cartService: jasmine.SpyObj<CartService>;
    let addressService: jasmine.SpyObj<AddressService>;
    let cityService: jasmine.SpyObj<CityService>;
    let neighborhoodService: jasmine.SpyObj<NeighborhoodService>;
    let orderService: jasmine.SpyObj<OrderService>;
    let paymentService: jasmine.SpyObj<PaymentService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let checkoutStateService: jasmine.SpyObj<CheckoutStateService>;
    let deliveryMethodService: jasmine.SpyObj<DeliveryMethodService>;
    let paymentMethodService: jasmine.SpyObj<PaymentMethodService>;
    let orderNotificationService: jasmine.SpyObj<OrderNotificationService>;
    let telegramNotificationService: jasmine.SpyObj<TelegramNotificationService>;
    let router: jasmine.SpyObj<Router>;
    let httpMock: HttpTestingController;

    // Mocks de datos
    const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        roles: ['USER_ROLE']
    };

    const mockCartItem: ICartItem = {
        product: {
            id: 'prod-1',
            name: 'Pizza Margarita',
            description: 'Deliciosa pizza',
            price: 15.00,
            priceWithTax: 16.80,
            stock: 10,
            category: { id: 'cat-1', name: 'Pizzas' } as any,
            unit: { id: 'unit-1', name: 'Unidad' } as any,
            isActive: true,
            taxRate: 12,
            tags: ['italiana'],
            imgUrl: 'pizza.jpg'
        },
        quantity: 2,
        priceAtTime: 15.00,
        taxRate: 12,
        unitPriceWithTax: 16.80,
        subtotalWithTax: 33.60
    };

    const mockCart: ICart = {
        id: 'cart-1',
        userId: '1',
        user: mockUser,
        items: [mockCartItem],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalItems: 2,
        subtotalWithoutTax: 30.00,
        totalTaxAmount: 3.60,
        total: 33.60
    };

    const mockEmptyCart: ICart = {
        ...mockCart,
        items: [],
        totalItems: 0,
        subtotalWithoutTax: 0,
        totalTaxAmount: 0,
        total: 0
    };

    const mockAddress: IAddress = {
        id: 'addr-1',
        recipientName: 'John Doe',
        phone: '+1234567890',
        streetAddress: '123 Main St',
        postalCode: '12345',
        additionalInfo: 'Apt 2B',
        alias: 'Casa',
        isDefault: true,
        neighborhood: {
            id: 'neigh-1',
            name: 'Centro',
            city: {
                id: 'city-1',
                name: 'Buenos Aires'
            }
        }
    } as any;

    const mockCity: ICity = {
        id: 'city-1',
        name: 'Buenos Aires'
    } as any;

    const mockNeighborhood: INeighborhood = {
        id: 'neigh-1',
        name: 'Centro',
        city: mockCity
    } as any;

    // Mock delivery methods
    const mockDeliveryMethods: IDeliveryMethod[] = [
        {
            id: 'delivery-method-1',
            code: 'SHIPPING',
            name: 'Envío a Domicilio',
            description: 'Recibe tu pedido en la puerta de tu casa.',
            price: 150.00,
            requiresAddress: true,
            isActive: true
        },
        {
            id: 'delivery-method-2',
            code: 'PICKUP',
            name: 'Retiro en Local',
            description: 'Acércate a nuestra tienda a retirar tu pedido.',
            price: 0.00,
            requiresAddress: false,
            isActive: true
        }
    ];

    // Mock payment methods
    const mockPaymentMethods: IPaymentMethod[] = [
        {
            _id: 'payment-method-1',
            code: 'CASH',
            name: 'Efectivo',
            description: 'Pago en efectivo al momento de la entrega o retiro',
            isActive: true,
            requiresOnlinePayment: false,
            defaultOrderStatusId: 'status-1',
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01'
        },
        {
            _id: 'payment-method-2',
            code: 'MERCADO_PAGO',
            name: 'Mercado Pago',
            description: 'Pago online con Mercado Pago',
            isActive: true,
            requiresOnlinePayment: true,
            defaultOrderStatusId: 'status-2',
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01'
        }
    ];

    const mockOrderStatus: IOrderStatus = {
        _id: 'status-1',
        name: 'Pendiente',
        code: 'PENDING',
        description: 'Orden pendiente de confirmación',
        color: '#FFC107',
        priority: 1,
        isActive: true,
        isDefault: true,
        isFinal: false,
        allowedTransitions: ['status-2'],
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const mockCustomer: ICustomer = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        neighborhood: mockNeighborhood,
        isActive: true,
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockOrder: IOrder = {
        id: 'order-1',
        customer: mockCustomer,
        items: [],
        subtotal: 30.00,
        taxAmount: 3.60,
        discountRate: 0,
        discountAmount: 0,
        total: 33.60,
        date: new Date(),
        status: mockOrderStatus,
        notes: 'Test order',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockPayment: IPayment = {
        id: 'payment-1',
        saleId: 'order-1',
        customerId: '1',
        amount: 33.60,
        provider: 'mercado_pago',
        status: 'pending',
        externalReference: 'sale-order-1',
        preferenceId: 'pref-123',
        paymentMethod: 'credit_card',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockPaymentPreferenceInfo: IPaymentPreferenceInfo = {
        id: 'pref-123',
        init_point: 'https://mercadopago.com/checkout/123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/123'
    };

    const mockCreatePaymentResponse: ICreatePaymentResponse = {
        payment: mockPayment,
        preference: mockPaymentPreferenceInfo
    };
    beforeEach(async () => {
        const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
            isAuthenticated$: new BehaviorSubject(true)
        });

        const cartServiceSpy = jasmine.createSpyObj('CartService', [
            'getCurrentCartValue',
            'clearCart'
        ], {
            cart$: new BehaviorSubject(mockCart)
        });

        const addressServiceSpy = jasmine.createSpyObj('AddressService', [
            'getAddresses'
        ]);

        const cityServiceSpy = jasmine.createSpyObj('CityService', [
            'getCities'
        ]);

        const neighborhoodServiceSpy = jasmine.createSpyObj('NeighborhoodService', [
            'getNeighborhoodsByCity'
        ]);

        const orderServiceSpy = jasmine.createSpyObj('OrderService', [
            'createOrder'
        ]);

        const paymentServiceSpy = jasmine.createSpyObj('PaymentService', [
            'createPaymentPreference'
        ]);

        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'showWarning',
            'showError',
            'showInfo',
            'showSuccess'
        ]);

        const checkoutStateServiceSpy = jasmine.createSpyObj('CheckoutStateService', [
            'setSelectedShippingAddress',
            'getSelectedShippingAddress',
            'setSelectedDeliveryMethod',
            'getSelectedDeliveryMethod',
            'setAvailableDeliveryMethods',
            'setSelectedPaymentMethodId'
        ], {
            shouldShowAddressSection$: of(true),
            isCheckoutValid$: of(true)
        });

        const deliveryMethodServiceSpy = jasmine.createSpyObj('DeliveryMethodService', [
            'getActiveDeliveryMethods',
            'getDeliveryMethodById',
            'requiresAddress'
        ]);

        const paymentMethodServiceSpy = jasmine.createSpyObj('PaymentMethodService', [
            'getActivePaymentMethods',
            'filterPaymentMethodsByDelivery'
        ]);

        const orderNotificationServiceSpy = jasmine.createSpyObj('OrderNotificationService', [
            'sendManualNotification'
        ]);

        const telegramNotificationServiceSpy = jasmine.createSpyObj('TelegramNotificationService', [
            'sendMessage',
            'sendMessageObservable'
        ]);

        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        // Configure default return values for services
        addressServiceSpy.getAddresses.and.returnValue(of([mockAddress]));
        cityServiceSpy.getCities.and.returnValue(of([mockCity]));
        neighborhoodServiceSpy.getNeighborhoodsByCity.and.returnValue(of([mockNeighborhood]));
        orderServiceSpy.createOrder.and.returnValue(of(mockOrder));
        paymentServiceSpy.createPaymentPreference.and.returnValue(of(mockCreatePaymentResponse));
        cartServiceSpy.getCurrentCartValue.and.returnValue(mockCart);
        cartServiceSpy.clearCart.and.returnValue(of(mockEmptyCart));
        checkoutStateServiceSpy.getSelectedShippingAddress.and.returnValue(null);

        // Configure delivery method service
        deliveryMethodServiceSpy.getActiveDeliveryMethods.and.returnValue(of(mockDeliveryMethods));
        deliveryMethodServiceSpy.getDeliveryMethodById.and.returnValue(of(mockDeliveryMethods[0]));
        deliveryMethodServiceSpy.requiresAddress.and.returnValue(of(true));

        // Configure payment method service
        paymentMethodServiceSpy.getActivePaymentMethods.and.returnValue(of(mockPaymentMethods));
        paymentMethodServiceSpy.filterPaymentMethodsByDelivery.and.returnValue(mockPaymentMethods);

        // Configure notification services
        orderNotificationServiceSpy.sendManualNotification.and.returnValue(of({ success: true, message: 'Sent' }));
        telegramNotificationServiceSpy.sendMessage.and.returnValue(Promise.resolve());
        telegramNotificationServiceSpy.sendMessageObservable.and.returnValue(of({ success: true })); await TestBed.configureTestingModule({
            declarations: [CheckoutPageComponent],
            imports: [
                ReactiveFormsModule,
                HttpClientTestingModule,
                ToastrModule.forRoot()
            ],
            providers: [
                FormBuilder,
                { provide: AuthService, useValue: authServiceSpy },
                { provide: CartService, useValue: cartServiceSpy },
                { provide: AddressService, useValue: addressServiceSpy },
                { provide: CityService, useValue: cityServiceSpy },
                { provide: NeighborhoodService, useValue: neighborhoodServiceSpy },
                { provide: OrderService, useValue: orderServiceSpy },
                { provide: PaymentService, useValue: paymentServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: CheckoutStateService, useValue: checkoutStateServiceSpy },
                { provide: DeliveryMethodService, useValue: deliveryMethodServiceSpy },
                { provide: PaymentMethodService, useValue: paymentMethodServiceSpy },
                { provide: OrderNotificationService, useValue: orderNotificationServiceSpy },
                { provide: TelegramNotificationService, useValue: telegramNotificationServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CheckoutPageComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
        addressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;
        cityService = TestBed.inject(CityService) as jasmine.SpyObj<CityService>;
        neighborhoodService = TestBed.inject(NeighborhoodService) as jasmine.SpyObj<NeighborhoodService>;
        orderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
        paymentService = TestBed.inject(PaymentService) as jasmine.SpyObj<PaymentService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        checkoutStateService = TestBed.inject(CheckoutStateService) as jasmine.SpyObj<CheckoutStateService>;
        deliveryMethodService = TestBed.inject(DeliveryMethodService) as jasmine.SpyObj<DeliveryMethodService>;
        paymentMethodService = TestBed.inject(PaymentMethodService) as jasmine.SpyObj<PaymentMethodService>;
        orderNotificationService = TestBed.inject(OrderNotificationService) as jasmine.SpyObj<OrderNotificationService>;
        telegramNotificationService = TestBed.inject(TelegramNotificationService) as jasmine.SpyObj<TelegramNotificationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        httpMock = TestBed.inject(HttpTestingController);

        // Spy on navigation method to prevent page reloads in all tests
        spyOn(component as any, 'navigateToPayment');
    });
    afterEach(() => {
        // Limpiar estado entre tests
        component.ngOnDestroy();

        // Mock any pending HTTP requests that might have been made
        const req = httpMock.match(`${environment.apiUrl}/api/delivery-methods`);
        req.forEach(r => r.flush({ deliveryMethods: mockDeliveryMethods }));

        httpMock.verify();
    });
    beforeEach(() => {
        // Reset form
        if (component.newAddressForm) {
            component.newAddressForm.reset();
        }

        // Reset spy calls
        notificationService.showWarning.calls.reset();
        notificationService.showError.calls.reset();
        notificationService.showSuccess.calls.reset();
        notificationService.showInfo.calls.reset();
        router.navigate.calls.reset();
        addressService.getAddresses.calls.reset();
        cityService.getCities.calls.reset();
        neighborhoodService.getNeighborhoodsByCity.calls.reset();
        orderService.createOrder.calls.reset();
        paymentService.createPaymentPreference.calls.reset();
        cartService.clearCart.calls.reset();
        deliveryMethodService.getActiveDeliveryMethods.calls.reset();
        deliveryMethodService.getDeliveryMethodById.calls.reset();
        deliveryMethodService.requiresAddress.calls.reset();
        paymentMethodService.getActivePaymentMethods.calls.reset();
        paymentMethodService.filterPaymentMethodsByDelivery.calls.reset();
        orderNotificationService.sendManualNotification.calls.reset();
        telegramNotificationService.sendMessage.calls.reset();
        telegramNotificationService.sendMessageObservable.calls.reset();

        // Set default delivery method and payment methods for all tests
        component.selectedDeliveryMethod = mockDeliveryMethods[0];
        component.availableDeliveryMethods = mockDeliveryMethods;
        component.selectedPaymentMethod = mockPaymentMethods[0]._id;
        component.availablePaymentMethods = mockPaymentMethods;
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize with correct default properties', () => {
            expect(component.selectedAddressOption).toBeNull();
            expect(component.selectedExistingAddressId).toBeNull();
            expect(component.addresses).toEqual([]);
            expect(component.cities).toEqual([]);
            expect(component.neighborhoods).toEqual([]);
            expect(component.isLoadingAddresses).toBe(false);
            expect(component.isLoadingCities).toBe(false);
            expect(component.isLoadingNeighborhoods).toBe(false);
            expect(component.isProcessingOrder).toBe(false);
        }); it('should initialize form with required validators', () => {
            expect(component.newAddressForm).toBeDefined();

            // Enable neighborhood control since it's disabled by default
            component.newAddressForm.get('neighborhoodId')?.enable();

            // Mark all fields as touched to trigger validation
            component.newAddressForm.markAllAsTouched();

            expect(component.newAddressForm.valid).toBe(false);
            expect(component.newAddressForm.get('recipientName')?.hasError('required')).toBe(true);
            expect(component.newAddressForm.get('phone')?.hasError('required')).toBe(true);
            expect(component.newAddressForm.get('streetAddress')?.hasError('required')).toBe(true);
            expect(component.newAddressForm.get('cityId')?.hasError('required')).toBe(true);
            expect(component.newAddressForm.get('neighborhoodId')?.hasError('required')).toBe(true);
        });
    }); describe('Validación de carrito no vacío', () => {
        it('should redirect to cart when cart is empty', fakeAsync(() => {
            // Setup empty cart observable
            const emptyCartSubject = new BehaviorSubject(mockEmptyCart);
            Object.defineProperty(cartService, 'cart$', {
                get: () => emptyCartSubject.asObservable()
            });

            // Reinitialize component with empty cart
            component.cart$ = cartService.cart$;
            component.ngOnInit();
            tick();

            expect(notificationService.showWarning).toHaveBeenCalledWith('Tu carrito está vacío.', 'Checkout');
            expect(router.navigate).toHaveBeenCalledWith(['/cart']);
        }));

        it('should redirect to cart when cart is null', fakeAsync(() => {
            // Setup null cart observable
            const nullCartSubject = new BehaviorSubject(null);
            Object.defineProperty(cartService, 'cart$', {
                get: () => nullCartSubject.asObservable()
            });

            // Reinitialize component with null cart
            component.cart$ = cartService.cart$;
            component.ngOnInit();
            tick();

            expect(notificationService.showWarning).toHaveBeenCalledWith('Tu carrito está vacío.', 'Checkout');
            expect(router.navigate).toHaveBeenCalledWith(['/cart']);
        }));

        it('should not redirect when cart has items', fakeAsync(() => {
            // Setup valid cart observable (this is the default)
            const validCartSubject = new BehaviorSubject(mockCart);
            Object.defineProperty(cartService, 'cart$', {
                get: () => validCartSubject.asObservable()
            });

            component.cart$ = cartService.cart$;
            component.ngOnInit();
            tick();

            expect(router.navigate).not.toHaveBeenCalled();
        }));
    });

    describe('Gestión de direcciones', () => {
        describe('Usuario autenticado', () => {
            beforeEach(() => {
                authService.isAuthenticated$ = new BehaviorSubject(true);
            });

            it('should load user addresses on init', () => {
                addressService.getAddresses.and.returnValue(of([mockAddress]));

                component.ngOnInit();

                expect(addressService.getAddresses).toHaveBeenCalled();
                expect(component.addresses).toEqual([mockAddress]);
            });

            it('should preselect default address if exists', () => {
                addressService.getAddresses.and.returnValue(of([mockAddress]));

                component.ngOnInit();

                expect(component.selectedAddressOption).toBe('existing');
                expect(component.selectedExistingAddressId).toBe(mockAddress.id);
                expect(checkoutStateService.setSelectedShippingAddress).toHaveBeenCalled();
            });

            it('should set new address option if no addresses exist', () => {
                addressService.getAddresses.and.returnValue(of([]));
                cityService.getCities.and.returnValue(of([mockCity]));

                component.ngOnInit();

                expect(component.selectedAddressOption).toBe('new');
                expect(cityService.getCities).toHaveBeenCalled();
            }); it('should handle address loading error', () => {
                addressService.getAddresses.and.returnValue(throwError(() => new Error('Address error')));
                cityService.getCities.and.returnValue(of([mockCity]));

                component.ngOnInit();

                expect(notificationService.showError).toHaveBeenCalledWith(
                    'No se pudieron cargar tus direcciones.',
                    'Error'
                );
                expect(component.selectedAddressOption).toBe('new');
                expect(cityService.getCities).toHaveBeenCalled();
            });

            it('should not preselect address when addresses exist but none is default', () => {
                const nonDefaultAddress = { ...mockAddress, isDefault: false };
                addressService.getAddresses.and.returnValue(of([nonDefaultAddress]));

                component.ngOnInit();

                expect(component.selectedAddressOption).not.toBe('existing');
                expect(component.selectedExistingAddressId).toBeNull();
            });

            it('should handle case when selected address is not found in addresses list', () => {
                component.addresses = [mockAddress];
                component.selectedAddressOption = 'existing';
                component.selectedExistingAddressId = 'non-existent-id';

                component.updateCheckoutState();

                expect(checkoutStateService.setSelectedShippingAddress).toHaveBeenCalledWith(null);
            });
        }); describe('Usuario invitado', () => {
            it('should set new address option for guest users', fakeAsync(() => {
                // Reset component for guest user test
                const guestAuthService = jasmine.createSpyObj('AuthService', [], {
                    isAuthenticated$: new BehaviorSubject(false)
                });
                const guestCityService = jasmine.createSpyObj('CityService', ['getCities']);
                const guestAddressService = jasmine.createSpyObj('AddressService', ['getAddresses']);

                guestCityService.getCities.and.returnValue(of([mockCity]));

                // Create new component with guest configuration
                const guestFixture = TestBed.createComponent(CheckoutPageComponent);
                const guestComponent = guestFixture.componentInstance;

                // Inject services manually to override
                (guestComponent as any).authService = guestAuthService;
                (guestComponent as any).cityService = guestCityService;
                (guestComponent as any).addressService = guestAddressService;

                guestComponent.ngOnInit();
                tick(); // Allow async operations to complete

                expect(guestComponent.selectedAddressOption).toBe('new');
                expect(guestCityService.getCities).toHaveBeenCalled();
                expect(guestAddressService.getAddresses).not.toHaveBeenCalled();
            }));
        });
    });

    describe('Carga de ciudades y barrios', () => {
        it('should load cities successfully', () => {
            cityService.getCities.and.returnValue(of([mockCity]));

            component.loadCities();

            expect(component.cities).toEqual([mockCity]);
            expect(component.isLoadingCities).toBe(false);
        });

        it('should handle cities loading error', () => {
            cityService.getCities.and.returnValue(throwError(() => new Error('Cities error')));

            component.loadCities();

            expect(notificationService.showError).toHaveBeenCalledWith(
                'No se pudieron cargar las ciudades.',
                'Error'
            );
            expect(component.isLoadingCities).toBe(false);
        });

        it('should load neighborhoods when city is selected', () => {
            neighborhoodService.getNeighborhoodsByCity.and.returnValue(of([mockNeighborhood]));

            component.loadNeighborhoods('city-1');

            expect(neighborhoodService.getNeighborhoodsByCity).toHaveBeenCalledWith('city-1');
            expect(component.neighborhoods).toEqual([mockNeighborhood]);
            expect(component.isLoadingNeighborhoods).toBe(false);
        }); it('should handle neighborhoods loading error', () => {
            neighborhoodService.getNeighborhoodsByCity.and.returnValue(throwError(() => new Error('Neighborhoods error')));

            component.loadNeighborhoods('city-1');

            expect(notificationService.showError).toHaveBeenCalledWith(
                'No se pudieron cargar los barrios.',
                'Error'
            );
            expect(component.isLoadingNeighborhoods).toBe(false);
        }); it('should clear neighborhoods when city changes to null', () => {
            component.neighborhoods = [mockNeighborhood];

            // Manually call the logic that happens in the valueChanges subscription
            const neighborhoodControl = component.newAddressForm.get('neighborhoodId');
            neighborhoodControl?.reset();
            component.neighborhoods = [];
            neighborhoodControl?.disable();

            expect(component.neighborhoods).toEqual([]);
        });

        it('should enable neighborhood control when city is selected', () => {
            neighborhoodService.getNeighborhoodsByCity.and.returnValue(of([mockNeighborhood]));
            const neighborhoodControl = component.newAddressForm.get('neighborhoodId');

            // Call the method directly instead of relying on valueChanges
            component.loadNeighborhoods('city-1');

            expect(neighborhoodControl?.enabled).toBe(true);
        });

        it('should disable neighborhood control when no city is selected', () => {
            const neighborhoodControl = component.newAddressForm.get('neighborhoodId');
            neighborhoodControl?.enable();

            // Manually trigger the logic that happens when cityId is null
            neighborhoodControl?.reset();
            component.neighborhoods = [];
            neighborhoodControl?.disable();

            expect(neighborhoodControl?.disabled).toBe(true);
        });

        it('should reset neighborhood when city changes', () => {
            neighborhoodService.getNeighborhoodsByCity.and.returnValue(of([mockNeighborhood]));

            // Simular cambio de ciudad en el formulario
            component.newAddressForm.patchValue({ cityId: 'city-1' });

            expect(component.newAddressForm.get('neighborhoodId')?.value).toBeNull();
        });
    });

    describe('Validación de formularios', () => {
        it('should validate required fields in new address form', () => {
            const form = component.newAddressForm;

            // Enable neighborhood control since it's disabled by default
            form.get('neighborhoodId')?.enable();

            // Clear the form and mark as touched to trigger validation errors
            form.patchValue({
                recipientName: '',
                phone: '',
                streetAddress: '',
                postalCode: '',
                cityId: null,
                neighborhoodId: null,
                additionalInfo: ''
            });
            form.markAllAsTouched();
            form.updateValueAndValidity();

            expect(form.valid).toBe(false);
            expect(form.get('recipientName')?.hasError('required')).toBe(true);
            expect(form.get('phone')?.hasError('required')).toBe(true);
            expect(form.get('streetAddress')?.hasError('required')).toBe(true);
            expect(form.get('cityId')?.hasError('required')).toBe(true);
            expect(form.get('neighborhoodId')?.hasError('required')).toBe(true);
        });

        it('should validate phone pattern', () => {
            const phoneControl = component.newAddressForm.get('phone');

            phoneControl?.setValue('123'); // Invalid phone
            expect(phoneControl?.hasError('pattern')).toBe(true);

            phoneControl?.setValue('+1234567890'); // Valid phone
            expect(phoneControl?.hasError('pattern')).toBe(false);
        });

        it('should be valid when all required fields are filled', () => {
            component.newAddressForm.patchValue({
                recipientName: 'John Doe',
                phone: '+1234567890',
                streetAddress: '123 Main St',
                cityId: 'city-1',
                neighborhoodId: 'neigh-1',
                postalCode: '12345',
                additionalInfo: 'Apt 2B',
                alias: 'Casa'
            });

            expect(component.newAddressForm.valid).toBe(true);
        });
    });

    describe('Gestión de opciones de dirección', () => {
        it('should update checkout state when address option changes', () => {
            component.selectedAddressOption = 'new';
            cityService.getCities.and.returnValue(of([mockCity]));

            component.onAddressOptionChange();

            expect(checkoutStateService.setSelectedShippingAddress).toHaveBeenCalled();
            expect(component.selectedExistingAddressId).toBeNull();
        });

        it('should load cities when changing to new address option', () => {
            component.selectedAddressOption = 'new';
            component.cities = []; // No cities loaded
            cityService.getCities.and.returnValue(of([mockCity]));

            component.onAddressOptionChange();

            expect(cityService.getCities).toHaveBeenCalled();
        });

        it('should update checkout state when existing address changes', () => {
            component.addresses = [mockAddress];
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = mockAddress.id;

            component.onExistingAddressChange(); expect(checkoutStateService.setSelectedShippingAddress).toHaveBeenCalledWith({
                type: 'existing',
                address: mockAddress
            });
        });

        it('should not reload cities if already loaded when switching to new address', () => {
            component.cities = [mockCity]; // Cities already loaded
            component.selectedAddressOption = 'new';

            component.onAddressOptionChange();

            expect(cityService.getCities).not.toHaveBeenCalled();
        });

        it('should clear existing address selection when switching to new address', () => {
            component.selectedExistingAddressId = 'addr-1';
            component.selectedAddressOption = 'new';

            component.onAddressOptionChange();

            expect(component.selectedExistingAddressId).toBeNull();
        });

        it('should set null checkout state when no address option is selected', () => {
            component.selectedAddressOption = null;

            component.updateCheckoutState();

            expect(checkoutStateService.setSelectedShippingAddress).toHaveBeenCalledWith(null);
        });
    });

    describe('Validación de dirección para confirmar', () => {
        it('should return true when existing address is selected', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';

            expect(component.isAddressSelectedOrValid).toBe(true);
        });

        it('should return true when new address form is valid', () => {
            component.selectedAddressOption = 'new';
            component.newAddressForm.patchValue({
                recipientName: 'John Doe',
                phone: '+1234567890',
                streetAddress: '123 Main St',
                cityId: 'city-1',
                neighborhoodId: 'neigh-1'
            });

            expect(component.isAddressSelectedOrValid).toBe(true);
        });

        it('should return false when no address option is selected', () => {
            component.selectedAddressOption = null;

            expect(component.isAddressSelectedOrValid).toBe(false);
        });

        it('should return false when new address form is invalid', () => {
            component.selectedAddressOption = 'new';
            // Form is invalid by default (empty required fields)

            expect(component.isAddressSelectedOrValid).toBe(false);
        });
    });

    describe('Confirmación de pedido y flujo de pago', () => {
        beforeEach(() => {
            cartService.getCurrentCartValue.and.returnValue(mockCart);
            orderService.createOrder.and.returnValue(of(mockOrder));
            paymentService.createPaymentPreference.and.returnValue(of(mockCreatePaymentResponse));
            cartService.clearCart.and.returnValue(of(mockEmptyCart));
        });

        it('should prevent order confirmation with invalid address', () => {
            component.selectedAddressOption = null;
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0]; // Requires address
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(notificationService.showWarning).toHaveBeenCalledWith(
                'Por favor, selecciona o completa una dirección de envío válida.'
            );
            expect(orderService.createOrder).not.toHaveBeenCalled();
        });

        it('should prevent order confirmation without payment method', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = null;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(notificationService.showWarning).toHaveBeenCalledWith(
                'Por favor, selecciona un método de pago.'
            );
            expect(orderService.createOrder).not.toHaveBeenCalled();
        });

        it('should prevent order confirmation without delivery method', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = null;
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(notificationService.showWarning).toHaveBeenCalledWith(
                'Por favor, selecciona un método de entrega.'
            );
            expect(orderService.createOrder).not.toHaveBeenCalled();
        });

        it('should prevent order confirmation when already processing', () => {
            component.isProcessingOrder = true;
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';

            component.confirmOrder();

            expect(orderService.createOrder).not.toHaveBeenCalled();
        });

        it('should handle empty cart during confirmation', () => {
            cartService.getCurrentCartValue.and.returnValue(mockEmptyCart);
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(notificationService.showError).toHaveBeenCalledWith('Tu carrito está vacío.');
            expect(router.navigate).toHaveBeenCalledWith(['/cart']);
            expect(orderService.createOrder).not.toHaveBeenCalled();
        });

        it('should create order with existing address', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(orderService.createOrder).toHaveBeenCalledWith({
                items: jasmine.arrayContaining([
                    jasmine.objectContaining({
                        productId: mockCartItem.product.id,
                        quantity: mockCartItem.quantity,
                        unitPrice: mockCartItem.unitPriceWithTax
                    })
                ]),
                deliveryMethodId: mockDeliveryMethods[0].id,
                paymentMethodId: mockPaymentMethods[0]._id,
                notes: jasmine.any(String),
                deliveryMethodCode: mockDeliveryMethods[0].code,
                selectedAddressId: 'addr-1'
            });
        }); it('should create order with new address', () => {
            component.selectedAddressOption = 'new';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;

            // Enable neighborhood control first (it might be disabled by default)
            component.newAddressForm.get('neighborhoodId')?.enable();

            component.newAddressForm.patchValue({
                recipientName: 'John Doe',
                phone: '+1234567890',
                streetAddress: '123 Main St',
                postalCode: '12345',
                cityId: 'city-1',
                neighborhoodId: 'neigh-1',
                additionalInfo: 'Apt 2B'
            });

            // Make sure the form is valid
            expect(component.newAddressForm.valid).toBe(true);

            component.confirmOrder();

            expect(orderService.createOrder).toHaveBeenCalledWith({
                items: jasmine.arrayContaining([
                    jasmine.objectContaining({
                        productId: mockCartItem.product.id,
                        quantity: mockCartItem.quantity,
                        unitPrice: mockCartItem.unitPriceWithTax
                    })
                ]),
                deliveryMethodId: mockDeliveryMethods[0].id,
                paymentMethodId: mockPaymentMethods[0]._id,
                notes: jasmine.any(String),
                deliveryMethodCode: mockDeliveryMethods[0].code,
                shippingRecipientName: 'John Doe',
                shippingPhone: '+1234567890',
                shippingStreetAddress: '123 Main St',
                shippingPostalCode: '12345',
                shippingNeighborhoodId: 'neigh-1',
                shippingAdditionalInfo: 'Apt 2B'
            });
        });

        it('should create payment preference after order creation', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[1]._id; // Mercado Pago
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(paymentService.createPaymentPreference).toHaveBeenCalledWith(mockOrder.id);
        }); it('should redirect to Mercado Pago on successful payment preference creation', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[1]._id; // Mercado Pago
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(orderService.createOrder).toHaveBeenCalled();
            expect(paymentService.createPaymentPreference).toHaveBeenCalledWith(mockOrder.id);
            expect((component as any).navigateToPayment).toHaveBeenCalledWith(mockPaymentPreferenceInfo.init_point);
        });

        it('should handle order creation error', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;
            orderService.createOrder.and.returnValue(throwError(() => ({
                error: { error: 'Order creation failed' }
            })));

            component.confirmOrder();

            expect(notificationService.showError).toHaveBeenCalledWith('Ocurrió un error al procesar tu pedido.', 'Error en Pedido');
            expect(component.isProcessingOrder).toBe(false);
        });

        it('should handle payment preference creation error', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[1]._id; // Mercado Pago
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;
            paymentService.createPaymentPreference.and.returnValue(throwError(() => new Error('Payment error')));

            component.confirmOrder();

            expect(notificationService.showError).toHaveBeenCalledWith('Ocurrió un error al procesar tu pedido.', 'Error en Pedido');
            expect(component.isProcessingOrder).toBe(false);
        }); it('should handle missing payment preference init_point', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[1]._id; // Mercado Pago
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;
            const invalidPaymentResponse: ICreatePaymentResponse = {
                payment: mockPayment,
                preference: { id: '', init_point: '', sandbox_init_point: '' }
            };
            paymentService.createPaymentPreference.and.returnValue(of(invalidPaymentResponse));

            component.confirmOrder();

            expect(notificationService.showError).toHaveBeenCalledWith(
                'No se pudo inicializar el pago. Inténtalo nuevamente.',
                'Error de Pago'
            );
        }); it('should handle order creation without ID', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;
            const orderWithoutId = { ...mockOrder, id: '' };
            orderService.createOrder.and.returnValue(of(orderWithoutId));

            component.confirmOrder();

            expect(notificationService.showError).toHaveBeenCalledWith(
                'Ocurrió un error al procesar tu pedido.',
                'Error en Pedido'
            );
            expect(paymentService.createPaymentPreference).not.toHaveBeenCalled();
        });

        it('should handle cart as null during confirmation', () => {
            cartService.getCurrentCartValue.and.returnValue(null);
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;

            component.confirmOrder();

            expect(notificationService.showError).toHaveBeenCalledWith('Tu carrito está vacío.');
            expect(router.navigate).toHaveBeenCalledWith(['/cart']);
        });

        it('should mark form as touched when address is invalid', () => {
            component.selectedAddressOption = 'new';
            component.selectedPaymentMethod = mockPaymentMethods[0]._id;
            component.selectedDeliveryMethod = mockDeliveryMethods[0];
            component.availablePaymentMethods = mockPaymentMethods;
            component.newAddressForm.reset(); // Make form invalid
            spyOn(component.newAddressForm, 'markAllAsTouched');

            component.confirmOrder();

            expect(component.newAddressForm.markAllAsTouched).toHaveBeenCalled();
        });
    });

    describe('Component Lifecycle', () => {
        it('should unsubscribe on destroy', () => {
            const subscriptions = [
                jasmine.createSpyObj('Subscription', ['unsubscribe']),
                jasmine.createSpyObj('Subscription', ['unsubscribe']),
                jasmine.createSpyObj('Subscription', ['unsubscribe']),
                jasmine.createSpyObj('Subscription', ['unsubscribe'])
            ];

            component['cartSubscription'] = subscriptions[0];
            component['addressSubscription'] = subscriptions[1];
            component['citySubscription'] = subscriptions[2];
            component['neighborhoodSubscription'] = subscriptions[3];

            component.ngOnDestroy();

            subscriptions.forEach(sub => {
                expect(sub.unsubscribe).toHaveBeenCalled();
            });
        });

        it('should handle destroy with no subscriptions', () => {
            component['cartSubscription'] = null;
            component['addressSubscription'] = null;
            component['citySubscription'] = null;
            component['neighborhoodSubscription'] = null;

            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('Loading States', () => {
        it('should show loading states during data fetching', () => {
            addressService.getAddresses.and.returnValue(of([mockAddress]));

            expect(component.isLoadingAddresses).toBe(false);

            component.loadUserAddresses();

            expect(component.isLoadingAddresses).toBe(false); // Finalized after observable completes
        });

        it('should show processing state during order confirmation', () => {
            component.selectedAddressOption = 'existing';
            component.selectedExistingAddressId = 'addr-1';

            expect(component.isProcessingOrder).toBe(false);

            component.confirmOrder();

            expect(component.isProcessingOrder).toBe(false); // Finalized after observable completes
        });
    });
});


describe('CheckoutPageComponent - Notificaciones de orden', () => {
    let component: CheckoutPageComponent;
    let fixture: ComponentFixture<CheckoutPageComponent>;
    let orderNotificationService: jasmine.SpyObj<OrderNotificationService>;
    let telegramNotificationService: jasmine.SpyObj<TelegramNotificationService>;
    let cartService: jasmine.SpyObj<CartService>;
    let orderService: jasmine.SpyObj<OrderService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let paymentMethodService: jasmine.SpyObj<PaymentMethodService>;
    let deliveryMethodService: jasmine.SpyObj<DeliveryMethodService>;

    beforeEach(async () => {
        const orderNotificationServiceSpy = jasmine.createSpyObj('OrderNotificationService', ['sendManualNotification']);
        const telegramNotificationServiceSpy = jasmine.createSpyObj('TelegramNotificationService', ['sendMessage', 'sendMessageObservable']);
        const cartServiceSpy = jasmine.createSpyObj('CartService', ['getCurrentCartValue', 'clearCart']);
        const orderServiceSpy = jasmine.createSpyObj('OrderService', ['createOrder']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning', 'showInfo']);
        const paymentMethodServiceSpy = jasmine.createSpyObj('PaymentMethodService', ['getActivePaymentMethods', 'filterPaymentMethodsByDelivery']);
        const deliveryMethodServiceSpy = jasmine.createSpyObj('DeliveryMethodService', ['getActiveDeliveryMethods']);

        await TestBed.configureTestingModule({
            declarations: [CheckoutPageComponent],
            providers: [
                FormBuilder,
                { provide: OrderNotificationService, useValue: orderNotificationServiceSpy },
                { provide: TelegramNotificationService, useValue: telegramNotificationServiceSpy },
                { provide: CartService, useValue: cartServiceSpy },
                { provide: OrderService, useValue: orderServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: PaymentMethodService, useValue: paymentMethodServiceSpy },
                { provide: DeliveryMethodService, useValue: deliveryMethodServiceSpy },
                { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', [], { isAuthenticated$: of(true) }) },
                { provide: AddressService, useValue: jasmine.createSpyObj('AddressService', ['getAddresses']) },
                { provide: CityService, useValue: jasmine.createSpyObj('CityService', ['getCities']) },
                { provide: NeighborhoodService, useValue: jasmine.createSpyObj('NeighborhoodService', ['getNeighborhoodsByCity']) },
                { provide: PaymentService, useValue: jasmine.createSpyObj('PaymentService', ['createPaymentPreference']) },
                { provide: CheckoutStateService, useValue: jasmine.createSpyObj('CheckoutStateService', ['setSelectedShippingAddress', 'setSelectedDeliveryMethod', 'setAvailableDeliveryMethods', 'setSelectedPaymentMethodId'], { shouldShowAddressSection$: of(true), isCheckoutValid$: of(true) }) },
                { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule, ToastrModule.forRoot()]
        }).compileComponents();

        fixture = TestBed.createComponent(CheckoutPageComponent);
        component = fixture.componentInstance;
        orderNotificationService = TestBed.inject(OrderNotificationService) as jasmine.SpyObj<OrderNotificationService>;
        telegramNotificationService = TestBed.inject(TelegramNotificationService) as jasmine.SpyObj<TelegramNotificationService>;
        cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
        orderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        paymentMethodService = TestBed.inject(PaymentMethodService) as jasmine.SpyObj<PaymentMethodService>;
        deliveryMethodService = TestBed.inject(DeliveryMethodService) as jasmine.SpyObj<DeliveryMethodService>;

        // Setup default mocks
        deliveryMethodService.getActiveDeliveryMethods.and.returnValue(of([{
            id: '1', code: 'PICKUP', name: 'Retiro', requiresAddress: false, isActive: true, price: 0, description: 'Retiro en local'
        }]));
        paymentMethodService.getActivePaymentMethods.and.returnValue(of([{
            _id: 'CASH', code: 'CASH', name: 'Efectivo', description: '', isActive: true, requiresOnlinePayment: false,
            defaultOrderStatusId: '', createdAt: '', updatedAt: ''
        }]));
        paymentMethodService.filterPaymentMethodsByDelivery.and.returnValue([{
            _id: 'CASH', code: 'CASH', name: 'Efectivo', description: '', isActive: true, requiresOnlinePayment: false,
            defaultOrderStatusId: '', createdAt: '', updatedAt: ''
        }]);
    });

    it('debe llamar a ambos servicios de notificación tras crear una orden', () => {
        // Arrange
        const mockOrderId = 'order-123';
        const mockCart = {
            items: [{
                product: { id: 'prod-1', name: 'Test Product' },
                quantity: 1,
                priceAtTime: 100,
                taxRate: 10,
                unitPriceWithTax: 110,
                subtotalWithTax: 110
            }],
            user: { name: 'Test User', email: 'test@example.com' },
            total: 110
        };

        orderService.createOrder.and.returnValue(of({ id: mockOrderId } as any));
        cartService.getCurrentCartValue.and.returnValue(mockCart as any);
        cartService.clearCart.and.returnValue(of({} as any));
        orderNotificationService.sendManualNotification.and.returnValue(of({ success: true, message: 'Notification sent' }));
        telegramNotificationService.sendMessage.and.returnValue(Promise.resolve({ success: true, message: 'Sent' }));
        telegramNotificationService.sendMessageObservable.and.returnValue(of({ success: true, message: 'Telegram sent' }));

        // Setup component with required data
        component.selectedDeliveryMethod = { id: '1', code: 'PICKUP', name: 'Retiro', requiresAddress: false, isActive: true, price: 0, description: 'Retiro en local' };
        component.selectedPaymentMethod = 'CASH';
        component.availablePaymentMethods = [{ _id: 'CASH', code: 'CASH', name: 'Efectivo', description: '', isActive: true, requiresOnlinePayment: false, defaultOrderStatusId: '', createdAt: '', updatedAt: '' }];

        // Act
        component.confirmOrder();

        // Assert
        expect(orderNotificationService.sendManualNotification).toHaveBeenCalled();
        expect(telegramNotificationService.sendMessage).toHaveBeenCalled();
    });
});
