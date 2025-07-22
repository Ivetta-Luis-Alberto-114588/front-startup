import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutPageComponent } from './checkout-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CartService } from 'src/app/features/cart/services/cart.service';
import { AuthService } from 'src/app/auth/services/auth.service';
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
import { ICart } from 'src/app/features/cart/models/icart';

describe('CheckoutPageComponent', () => {
    let component: CheckoutPageComponent;
    let fixture: ComponentFixture<CheckoutPageComponent>;
    let cartService: jasmine.SpyObj<CartService>;
    let authService: jasmine.SpyObj<AuthService>;
    let router: jasmine.SpyObj<Router>;
    let notificationService: jasmine.SpyObj<NotificationService>;

    const mockCart: ICart = {
        id: '1',
        userId: 'user1',
        user: { id: 'user1', email: 'test@test.com' } as any,
        items: [
            {
                product: { id: '1', name: 'Pizza', price: 100 } as any,
                quantity: 2,
                priceAtTime: 100,
                taxRate: 0,
                unitPriceWithTax: 100,
                subtotalWithTax: 200
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalItems: 2,
        subtotalWithoutTax: 200,
        totalTaxAmount: 0,
        total: 200
    };

    beforeEach(async () => {
        const cartServiceSpy = jasmine.createSpyObj('CartService', ['clearCart'], { cart$: of(mockCart) });
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated'], { isAuthenticated$: of(true) });
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const addressServiceSpy = jasmine.createSpyObj('AddressService', ['getAddresses']);
        const cityServiceSpy = jasmine.createSpyObj('CityService', ['getCities']);
        const neighborhoodServiceSpy = jasmine.createSpyObj('NeighborhoodService', ['getNeighborhoodsByCity']);
        const orderServiceSpy = jasmine.createSpyObj('OrderService', ['createOrder']);
        const paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['processPayment']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning']);
        const checkoutStateServiceSpy = jasmine.createSpyObj('CheckoutStateService', ['getShippingAddressOption'], {
            shouldShowAddressSection$: of(true),
            isCheckoutValid$: of(true)
        });
        const deliveryMethodServiceSpy = jasmine.createSpyObj('DeliveryMethodService', ['getActiveDeliveryMethods']);
        const paymentMethodServiceSpy = jasmine.createSpyObj('PaymentMethodService', ['getActivePaymentMethods', 'filterPaymentMethodsByDelivery']);
        const orderNotificationServiceSpy = jasmine.createSpyObj('OrderNotificationService', ['sendOrderNotification']);

        // Configurar retornos para los spies
        addressServiceSpy.getAddresses.and.returnValue(of([]));
        cityServiceSpy.getCities.and.returnValue(of([]));
        neighborhoodServiceSpy.getNeighborhoodsByCity.and.returnValue(of([]));
        deliveryMethodServiceSpy.getActiveDeliveryMethods.and.returnValue(of([]));
        paymentMethodServiceSpy.getActivePaymentMethods.and.returnValue(of([]));
        paymentMethodServiceSpy.filterPaymentMethodsByDelivery.and.returnValue([]);

        await TestBed.configureTestingModule({
            declarations: [CheckoutPageComponent],
            imports: [ReactiveFormsModule],
            providers: [
                { provide: CartService, useValue: cartServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: AddressService, useValue: addressServiceSpy },
                { provide: CityService, useValue: cityServiceSpy },
                { provide: NeighborhoodService, useValue: neighborhoodServiceSpy },
                { provide: OrderService, useValue: orderServiceSpy },
                { provide: PaymentService, useValue: paymentServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: CheckoutStateService, useValue: checkoutStateServiceSpy },
                { provide: DeliveryMethodService, useValue: deliveryMethodServiceSpy },
                { provide: PaymentMethodService, useValue: paymentMethodServiceSpy },
                { provide: OrderNotificationService, useValue: orderNotificationServiceSpy }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

        fixture = TestBed.createComponent(CheckoutPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('debería crearse correctamente', () => {
        expect(component).toBeTruthy();
    });

    it('debería inicializar el formulario de nueva dirección', () => {
        expect(component.newAddressForm).toBeDefined();
        expect(component.newAddressForm.get('recipientName')).toBeTruthy();
        expect(component.newAddressForm.get('phone')).toBeTruthy();
        expect(component.newAddressForm.get('streetAddress')).toBeTruthy();
        expect(component.newAddressForm.get('cityId')).toBeTruthy();
        expect(component.newAddressForm.get('neighborhoodId')).toBeTruthy();
    });

    it('debería mostrar los items del carrito desde el servicio', () => {
        component.cart$.subscribe(cart => {
            expect(cart).toBeTruthy();
            if (cart) {
                expect(cart.items.length).toBe(1);
                expect(cart.total).toBe(200);
            }
        });
    });

    it('debería tener propiedades de estado inicializadas', () => {
        expect(component.addresses).toEqual([]);
        expect(component.cities).toEqual([]);
        expect(component.neighborhoods).toEqual([]);
        expect(component.availableDeliveryMethods).toEqual([]);
        expect(component.availablePaymentMethods).toEqual([]);
        expect(component.selectedDeliveryMethod).toBeNull();
        expect(component.selectedPaymentMethod).toBeNull();
    });

    it('debería tener observables de estado del checkout', () => {
        component.shouldShowAddressSection$.subscribe(shouldShow => {
            expect(shouldShow).toBeTrue();
        });

        component.isCheckoutValid$.subscribe(isValid => {
            expect(isValid).toBeTrue();
        });
    });
});
