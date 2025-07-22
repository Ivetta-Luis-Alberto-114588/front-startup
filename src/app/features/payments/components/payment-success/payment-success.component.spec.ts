import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { PaymentSuccessComponent } from './payment-success.component';
import { PaymentVerificationService, OrderStatusResponse } from '../../services/payment-verification.service';
import { OrderNotificationService, NotificationResponse } from '../../../orders/services/order-notification.service';
import { OrderService } from '../../../orders/services/order.service';
import { OrderInquiryService } from '../../../order-inquiry/services/order-inquiry.service';
import { CartService } from '../../../cart/services/cart.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { ICart } from '../../../cart/models/icart';
import { IOrder } from '../../../orders/models/iorder';
import { PublicOrderResponse } from '../../../order-inquiry/models/order-public.interface';

describe('PaymentSuccessComponent', () => {
    let component: PaymentSuccessComponent;
    let fixture: ComponentFixture<PaymentSuccessComponent>;
    let mockActivatedRoute: any;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockPaymentVerificationService: jasmine.SpyObj<PaymentVerificationService>;
    let mockOrderNotificationService: jasmine.SpyObj<OrderNotificationService>;
    let mockOrderService: jasmine.SpyObj<OrderService>;
    let mockOrderInquiryService: jasmine.SpyObj<OrderInquiryService>;
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

    const mockAuthenticatedOrder: Partial<IOrder> = {
        id: 'order-123',
        customer: { 
            id: 'user-456', 
            name: 'Test User', 
            email: 'test@example.com'
        } as any,
        items: [
            {
                product: { id: 'prod-1', name: 'Test Product', price: 100 } as any,
                quantity: 1,
                unitPrice: 100,
                subtotal: 121
            }
        ],
        total: 121,
        subtotal: 100,
        taxAmount: 21,
        discountRate: 0,
        discountAmount: 0,
        date: new Date(),
        status: { id: 'pending', name: 'Pending', description: 'Pending order' } as any
    };

    const mockPublicOrder: Partial<PublicOrderResponse> = {
        id: 'order-123',
        total: 121,
        subtotal: 100,
        taxAmount: 21,
        taxRate: 21,
        discountRate: 0,
        discountAmount: 0,
        date: new Date().toISOString(),
        status: { 
            id: 'pending', 
            code: 'pending',
            name: 'Pending', 
            description: 'Pending order',
            color: 'orange',
            order: 1,
            isActive: true,
            isDefault: false,
            canTransitionTo: ['approved'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        customer: {
            id: 'cust-123',
            name: 'Test Customer',
            email: 'test@example.com',
            isActive: true,
            userId: 'user-456'
        },
        items: [
            {
                product: {
                    id: 'prod-1',
                    name: 'Test Product',
                    price: 100,
                    stock: 10,
                    category: { id: 'cat-1', name: 'Category', description: 'Test', isActive: true },
                    unit: { id: 'unit-1', name: 'Unit', description: 'Test', isActive: true },
                    imgUrl: 'test.jpg',
                    isActive: true,
                    description: 'Test product',
                    taxRate: 21,
                    priceWithTax: 121,
                    tags: []
                },
                quantity: 1,
                unitPrice: 100,
                subtotal: 121
            }
        ],
        paymentMethod: {
            id: 'pay-1',
            description: 'Test Payment',
            isActive: true,
            requiresOnlinePayment: false,
            allowsManualConfirmation: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    beforeEach(async () => {
        const activatedRouteStub = {
            queryParamMap: of(new Map([
                ['saleId', 'sale-123'],
                ['payment_id', 'payment-456']
            ]))
        };

        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const paymentVerificationServiceSpy = jasmine.createSpyObj('PaymentVerificationService', ['verifyOrderStatus']);
        const orderNotificationServiceSpy = jasmine.createSpyObj('OrderNotificationService', ['sendManualNotification']);
        const orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrderById']);
        const orderInquiryServiceSpy = jasmine.createSpyObj('OrderInquiryService', ['getOrderById']);
        const cartServiceSpy = jasmine.createSpyObj('CartService', ['clearCart']);
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

        await TestBed.configureTestingModule({
            declarations: [PaymentSuccessComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                { provide: Router, useValue: routerSpy },
                { provide: PaymentVerificationService, useValue: paymentVerificationServiceSpy },
                { provide: OrderNotificationService, useValue: orderNotificationServiceSpy },
                { provide: OrderService, useValue: orderServiceSpy },
                { provide: OrderInquiryService, useValue: orderInquiryServiceSpy },
                { provide: CartService, useValue: cartServiceSpy },
                { provide: AuthService, useValue: authServiceSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        mockActivatedRoute = TestBed.inject(ActivatedRoute);
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        mockPaymentVerificationService = TestBed.inject(PaymentVerificationService) as jasmine.SpyObj<PaymentVerificationService>;
        mockOrderNotificationService = TestBed.inject(OrderNotificationService) as jasmine.SpyObj<OrderNotificationService>;
        mockOrderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
        mockOrderInquiryService = TestBed.inject(OrderInquiryService) as jasmine.SpyObj<OrderInquiryService>;
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
        mockOrderNotificationService.sendManualNotification.and.returnValue(of(mockNotificationResponse));
        mockOrderService.getOrderById.and.returnValue(of(mockAuthenticatedOrder as IOrder));
        mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));

        // NO llamar detectChanges aquí para evitar inicialización automática
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
            mockOrderNotificationService.sendManualNotification.and.returnValue(of(mockNotificationResponse));

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
            mockOrderNotificationService.sendManualNotification.and.returnValue(of(mockNotificationResponse));

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
            expect(mockOrderNotificationService.sendManualNotification).not.toHaveBeenCalled();
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
            mockOrderNotificationService.sendManualNotification.and.returnValue(of(mockNotificationResponse));

            await component['sendOrderNotification'](paymentData);

            expect(mockOrderNotificationService.sendManualNotification).toHaveBeenCalledWith({
                subject: 'Nueva orden en efectivo #sale-123',
                message: jasmine.any(String),
                emailTo: 'test@example.com'
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
            mockOrderNotificationService.sendManualNotification.and.returnValue(of(mockNotificationResponse));

            await component['sendOrderNotification'](paymentData);

            expect(mockOrderNotificationService.sendManualNotification).toHaveBeenCalledWith({
                subject: 'Orden pagada online #sale-123',
                message: jasmine.any(String),
                emailTo: 'test@example.com'
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
            mockOrderNotificationService.sendManualNotification.and.returnValue(throwError('Notification error'));

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

    // Tests específicos para usuarios invitados (según documentación)
    describe('Flujo Completo Usuario Invitado', () => {
        beforeEach(() => {
            // Setup: Usuario no autenticado
            mockAuthService.isAuthenticated.and.returnValue(false);
            component.orderId = 'order-123';
        });

        it('debe cargar datos públicos correctamente para usuario invitado', () => {
            // Configurar mocks específicos para este test
            mockAuthService.isAuthenticated.and.returnValue(false);
            mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));
            spyOn(window, 'setTimeout');

            component['loadOrderDetails']();

            expect(mockOrderInquiryService.getOrderById).toHaveBeenCalledWith('order-123');
            expect(component.orderDetails).toEqual(jasmine.objectContaining({
                id: 'order-123',
                total: 121
            }));
            expect(window.setTimeout).toHaveBeenCalled();
        });

        it('debe usar servicio público cuando usuario no está autenticado', () => {
            // Configurar mocks específicos para este test
            mockAuthService.isAuthenticated.and.returnValue(false);
            mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));

            component['loadOrderDetails']();

            expect(mockOrderInquiryService.getOrderById).toHaveBeenCalledWith('order-123');
            expect(mockOrderService.getOrderById).not.toHaveBeenCalled();
        });

        it('debe redirigir automáticamente después de 3 segundos para usuario invitado', fakeAsync(() => {
            mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));

            component['loadOrderDetails']();
            tick(3000);

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/order', 'order-123']);
        }));

        it('debe redirigir incluso si hay error cargando detalles públicos', fakeAsync(() => {
            mockOrderInquiryService.getOrderById.and.returnValue(throwError('Service error'));

            component['loadOrderDetails']();
            tick(2000);

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/order', 'order-123']);
        }));

        it('debe usar fallback a servicio público si servicio autenticado falla', () => {
            // Simular usuario autenticado inicialmente
            mockAuthService.isAuthenticated.and.returnValue(true);
            mockOrderService.getOrderById.and.returnValue(throwError('Auth service error'));
            mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));

            component['loadOrderDetails']();

            expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-123');
            expect(mockOrderInquiryService.getOrderById).toHaveBeenCalledWith('order-123');
            expect(component.orderDetails).toEqual(jasmine.objectContaining({
                id: 'order-123',
                total: 121
            }));
        });
    });

    describe('Servicios Duales - Autenticado vs Invitado', () => {
        beforeEach(() => {
            component.orderId = 'order-123';
        });

        it('debe usar OrderService para usuarios autenticados', () => {
            mockAuthService.isAuthenticated.and.returnValue(true);
            mockOrderService.getOrderById.and.returnValue(of(mockAuthenticatedOrder as IOrder));

            component['loadOrderDetails']();

            expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-123');
            expect(mockOrderInquiryService.getOrderById).not.toHaveBeenCalled();
            expect(component.orderDetails).toEqual(jasmine.objectContaining({
                id: 'order-123',
                total: 121
            }));
        });

        it('debe usar OrderInquiryService para usuarios invitados', () => {
            mockAuthService.isAuthenticated.and.returnValue(false);
            mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));

            component['loadOrderDetails']();

            expect(mockOrderInquiryService.getOrderById).toHaveBeenCalledWith('order-123');
            expect(mockOrderService.getOrderById).not.toHaveBeenCalled();
            expect(component.orderDetails).toEqual(jasmine.objectContaining({
                id: 'order-123',
                total: 121
            }));
        });
    });
});
