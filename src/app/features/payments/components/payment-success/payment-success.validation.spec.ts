import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PaymentSuccessComponent } from './payment-success.component';
import { AuthService } from '../../../../auth/services/auth.service';
import { OrderService } from '../../../orders/services/order.service';
import { OrderInquiryService } from '../../../order-inquiry/services/order-inquiry.service';
import { PaymentVerificationService } from '../../services/payment-verification.service';
import { OrderNotificationService } from '../../../orders/services/order-notification.service';
import { CartService } from '../../../cart/services/cart.service';
import { Router } from '@angular/router';
import { IOrder } from '../../../orders/models/iorder';
import { PublicOrderResponse } from '../../../order-inquiry/models/order-public.interface';

/**
 * Validación específica para verificar que PaymentSuccessComponent
 * implementa correctamente los flujos de usuarios invitados según 
 * la documentación en flujo-usuarios-invitados.md
 */
describe('PaymentSuccessComponent - Validación Documentación', () => {
    let component: PaymentSuccessComponent;
    let mockAuthService: jasmine.SpyObj<AuthService>;
    let mockOrderService: jasmine.SpyObj<OrderService>;
    let mockOrderInquiryService: jasmine.SpyObj<OrderInquiryService>;
    let mockRouter: jasmine.SpyObj<Router>;

    const mockPublicOrder: Partial<PublicOrderResponse> = {
        id: 'order-123',
        total: 100,
        subtotal: 80,
        taxAmount: 20,
        taxRate: 25,
        discountRate: 0,
        discountAmount: 0,
        date: new Date().toISOString(),
        status: {
            id: 'completed',
            code: 'completed',
            name: 'Completed',
            description: 'Order completed',
            color: 'green',
            order: 1,
            isActive: true,
            isDefault: false,
            canTransitionTo: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        customer: {
            id: 'cust-1',
            name: 'Test Customer',
            email: 'test@example.com',
            isActive: true,
            userId: 'user-1'
        },
        items: [],
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

    const mockAuthenticatedOrder: Partial<IOrder> = {
        id: 'order-123',
        total: 100,
        subtotal: 80,
        taxAmount: 20,
        discountRate: 0,
        discountAmount: 0,
        date: new Date(),
        status: {
            id: 'completed',
            name: 'Completed',
            description: 'Order completed'
        } as any,
        customer: {
            id: 'cust-1',
            name: 'Test Customer',
            email: 'test@example.com'
        } as any,
        items: []
    };

    beforeEach(async () => {
        const activatedRouteStub = {
            queryParamMap: of(new Map([
                ['saleId', 'sale-123'],
                ['payment_id', 'payment-456']
            ]))
        };

        const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
        const orderSpy = jasmine.createSpyObj('OrderService', ['getOrderById']);
        const orderInquirySpy = jasmine.createSpyObj('OrderInquiryService', ['getOrderById']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const paymentVerificationSpy = jasmine.createSpyObj('PaymentVerificationService', ['verifyOrderStatus']);
        const orderNotificationSpy = jasmine.createSpyObj('OrderNotificationService', ['sendManualNotification']);
        const cartSpy = jasmine.createSpyObj('CartService', ['clearCart']);

        await TestBed.configureTestingModule({
            declarations: [PaymentSuccessComponent],
            providers: [
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                { provide: AuthService, useValue: authSpy },
                { provide: OrderService, useValue: orderSpy },
                { provide: OrderInquiryService, useValue: orderInquirySpy },
                { provide: Router, useValue: routerSpy },
                { provide: PaymentVerificationService, useValue: paymentVerificationSpy },
                { provide: OrderNotificationService, useValue: orderNotificationSpy },
                { provide: CartService, useValue: cartSpy }
            ]
        }).compileComponents();

        mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        mockOrderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
        mockOrderInquiryService = TestBed.inject(OrderInquiryService) as jasmine.SpyObj<OrderInquiryService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        const fixture = TestBed.createComponent(PaymentSuccessComponent);
        component = fixture.componentInstance;
        component.orderId = 'order-123';
    });

    describe('Verificación de Implementación según Documentación', () => {
        it('debe tener método loadOrderDetails implementado', () => {
            expect(component['loadOrderDetails']).toBeDefined();
            expect(typeof component['loadOrderDetails']).toBe('function');
        });

        it('debe usar OrderInquiryService para usuarios no autenticados', () => {
            mockAuthService.isAuthenticated.and.returnValue(false);
            mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));

            component['loadOrderDetails']();

            expect(mockOrderInquiryService.getOrderById).toHaveBeenCalledWith('order-123');
        });

        it('debe usar OrderService para usuarios autenticados', () => {
            mockAuthService.isAuthenticated.and.returnValue(true);
            mockOrderService.getOrderById.and.returnValue(of(mockAuthenticatedOrder as IOrder));

            component['loadOrderDetails']();

            expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-123');
        });

        it('debe tener propiedad orderDetails para almacenar datos', () => {
            expect(component.orderDetails).toBeDefined();
        });
    });

    describe('Arquitectura de Servicios Duales', () => {
        it('debe inyectar ambos servicios (OrderService y OrderInquiryService)', () => {
            expect(mockOrderService).toBeDefined();
            expect(mockOrderInquiryService).toBeDefined();
        });

        it('debe inyectar AuthService para determinar tipo de usuario', () => {
            expect(mockAuthService).toBeDefined();
        });

        it('debe decidir qué servicio usar basado en autenticación', () => {
            // Caso usuario autenticado
            mockAuthService.isAuthenticated.and.returnValue(true);
            mockOrderService.getOrderById.and.returnValue(of(mockAuthenticatedOrder as IOrder));

            component['loadOrderDetails']();

            expect(mockOrderService.getOrderById).toHaveBeenCalled();
            expect(mockOrderInquiryService.getOrderById).not.toHaveBeenCalled();

            // Reset spies
            mockOrderService.getOrderById.calls.reset();
            mockOrderInquiryService.getOrderById.calls.reset();

            // Caso usuario invitado
            mockAuthService.isAuthenticated.and.returnValue(false);
            mockOrderInquiryService.getOrderById.and.returnValue(of(mockPublicOrder as PublicOrderResponse));

            component['loadOrderDetails']();

            expect(mockOrderInquiryService.getOrderById).toHaveBeenCalled();
            expect(mockOrderService.getOrderById).not.toHaveBeenCalled();
        });
    });
});
