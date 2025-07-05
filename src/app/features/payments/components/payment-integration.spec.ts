import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PaymentStatusDisplayComponent } from './payment-status-display/payment-status-display.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentService } from '../services/payment.service';
import { PaymentVerificationService, OrderStatusResponse } from '../services/payment-verification.service';
import { OrderNotificationService, NotificationResponse } from '../../orders/services/order-notification.service';
import { CartService } from '../../cart/services/cart.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { IPaymentStatusResponse } from '../models/IPaymentStatusResponse';

describe('Payment Components Integration Tests', () => {
    describe('Payment Status Display Integration', () => {
        let component: PaymentStatusDisplayComponent;
        let fixture: ComponentFixture<PaymentStatusDisplayComponent>;
        let mockPaymentService: jasmine.SpyObj<PaymentService>;

        beforeEach(async () => {
            const paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['getPaymentStatusBySale']);

            await TestBed.configureTestingModule({
                declarations: [PaymentStatusDisplayComponent],
                providers: [
                    { provide: PaymentService, useValue: paymentServiceSpy }
                ]
            }).compileComponents();

            mockPaymentService = TestBed.inject(PaymentService) as jasmine.SpyObj<PaymentService>;
            fixture = TestBed.createComponent(PaymentStatusDisplayComponent);
            component = fixture.componentInstance;
            component.saleId = 'test-sale-123';
        });

        it('should handle real-world backend response format with nested status object', () => {
            const realWorldResponse = {
                success: true,
                payment: {
                    id: 'payment-123',
                    saleId: 'sale-456',
                    amount: 150.75,
                    status: {
                        code: 'PENDIENTE PAGADO',
                        name: 'Pendiente Pagado',
                        description: 'Pago pendiente de confirmación'
                    },
                    notes: 'Pago realizado con MercadoPago. Payment ID MercadoPago: 987654321',
                    provider: 'MercadoPago',
                    externalReference: 'MP-REF-123456',
                    customer_id: 'customer-789',
                    created_at: '2025-01-01T09:00:00Z'
                },
                verification: {
                    oauthVerified: true,
                    realStatus: 'approved',
                    verifiedAt: '2025-01-01T10:00:00Z',
                    statusMatch: false
                }
            };

            mockPaymentService.getPaymentStatusBySale.and.returnValue(of(realWorldResponse as any));

            component.loadPaymentStatus();

            expect(component.paymentStatus).toBeTruthy();
            expect(component.paymentStatus!.payment.status).toBe('PENDIENTE PAGADO');
            expect(component.paymentStatus!.payment.mercadoPagoPaymentId).toBe('987654321');
            expect(component.paymentStatus!.payment.externalReference).toBe('MP-REF-123456');
            expect(component.paymentStatus!.verification?.statusMatch).toBe(false);

            // Test badge class for complex status
            expect(component.getStatusBadgeClass('PENDIENTE PAGADO')).toBe('bg-warning text-dark');

            // Test icon for complex status
            expect(component.getStatusIcon('PENDIENTE PAGADO')).toBe('bi-clock-fill');
        });

        it('should handle backend response without payment wrapper', () => {
            const flatResponse = {
                id: 'payment-123',
                saleId: 'sale-456',
                amount: 100,
                status: 'approved',
                total: 100,
                customer: {
                    email: 'customer@example.com'
                }
            };

            mockPaymentService.getPaymentStatusBySale.and.returnValue(of(flatResponse as any));

            component.loadPaymentStatus();

            expect(component.paymentStatus).toBeTruthy();
            expect(component.paymentStatus!.payment.id).toBe('payment-123');
            expect(component.paymentStatus!.payment.status).toBe('approved');
            expect(component.paymentStatus!.payment.amount).toBe(100);
        });

        it('should extract MercadoPago Payment ID from various note formats', () => {
            const testCases = [
                {
                    notes: 'Payment ID MercadoPago: 123456789',
                    expected: '123456789'
                },
                {
                    notes: 'Procesado correctamente. Payment ID MercadoPago: 987654321. Confirmado.',
                    expected: '987654321'
                },
                {
                    notes: 'payment id mercadopago: 555666777',
                    expected: '555666777'
                },
                {
                    notes: 'Sin información de MercadoPago',
                    expected: undefined
                }
            ];

            testCases.forEach(testCase => {
                const response = {
                    payment: {
                        id: 'payment-123',
                        notes: testCase.notes
                    }
                };

                const normalized = component['normalizePaymentStatus'](response);
                expect(normalized.payment.mercadoPagoPaymentId).toBe(testCase.expected);
            });
        });
    });

    describe('Payment Success Integration', () => {
        let component: PaymentSuccessComponent;
        let fixture: ComponentFixture<PaymentSuccessComponent>;
        let mockPaymentVerificationService: jasmine.SpyObj<PaymentVerificationService>;
        let mockOrderNotificationService: jasmine.SpyObj<OrderNotificationService>;
        let mockCartService: jasmine.SpyObj<CartService>;
        let mockAuthService: jasmine.SpyObj<AuthService>;

        beforeEach(async () => {
            const activatedRouteStub = {
                queryParamMap: of(new Map([
                    ['saleId', 'integration-test-123'],
                    ['payment_id', 'mp-payment-456']
                ]))
            };

            const paymentVerificationServiceSpy = jasmine.createSpyObj('PaymentVerificationService', ['verifyOrderStatus']);
            const orderNotificationServiceSpy = jasmine.createSpyObj('OrderNotificationService', ['sendOrderPaidNotification', 'sendCashOrderNotification']);
            const cartServiceSpy = jasmine.createSpyObj('CartService', ['clearCart']);
            const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

            await TestBed.configureTestingModule({
                declarations: [PaymentSuccessComponent],
                providers: [
                    { provide: ActivatedRoute, useValue: activatedRouteStub },
                    { provide: PaymentVerificationService, useValue: paymentVerificationServiceSpy },
                    { provide: OrderNotificationService, useValue: orderNotificationServiceSpy },
                    { provide: CartService, useValue: cartServiceSpy },
                    { provide: AuthService, useValue: authServiceSpy }
                ]
            }).compileComponents();

            mockPaymentVerificationService = TestBed.inject(PaymentVerificationService) as jasmine.SpyObj<PaymentVerificationService>;
            mockOrderNotificationService = TestBed.inject(OrderNotificationService) as jasmine.SpyObj<OrderNotificationService>;
            mockCartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
            mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

            fixture = TestBed.createComponent(PaymentSuccessComponent);
            component = fixture.componentInstance;
        });

        it('should handle complete payment flow with complex status object', async () => {
            const complexOrderStatus: OrderStatusResponse = {
                saleId: 'integration-test-123',
                status: 'PENDIENTE PAGADO' as any, // Real status that should be considered successful
                total: 250.50,
                customerEmail: 'integration@test.com',
                paymentMethod: 'MercadoPago'
            };

            mockPaymentVerificationService.verifyOrderStatus.and.returnValue(of(complexOrderStatus));
            mockOrderNotificationService.sendOrderPaidNotification.and.returnValue(of({
                success: true,
                message: 'Integration test notification sent'
            }));
            mockCartService.clearCart.and.returnValue(of({} as any));
            mockAuthService.isAuthenticated.and.returnValue(true);

            // Initialize the component to set up orderId and paymentId from route
            component.ngOnInit();

            // This test verifies the complete flow
            await component['verifyPaymentAndNotify']();

            expect(component.verificationComplete).toBe(true);
            expect(component.orderId).toBe('integration-test-123'); // From route params
            expect(component.paymentId).toBe('mp-payment-456'); // From route params

            // Verify that complex status is detected as successful
            expect(component['isPaymentStatusSuccessful']('PENDIENTE PAGADO')).toBe(true);
        });

        it('should detect successful payment statuses in various formats', () => {
            const successfulStatuses = [
                'approved',
                'PAGADO',
                'paid',
                'PENDIENTE PAGADO',
                'success',
                'APROVADO',
                { code: 'approved', name: 'Approved' },
                { name: 'pagado' },
                { status: 'paid' }
            ];

            successfulStatuses.forEach(status => {
                expect(component['isPaymentStatusSuccessful'](status)).toBe(true,
                    `Status ${JSON.stringify(status)} should be considered successful`);
            });
        });

        it('should reject non-successful payment statuses', () => {
            const nonSuccessfulStatuses = [
                'pending',
                'rejected',
                'cancelled',
                'failed',
                'error',
                { code: 'pending' },
                { name: 'rejected' },
                null,
                undefined,
                ''
            ];

            nonSuccessfulStatuses.forEach(status => {
                expect(component['isPaymentStatusSuccessful'](status)).toBe(false,
                    `Status ${JSON.stringify(status)} should not be considered successful`);
            });
        });
    });

    describe('Status Badge and Icon Integration', () => {
        let component: PaymentStatusDisplayComponent;
        let fixture: ComponentFixture<PaymentStatusDisplayComponent>;

        beforeEach(async () => {
            const paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['getPaymentStatusBySale']);

            await TestBed.configureTestingModule({
                declarations: [PaymentStatusDisplayComponent],
                providers: [
                    { provide: PaymentService, useValue: paymentServiceSpy }
                ]
            }).compileComponents();

            fixture = TestBed.createComponent(PaymentStatusDisplayComponent);
            component = fixture.componentInstance;
        });

        it('should provide consistent badge classes and icons for all status types', () => {
            const statusTestCases = [
                {
                    status: 'approved',
                    expectedBadge: 'bg-success',
                    expectedIcon: 'bi-check-circle-fill'
                },
                {
                    status: 'PENDIENTE PAGADO',
                    expectedBadge: 'bg-warning text-dark',
                    expectedIcon: 'bi-clock-fill'
                },
                {
                    status: 'rejected',
                    expectedBadge: 'bg-danger',
                    expectedIcon: 'bi-x-circle-fill'
                },
                {
                    status: 'processing',
                    expectedBadge: 'bg-info',
                    expectedIcon: 'bi-gear-fill'
                },
                {
                    status: 'unknown_status',
                    expectedBadge: 'bg-secondary',
                    expectedIcon: 'bi-question-circle-fill'
                }
            ];

            statusTestCases.forEach(testCase => {
                expect(component.getStatusBadgeClass(testCase.status)).toBe(testCase.expectedBadge,
                    `Badge class for ${testCase.status} should be ${testCase.expectedBadge}`);
                expect(component.getStatusIcon(testCase.status)).toBe(testCase.expectedIcon,
                    `Icon for ${testCase.status} should be ${testCase.expectedIcon}`);
            });
        });
    });
});
