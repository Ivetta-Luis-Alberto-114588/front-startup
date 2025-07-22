import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { PaymentStatusDisplayComponent } from './payment-status-display.component';
import { PaymentService } from '../../services/payment.service';
import { IPaymentStatusResponse } from '../../models/IPaymentStatusResponse';

describe('PaymentStatusDisplayComponent', () => {
    let component: PaymentStatusDisplayComponent;
    let fixture: ComponentFixture<PaymentStatusDisplayComponent>;
    let mockPaymentService: jasmine.SpyObj<PaymentService>;

    const mockPaymentStatusResponse: IPaymentStatusResponse = {
        success: true,
        payment: {
            id: 'payment-123',
            saleId: 'sale-456',
            customerId: 'customer-789',
            amount: 100.50,
            provider: 'MercadoPago',
            status: 'approved',
            externalReference: 'ext-ref-123',
            preferenceId: 'pref-456',
            paymentMethod: 'Tarjeta de Crédito',
            idempotencyKey: 'idem-key-789',
            lastVerified: '2025-01-01T10:00:00Z',
            createdAt: '2025-01-01T09:00:00Z',
            updatedAt: '2025-01-01T10:00:00Z',
            mercadoPagoPaymentId: '987654321',
            mercadoPagoStatus: 'approved',
            transactionAmount: 100.50,
            dateApproved: '2025-01-01T10:00:00Z'
        },
        verification: {
            oauthVerified: true,
            realStatus: 'approved',
            verifiedAt: '2025-01-01T10:00:00Z',
            statusMatch: true
        }
    };

    beforeEach(async () => {
        const paymentServiceSpy = jasmine.createSpyObj('PaymentService', ['getPaymentStatusBySale']);

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            declarations: [PaymentStatusDisplayComponent],
            providers: [
                { provide: PaymentService, useValue: paymentServiceSpy }
            ]
        }).compileComponents();

        mockPaymentService = TestBed.inject(PaymentService) as jasmine.SpyObj<PaymentService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentStatusDisplayComponent);
        component = fixture.componentInstance;
        component.saleId = 'test-sale-123';
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should load payment status when saleId is provided', () => {
            spyOn(component, 'loadPaymentStatus');
            component.saleId = 'test-sale-123';

            component.ngOnInit();

            expect(component.loadPaymentStatus).toHaveBeenCalled();
        });

        it('should not load payment status when saleId is not provided', () => {
            spyOn(component, 'loadPaymentStatus');
            component.saleId = '';

            component.ngOnInit();

            expect(component.loadPaymentStatus).not.toHaveBeenCalled();
        });
    });

    describe('loadPaymentStatus', () => {
        it('should load payment status successfully', () => {
            mockPaymentService.getPaymentStatusBySale.and.returnValue(of(mockPaymentStatusResponse));

            component.loadPaymentStatus();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(component.paymentStatus).toEqual(jasmine.objectContaining({
                success: true,
                payment: jasmine.objectContaining({
                    status: 'approved',
                    amount: 100.50
                })
            }));
        });

        it('should handle 401 error with specific message for authenticated user', () => {
            const error = { status: 401 };
            mockPaymentService.getPaymentStatusBySale.and.returnValue(throwError(error));
            spyOn(component['authService'], 'isAuthenticated').and.returnValue(true);

            component.loadPaymentStatus();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBe('Se requiere autenticación para ver los detalles completos del pago');
            expect(component.paymentStatus).toBeNull();
        });

        it('should handle 401 error with null message for guest user', () => {
            const error = { status: 401 };
            mockPaymentService.getPaymentStatusBySale.and.returnValue(throwError(error));
            spyOn(component['authService'], 'isAuthenticated').and.returnValue(false);

            component.loadPaymentStatus();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(component.paymentStatus).toBeNull();
        });

        it('should handle general error with default message', () => {
            const error = { status: 500 };
            mockPaymentService.getPaymentStatusBySale.and.returnValue(throwError(error));

            component.loadPaymentStatus();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBe('No se pudo cargar la información del pago');
            expect(component.paymentStatus).toBeNull();
        });
    });

    describe('normalizePaymentStatus', () => {
        it('should normalize payment status from object with status object', () => {
            const rawResponse = {
                payment: {
                    id: 'payment-123',
                    saleId: 'sale-456',
                    amount: 100,
                    status: { code: 'approved', name: 'Approved' },
                    notes: 'Payment ID MercadoPago: 987654321'
                }
            };

            const result = component['normalizePaymentStatus'](rawResponse);

            expect(result.payment.status).toBe('approved');
            expect(result.payment.mercadoPagoPaymentId).toBe('987654321');
        });

        it('should extract MercadoPago Payment ID from notes', () => {
            const rawResponse = {
                payment: {
                    id: 'payment-123',
                    notes: 'Some text. Payment ID MercadoPago: 123456789. More text.'
                }
            };

            const result = component['normalizePaymentStatus'](rawResponse);

            expect(result.payment.mercadoPagoPaymentId).toBe('123456789');
        });

        it('should handle payment object without nested payment property', () => {
            const rawResponse = {
                id: 'payment-123',
                saleId: 'sale-456',
                amount: 100,
                status: 'paid'
            };

            const result = component['normalizePaymentStatus'](rawResponse);

            expect(result.payment.id).toBe('payment-123');
            expect(result.payment.status).toBe('paid');
        });

        it('should handle verification data when present', () => {
            const rawResponse = {
                payment: { id: 'payment-123', status: 'approved' },
                verification: {
                    oauthVerified: true,
                    realStatus: 'approved',
                    verifiedAt: '2025-01-01T10:00:00Z',
                    statusMatch: true
                }
            };

            const result = component['normalizePaymentStatus'](rawResponse);

            expect(result.verification).toEqual({
                oauthVerified: true,
                realStatus: 'approved',
                verifiedAt: '2025-01-01T10:00:00Z',
                statusMatch: true
            });
        });
    });

    describe('getStatusBadgeClass', () => {
        it('should return success class for approved status', () => {
            expect(component.getStatusBadgeClass('approved')).toBe('bg-success');
            expect(component.getStatusBadgeClass('pagado')).toBe('bg-success');
            expect(component.getStatusBadgeClass('paid')).toBe('bg-success');
            expect(component.getStatusBadgeClass('completado')).toBe('bg-success');
        });

        it('should return warning class for pending status', () => {
            expect(component.getStatusBadgeClass('pending')).toBe('bg-warning text-dark');
            expect(component.getStatusBadgeClass('pendiente')).toBe('bg-warning text-dark');
            expect(component.getStatusBadgeClass('pendiente pagado')).toBe('bg-warning text-dark');
            expect(component.getStatusBadgeClass('pending_payment')).toBe('bg-warning text-dark');
        });

        it('should return danger class for failed status', () => {
            expect(component.getStatusBadgeClass('rejected')).toBe('bg-danger');
            expect(component.getStatusBadgeClass('cancelled')).toBe('bg-danger');
            expect(component.getStatusBadgeClass('rechazado')).toBe('bg-danger');
            expect(component.getStatusBadgeClass('failed')).toBe('bg-danger');
        });

        it('should return info class for processing status', () => {
            expect(component.getStatusBadgeClass('in_process')).toBe('bg-info');
            expect(component.getStatusBadgeClass('processing')).toBe('bg-info');
            expect(component.getStatusBadgeClass('en_proceso')).toBe('bg-info');
        });

        it('should handle unknown status by checking patterns', () => {
            expect(component.getStatusBadgeClass('custom_pagado_status')).toBe('bg-success');
            expect(component.getStatusBadgeClass('some_pending_status')).toBe('bg-warning text-dark');
            expect(component.getStatusBadgeClass('error_occurred')).toBe('bg-danger');
            expect(component.getStatusBadgeClass('unknown_status')).toBe('bg-secondary');
        });

        it('should handle invalid status gracefully', () => {
            expect(component.getStatusBadgeClass('')).toBe('bg-secondary');
            expect(component.getStatusBadgeClass(null as any)).toBe('bg-secondary');
            expect(component.getStatusBadgeClass(undefined as any)).toBe('bg-secondary');
            expect(component.getStatusBadgeClass(123 as any)).toBe('bg-secondary');
        });
    });

    describe('getStatusIcon', () => {
        it('should return check icon for success status', () => {
            expect(component.getStatusIcon('approved')).toBe('bi-check-circle-fill');
            expect(component.getStatusIcon('pagado')).toBe('bi-check-circle-fill');
            expect(component.getStatusIcon('paid')).toBe('bi-check-circle-fill');
        });

        it('should return clock icon for pending status', () => {
            expect(component.getStatusIcon('pending')).toBe('bi-clock-fill');
            expect(component.getStatusIcon('pendiente')).toBe('bi-clock-fill');
            expect(component.getStatusIcon('pendiente pagado')).toBe('bi-clock-fill');
        });

        it('should return x icon for failed status', () => {
            expect(component.getStatusIcon('rejected')).toBe('bi-x-circle-fill');
            expect(component.getStatusIcon('cancelled')).toBe('bi-x-circle-fill');
            expect(component.getStatusIcon('failed')).toBe('bi-x-circle-fill');
        });

        it('should return gear icon for processing status', () => {
            expect(component.getStatusIcon('in_process')).toBe('bi-gear-fill');
            expect(component.getStatusIcon('processing')).toBe('bi-gear-fill');
            expect(component.getStatusIcon('en_proceso')).toBe('bi-gear-fill');
        });

        it('should handle invalid status gracefully', () => {
            expect(component.getStatusIcon('')).toBe('bi-question-circle-fill');
            expect(component.getStatusIcon(null as any)).toBe('bi-question-circle-fill');
            expect(component.getStatusIcon(undefined as any)).toBe('bi-question-circle-fill');
        });
    });

    describe('refresh', () => {
        it('should call loadPaymentStatus', () => {
            spyOn(component, 'loadPaymentStatus');

            component.refresh();

            expect(component.loadPaymentStatus).toHaveBeenCalled();
        });
    });

    describe('component inputs', () => {
        it('should have default values for inputs', () => {
            expect(component.showTitle).toBe(true);
            expect(component.compact).toBe(false);
        });

        it('should accept input changes', () => {
            component.showTitle = false;
            component.compact = true;

            expect(component.showTitle).toBe(false);
            expect(component.compact).toBe(true);
        });
    });

    describe('copyToClipboard', () => {
        let originalClipboard: any;

        beforeEach(() => {
            // Save original clipboard
            originalClipboard = navigator.clipboard;

            // Mock navigator.clipboard
            const mockClipboard = {
                writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
            };

            Object.defineProperty(navigator, 'clipboard', {
                value: mockClipboard,
                writable: true
            });
        });

        afterEach(() => {
            // Restore original clipboard
            Object.defineProperty(navigator, 'clipboard', {
                value: originalClipboard,
                writable: true
            });
        });

        it('should use navigator.clipboard when available', async () => {
            const text = 'test-payment-id';
            spyOn(console, 'log');

            component.copyToClipboard(text);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
        });

        it('should handle clipboard error gracefully', async () => {
            const text = 'test-payment-id';
            (navigator.clipboard.writeText as jasmine.Spy).and.returnValue(Promise.reject('Error'));
            spyOn(console, 'error');

            component.copyToClipboard(text);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
        });

        it('should use fallback when clipboard API is not available', () => {
            // Remove clipboard from navigator
            Object.defineProperty(navigator, 'clipboard', {
                value: undefined,
                writable: true
            });

            const text = 'test-payment-id';
            spyOn(document, 'createElement').and.callThrough();
            spyOn(document.body, 'appendChild').and.stub();
            spyOn(document.body, 'removeChild').and.stub();
            spyOn(document, 'execCommand').and.returnValue(true);

            component.copyToClipboard(text);

            expect(document.createElement).toHaveBeenCalledWith('textarea');
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });
    });
});
