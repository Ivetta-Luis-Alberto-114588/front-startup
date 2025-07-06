import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { PaymentSuccessComponent } from './payment-success.component';
import { PaymentVerificationService, OrderStatusResponse } from '../../services/payment-verification.service';
import { OrderNotificationService, NotificationResponse } from '../../../orders/services/order-notification.service';
import { CartService } from '../../../cart/services/cart.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { ICart } from '../../../cart/models/icart';

describe('PaymentSuccessComponent', () => {
    let component: PaymentSuccessComponent;
    let fixture: ComponentFixture<PaymentSuccessComponent>;
    let mockActivatedRoute: any;
    let mockPaymentVerificationService: jasmine.SpyObj<PaymentVerificationService>;
    let mockOrderNotificationService: jasmine.SpyObj<OrderNotificationService>;
    let mockCartService: jasmine.SpyObj<CartService>;
    let mockAuthService: jasmine.SpyObj<AuthService>;

    const mockOrderStatus: OrderStatusResponse = {
        saleId: 'sale-123',
        status: 'approved',
        total: 100.50,
        customerEmail: 'test@example.com',
        paymentMethod: 'MercadoPago'
    };

    const mockNotificationResponse: NotificationResponse = {
        success: true,
        message: 'Notification sent successfully'
    };

    const mockCartResponse: Partial<ICart> = {
        id: 'cart-123',
        items: []
    };

    beforeEach(async () => {
        const activatedRouteStub = {
            queryParamMap: of(new Map([
                ['saleId', 'sale-123'],
                ['payment_id', 'payment-456']
            ]))
        };

        const paymentVerificationServiceSpy = jasmine.createSpyObj('PaymentVerificationService', ['verifyOrderStatus']);
        const orderNotificationServiceSpy = jasmine.createSpyObj('OrderNotificationService', ['sendCashOrderNotification', 'sendOrderPaidNotification']);
        const cartServiceSpy = jasmine.createSpyObj('CartService', ['clearCart']);
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

        await TestBed.configureTestingModule({
            declarations: [PaymentSuccessComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                { provide: PaymentVerificationService, useValue: paymentVerificationServiceSpy },
                { provide: OrderNotificationService, useValue: orderNotificationServiceSpy },
                { provide: CartService, useValue: cartServiceSpy },
                { provide: AuthService, useValue: authServiceSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        mockActivatedRoute = TestBed.inject(ActivatedRoute);
        mockPaymentVerificationService = TestBed.inject(PaymentVerificationService) as jasmine.SpyObj<PaymentVerificationService>;
        mockOrderNotificationService = TestBed.inject(OrderNotificationService) as jasmine.SpyObj<OrderNotificationService>;
        mockCartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
        mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentSuccessComponent);
        component = fixture.componentInstance;

        // Asegurar que todos los servicios estén configurados antes de detectChanges
        mockAuthService.isAuthenticated.and.returnValue(true);
        mockPaymentVerificationService.verifyOrderStatus.and.returnValue(of(mockOrderStatus));
        mockCartService.clearCart.and.returnValue(of(mockCartResponse as ICart));
        mockOrderNotificationService.sendOrderPaidNotification.and.returnValue(of(mockNotificationResponse));
        mockOrderNotificationService.sendCashOrderNotification.and.returnValue(of(mockNotificationResponse));
    });

    afterEach(() => {
        // Limpiar subscripciones para evitar memory leaks
        if (component && component.ngOnDestroy) {
            component.ngOnDestroy();
        }
        fixture?.destroy();

        // Asegurar que no quedan tasks pendientes
        try {
            flush();
        } catch (e) {
            // Ignorar errores de flush
        }
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should extract orderId and paymentId from query params and verify payment', () => {
            spyOn(component, 'verifyPaymentAndNotify' as any).and.returnValue(Promise.resolve());

            component.ngOnInit();
            fixture.detectChanges();

            expect(component.orderId).toBe('sale-123');
            expect(component.paymentId).toBe('payment-456');
            expect(component['verifyPaymentAndNotify']).toHaveBeenCalled();
        });
    });

    describe('verifyPaymentAndNotify', () => {
        beforeEach(() => {
            component.orderId = 'sale-123';
            mockAuthService.isAuthenticated.and.returnValue(true);
            mockPaymentVerificationService.verifyOrderStatus.and.returnValue(of(mockOrderStatus));
        });

        it('should verify payment and send notification for approved payment', fakeAsync(() => {
            mockCartService.clearCart.and.returnValue(of(mockCartResponse as ICart));
            mockOrderNotificationService.sendOrderPaidNotification.and.returnValue(of(mockNotificationResponse));

            component['verifyPaymentAndNotify']();
            tick(); // Simular paso del tiempo

            expect(component.isVerifying).toBe(false);
            expect(component.verificationComplete).toBe(true);
            expect(component.isUserAuthenticated).toBe(true);
            expect(mockCartService.clearCart).toHaveBeenCalled();
        }));

        it('should handle order with object status containing code', fakeAsync(() => {
            const orderWithObjectStatus = {
                ...mockOrderStatus,
                status: { code: 'approved', name: 'Approved' } as any
            };
            mockPaymentVerificationService.verifyOrderStatus.and.returnValue(of(orderWithObjectStatus as OrderStatusResponse));
            mockCartService.clearCart.and.returnValue(of(mockCartResponse as ICart));
            mockOrderNotificationService.sendOrderPaidNotification.and.returnValue(of(mockNotificationResponse));

            component['verifyPaymentAndNotify']();
            tick();

            expect(component.verificationComplete).toBe(true);
            expect(mockCartService.clearCart).toHaveBeenCalled();
        }));

        it('should not send notification for pending payment', fakeAsync(() => {
            const pendingOrderStatus = {
                ...mockOrderStatus,
                status: 'pending'
            };
            mockPaymentVerificationService.verifyOrderStatus.and.returnValue(of(pendingOrderStatus));

            component['verifyPaymentAndNotify']();
            tick();

            expect(component.verificationComplete).toBe(true);
            expect(mockOrderNotificationService.sendOrderPaidNotification).not.toHaveBeenCalled();
            expect(mockCartService.clearCart).not.toHaveBeenCalled();
        }));

        it('should handle verification service error gracefully', async () => {
            mockPaymentVerificationService.verifyOrderStatus.and.returnValue(throwError('Service error'));

            await component['verifyPaymentAndNotify']();

            expect(component.verificationComplete).toBe(true);
            expect(component.isVerifying).toBe(false);
            // Should continue with default status when service fails
        });

        it('should handle general error', fakeAsync(() => {
            // Simular una excepción real en el servicio de autenticación
            mockAuthService.isAuthenticated.and.throwError('Authentication error');

            component['verifyPaymentAndNotify']();
            tick();

            expect(component.isVerifying).toBe(false);
            expect(component.errorMessage).toBe('Error al verificar el estado de la venta');
            expect(component.verificationComplete).toBe(true);
        }));
    });

    describe('isPaymentStatusSuccessful', () => {
        it('should return true for approved status', () => {
            expect(component['isPaymentStatusSuccessful']('approved')).toBe(true);
            expect(component['isPaymentStatusSuccessful']('APPROVED')).toBe(true);
            expect(component['isPaymentStatusSuccessful']('pagado')).toBe(true);
            expect(component['isPaymentStatusSuccessful']('PAGADO')).toBe(true);
        });

        it('should return true for partial matches', () => {
            expect(component['isPaymentStatusSuccessful']('PENDIENTE PAGADO')).toBe(true);
            expect(component['isPaymentStatusSuccessful']('custom_paid_status')).toBe(true);
            expect(component['isPaymentStatusSuccessful']('status_successful')).toBe(true);
        });

        it('should return false for non-successful status', () => {
            expect(component['isPaymentStatusSuccessful']('pending')).toBe(false);
            expect(component['isPaymentStatusSuccessful']('rejected')).toBe(false);
            expect(component['isPaymentStatusSuccessful']('cancelled')).toBe(false);
            expect(component['isPaymentStatusSuccessful']('failed')).toBe(false);
        });

        it('should handle object status with code property', () => {
            const statusObject = { code: 'approved', name: 'Approved' };
            expect(component['isPaymentStatusSuccessful'](statusObject)).toBe(true);
        });

        it('should handle object status with name property', () => {
            const statusObject = { name: 'pagado' };
            expect(component['isPaymentStatusSuccessful'](statusObject)).toBe(true);
        });

        it('should handle object status with status property', () => {
            const statusObject = { status: 'paid' };
            expect(component['isPaymentStatusSuccessful'](statusObject)).toBe(true);
        });

        it('should return false for invalid input', () => {
            expect(component['isPaymentStatusSuccessful'](null)).toBe(false);
            expect(component['isPaymentStatusSuccessful'](undefined)).toBe(false);
            expect(component['isPaymentStatusSuccessful']('')).toBe(false);
            expect(component['isPaymentStatusSuccessful']({})).toBe(false);
        });
    });

    describe('sendOrderNotification', () => {
        beforeEach(() => {
            component.orderId = 'sale-123';
        });

        it('should send cash order notification for cash payment', async () => {
            const paymentData = {
                paymentMethod: 'cash',
                status: 'approved',
                transactionAmount: 100,
                paymentMethodId: 'cash',
                payer: { email: 'test@example.com' }
            };
            mockOrderNotificationService.sendCashOrderNotification.and.returnValue(of(mockNotificationResponse));

            await component['sendOrderNotification'](paymentData);

            expect(mockOrderNotificationService.sendCashOrderNotification).toHaveBeenCalledWith({
                orderId: 'sale-123',
                customerName: 'test@example.com',
                customerEmail: 'test@example.com',
                total: 100,
                paymentMethod: 'cash',
                items: []
            });
            expect(component.notificationSent).toBe(true);
        });

        it('should send online payment notification for electronic payment', async () => {
            const paymentData = {
                paymentMethod: 'online',
                status: 'approved',
                transactionAmount: 100,
                paymentMethodId: 'mercadopago',
                payer: { email: 'test@example.com' }
            };
            component.paymentId = 'payment-456';
            mockOrderNotificationService.sendOrderPaidNotification.and.returnValue(of(mockNotificationResponse));

            await component['sendOrderNotification'](paymentData);

            expect(mockOrderNotificationService.sendOrderPaidNotification).toHaveBeenCalledWith({
                orderId: 'sale-123',
                customerName: 'test@example.com',
                customerEmail: 'test@example.com',
                total: 100,
                paymentMethod: 'mercadopago',
                items: [],
                paymentId: 'payment-456'
            });
            expect(component.notificationSent).toBe(true);
        });

        it('should handle notification error gracefully', async () => {
            const paymentData = {
                paymentMethod: 'online',
                status: 'approved',
                transactionAmount: 100,
                payer: { email: 'test@example.com' }
            };
            mockOrderNotificationService.sendOrderPaidNotification.and.returnValue(throwError('Notification error'));

            await component['sendOrderNotification'](paymentData);

            // Should not throw error, just log it
            expect(component.notificationSent).toBe(false);
        });
    });

    describe('confirmCashPayment', () => {
        it('should confirm cash payment without sending notification (handled by backend)', () => {
            spyOn(component, 'sendOrderNotification' as any);
            const orderData = {
                orderId: 'order-123',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                total: 150,
                items: [{ name: 'Product 1', price: 150 }]
            };

            component.confirmCashPayment(orderData);

            expect(component.orderId).toBe('order-123');
            expect(component.verificationComplete).toBe(true);
            // La notificación no se envía desde el frontend para pagos en efectivo
            // ya que se maneja desde el backend para evitar duplicados
            expect(component['sendOrderNotification']).not.toHaveBeenCalled();
        });
    });

    describe('clearCartAfterSuccessfulPayment', () => {
        it('should clear cart successfully', () => {
            mockCartService.clearCart.and.returnValue(of(mockCartResponse as ICart));

            component['clearCartAfterSuccessfulPayment']();

            expect(mockCartService.clearCart).toHaveBeenCalled();
        });

        it('should handle cart clear error gracefully', () => {
            mockCartService.clearCart.and.returnValue(throwError('Cart error'));

            component['clearCartAfterSuccessfulPayment']();

            // Should not throw error
            expect(mockCartService.clearCart).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from route subscription', () => {
            const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            component['routeSub'] = mockSubscription;

            component.ngOnDestroy();

            expect(mockSubscription.unsubscribe).toHaveBeenCalled();
        });

        it('should handle null subscription gracefully', () => {
            component['routeSub'] = null;

            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });
});
