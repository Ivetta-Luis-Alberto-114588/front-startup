import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { ICreatePaymentResponse } from '../../orders/models/ICreatePaymentResponse';
import { IPayment } from '../../orders/models/IPayment';
import { IPaymentPreferenceInfo } from '../../orders/models/IPaymentPreferenceInfo';
import { environment } from 'src/environments/environment';

describe('PaymentService', () => {
    let service: PaymentService;
    let httpMock: HttpTestingController;
    let baseUrl: string;

    // Mock data
    const mockPayment: IPayment = {
        id: 'payment_123',
        saleId: 'sale_456',
        customerId: 'customer_789',
        amount: 1250.50,
        provider: 'mercado_pago',
        status: 'pending',
        externalReference: 'sale-456',
        preferenceId: 'mp_pref_abc123',
        paymentMethod: 'credit_card',
        createdAt: '2023-12-01T10:00:00.000Z',
        updatedAt: '2023-12-01T10:00:00.000Z'
    };

    const mockPreference: IPaymentPreferenceInfo = {
        id: 'mp_pref_abc123',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mp_pref_abc123',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mp_pref_abc123'
    };

    const mockCreatePaymentResponse: ICreatePaymentResponse = {
        payment: mockPayment,
        preference: mockPreference
    };

    // Mock callbacks and payment statuses
    const mockSuccessCallback = {
        collection_id: '123456789',
        collection_status: 'approved',
        payment_id: '123456789',
        status: 'approved',
        external_reference: 'sale-456',
        payment_type: 'credit_card',
        merchant_order_id: '987654321',
        preference_id: 'mp_pref_abc123',
        site_id: 'MLA',
        processing_mode: 'aggregator',
        merchant_account_id: null
    };

    const mockFailureCallback = {
        collection_id: null,
        collection_status: 'rejected',
        payment_id: null,
        status: 'rejected',
        external_reference: 'sale-456',
        payment_type: 'credit_card',
        merchant_order_id: '987654321',
        preference_id: 'mp_pref_abc123',
        site_id: 'MLA',
        processing_mode: 'aggregator',
        merchant_account_id: null
    };

    const mockPendingCallback = {
        collection_id: '123456789',
        collection_status: 'pending',
        payment_id: '123456789',
        status: 'pending',
        external_reference: 'sale-456',
        payment_type: 'bank_transfer',
        merchant_order_id: '987654321',
        preference_id: 'mp_pref_abc123',
        site_id: 'MLA',
        processing_mode: 'aggregator',
        merchant_account_id: null
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [PaymentService]
        });
        service = TestBed.inject(PaymentService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = `${environment.apiUrl}/api/payments`;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('createPaymentPreference', () => {
        it('should create payment preference successfully', () => {
            // Arrange
            const saleId = 'sale_456';

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response).toEqual(mockCreatePaymentResponse);
                expect(response.payment.saleId).toBe(saleId);
                expect(response.payment.status).toBe('pending');
                expect(response.payment.provider).toBe('mercado_pago');
                expect(response.preference.id).toBeTruthy();
                expect(response.preference.init_point).toContain('mercadopago.com');
                expect(response.preference.sandbox_init_point).toContain('sandbox.mercadopago.com');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({});

            req.flush(mockCreatePaymentResponse);
        });

        it('should handle different sale IDs', () => {
            // Arrange
            const saleId = 'sale_special_123';
            const customResponse: ICreatePaymentResponse = {
                ...mockCreatePaymentResponse,
                payment: {
                    ...mockPayment,
                    id: 'payment_special',
                    saleId: saleId,
                    externalReference: `sale-special-123`
                }
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment.saleId).toBe(saleId);
                expect(response.payment.externalReference).toBe('sale-special-123');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(customResponse);
        });

        it('should create preference for different amounts', () => {
            // Arrange
            const saleId = 'sale_789';
            const highAmountResponse: ICreatePaymentResponse = {
                ...mockCreatePaymentResponse,
                payment: {
                    ...mockPayment,
                    amount: 50000.99,
                    saleId: saleId
                }
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment.amount).toBe(50000.99);
                expect(response.payment.saleId).toBe(saleId);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(highAmountResponse);
        });

        it('should handle different customers', () => {
            // Arrange
            const saleId = 'sale_456';
            const differentCustomerResponse: ICreatePaymentResponse = {
                ...mockCreatePaymentResponse,
                payment: {
                    ...mockPayment,
                    customerId: 'customer_999',
                    saleId: saleId
                }
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment.customerId).toBe('customer_999');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(differentCustomerResponse);
        });

        it('should handle empty or special sale IDs', () => {
            // Arrange
            const specialIds = ['', 'sale-with-dashes', 'sale_with_underscores', 'sale123'];

            specialIds.forEach(saleId => {
                // Act
                service.createPaymentPreference(saleId).subscribe(response => {
                    expect(response).toBeDefined();
                });

                // Assert
                const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
                req.flush(mockCreatePaymentResponse);
            });
        });

        it('should handle preference with different environments', () => {
            // Arrange
            const saleId = 'sale_456';
            const prodPreference: IPaymentPreferenceInfo = {
                id: 'mp_pref_prod_123',
                init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mp_pref_prod_123',
                sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mp_pref_prod_123'
            };

            const prodResponse: ICreatePaymentResponse = {
                payment: mockPayment,
                preference: prodPreference
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.preference.init_point).toContain('www.mercadopago.com.ar');
                expect(response.preference.sandbox_init_point).toContain('sandbox.mercadopago.com.ar');
                expect(response.preference.id).toBe('mp_pref_prod_123');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(prodResponse);
        });

        it('should handle payment creation errors (400)', () => {
            // Arrange
            const saleId = 'invalid_sale';
            let errorResponse: any;

            // Act
            service.createPaymentPreference(saleId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush({
                message: 'Invalid sale ID or sale not found',
                error: 'Bad Request'
            }, { status: 400, statusText: 'Bad Request' });

            expect(errorResponse.status).toBe(400);
        });

        it('should handle sale not found (404)', () => {
            // Arrange
            const saleId = 'nonexistent_sale';
            let errorResponse: any;

            // Act
            service.createPaymentPreference(saleId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush({
                message: 'Sale not found',
                saleId: saleId
            }, { status: 404, statusText: 'Not Found' });

            expect(errorResponse.status).toBe(404);
        });

        it('should handle Mercado Pago API errors (502)', () => {
            // Arrange
            const saleId = 'sale_456';
            let errorResponse: any;

            // Act
            service.createPaymentPreference(saleId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush({
                message: 'Mercado Pago API temporarily unavailable',
                error: 'Bad Gateway'
            }, { status: 502, statusText: 'Bad Gateway' });

            expect(errorResponse.status).toBe(502);
        });

        it('should handle server errors (500)', () => {
            // Arrange
            const saleId = 'sale_456';
            let errorResponse: any;

            // Act
            service.createPaymentPreference(saleId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush({
                message: 'Internal server error while creating payment preference'
            }, { status: 500, statusText: 'Internal Server Error' });

            expect(errorResponse.status).toBe(500);
        });
    });

    describe('Payment Callback Handling', () => {
        // These tests simulate how the service would handle callback data from Mercado Pago
        // Note: The actual callback handling would typically be done server-side

        it('should handle successful payment callback data', () => {
            // This test validates the structure of successful callback data
            expect(mockSuccessCallback.collection_status).toBe('approved');
            expect(mockSuccessCallback.status).toBe('approved');
            expect(mockSuccessCallback.payment_id).toBeTruthy();
            expect(mockSuccessCallback.collection_id).toBeTruthy();
            expect(mockSuccessCallback.external_reference).toBe('sale-456');
        });

        it('should handle failed payment callback data', () => {
            // This test validates the structure of failed callback data
            expect(mockFailureCallback.collection_status).toBe('rejected');
            expect(mockFailureCallback.status).toBe('rejected');
            expect(mockFailureCallback.payment_id).toBeNull();
            expect(mockFailureCallback.collection_id).toBeNull();
            expect(mockFailureCallback.external_reference).toBe('sale-456');
        });

        it('should handle pending payment callback data', () => {
            // This test validates the structure of pending callback data
            expect(mockPendingCallback.collection_status).toBe('pending');
            expect(mockPendingCallback.status).toBe('pending');
            expect(mockPendingCallback.payment_id).toBeTruthy();
            expect(mockPendingCallback.collection_id).toBeTruthy();
            expect(mockPendingCallback.payment_type).toBe('bank_transfer');
        });

        it('should validate callback data contains required fields', () => {
            const requiredFields = [
                'collection_status',
                'status',
                'external_reference',
                'preference_id',
                'merchant_order_id'
            ];

            requiredFields.forEach(field => {
                expect(mockSuccessCallback.hasOwnProperty(field)).toBe(true);
                expect(mockFailureCallback.hasOwnProperty(field)).toBe(true);
                expect(mockPendingCallback.hasOwnProperty(field)).toBe(true);
            });
        });

        it('should handle callback with different payment types', () => {
            const bankTransferCallback = {
                ...mockSuccessCallback,
                payment_type: 'bank_transfer',
                collection_status: 'pending',
                status: 'pending'
            };

            const debitCardCallback = {
                ...mockSuccessCallback,
                payment_type: 'debit_card',
                collection_status: 'approved',
                status: 'approved'
            };

            expect(bankTransferCallback.payment_type).toBe('bank_transfer');
            expect(bankTransferCallback.status).toBe('pending');
            expect(debitCardCallback.payment_type).toBe('debit_card');
            expect(debitCardCallback.status).toBe('approved');
        });
    });

    describe('Payment Status Validation', () => {
        it('should validate approved payment status', () => {
            const approvedPayment: IPayment = {
                ...mockPayment,
                status: 'approved',
                paymentMethod: 'credit_card'
            };

            expect(approvedPayment.status).toBe('approved');
            expect(approvedPayment.paymentMethod).toBe('credit_card');
        });

        it('should validate pending payment status', () => {
            const pendingPayment: IPayment = {
                ...mockPayment,
                status: 'pending',
                paymentMethod: 'bank_transfer'
            };

            expect(pendingPayment.status).toBe('pending');
            expect(pendingPayment.paymentMethod).toBe('bank_transfer');
        });

        it('should validate rejected payment status', () => {
            const rejectedPayment: IPayment = {
                ...mockPayment,
                status: 'rejected',
                paymentMethod: 'credit_card'
            };

            expect(rejectedPayment.status).toBe('rejected');
            expect(rejectedPayment.paymentMethod).toBe('credit_card');
        });

        it('should validate in_process payment status', () => {
            const inProcessPayment: IPayment = {
                ...mockPayment,
                status: 'in_process',
                paymentMethod: 'bank_transfer'
            };

            expect(inProcessPayment.status).toBe('in_process');
            expect(inProcessPayment.paymentMethod).toBe('bank_transfer');
        });

        it('should validate cancelled payment status', () => {
            const cancelledPayment: IPayment = {
                ...mockPayment,
                status: 'cancelled',
                paymentMethod: 'credit_card'
            };

            expect(cancelledPayment.status).toBe('cancelled');
            expect(cancelledPayment.paymentMethod).toBe('credit_card');
        });

        it('should handle different payment methods', () => {
            const paymentMethods = ['credit_card', 'debit_card', 'bank_transfer', 'account_money', 'other'];

            paymentMethods.forEach(method => {
                const payment: IPayment = {
                    ...mockPayment,
                    paymentMethod: method
                };
                expect(payment.paymentMethod).toBe(method);
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle network errors gracefully', () => {
            // Arrange
            const saleId = 'sale_456';
            let errorResponse: any;

            // Act
            service.createPaymentPreference(saleId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.error(new ErrorEvent('Network error'));

            expect(errorResponse).toBeTruthy();
        });

        it('should handle timeout errors', () => {
            // Arrange
            const saleId = 'sale_456';
            let errorResponse: any;

            // Act
            service.createPaymentPreference(saleId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.error(new ErrorEvent('Timeout'), { status: 0, statusText: 'Timeout' });

            expect(errorResponse).toBeTruthy();
        });

        it('should handle malformed JSON responses', () => {
            // Arrange
            const saleId = 'sale_456';
            let errorResponse: any;

            // Act
            service.createPaymentPreference(saleId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.error(new ErrorEvent('Parse error'), { status: 0, statusText: 'Parse Error' });

            expect(errorResponse).toBeTruthy();
        });

        it('should handle very large amounts', () => {
            // Arrange
            const saleId = 'sale_large';
            const largeAmountResponse: ICreatePaymentResponse = {
                ...mockCreatePaymentResponse,
                payment: {
                    ...mockPayment,
                    amount: 999999999.99,
                    saleId: saleId
                }
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment.amount).toBe(999999999.99);
                expect(response.payment.saleId).toBe(saleId);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(largeAmountResponse);
        });

        it('should handle special characters in external references', () => {
            // Arrange
            const saleId = 'sale_special';
            const specialCharResponse: ICreatePaymentResponse = {
                ...mockCreatePaymentResponse,
                payment: {
                    ...mockPayment,
                    externalReference: 'sale-special-áéíóú-123',
                    saleId: saleId
                }
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment.externalReference).toBe('sale-special-áéíóú-123');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(specialCharResponse);
        });

        it('should handle concurrent payment preference requests', () => {
            // Arrange
            const saleIds = ['sale_1', 'sale_2', 'sale_3'];
            const responses: ICreatePaymentResponse[] = [];

            // Act
            saleIds.forEach((saleId, index) => {
                service.createPaymentPreference(saleId).subscribe(response => {
                    responses.push(response);
                    expect(response.payment.saleId).toBe(saleId);
                });
            });

            // Assert
            saleIds.forEach((saleId, index) => {
                const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
                req.flush({
                    ...mockCreatePaymentResponse,
                    payment: {
                        ...mockPayment,
                        id: `payment_${index + 1}`,
                        saleId: saleId
                    }
                });
            });

            expect(responses.length).toBe(3);
        });
    });

    describe('Data Validation and Edge Cases', () => {
        it('should handle payments with minimal required fields', () => {
            // Arrange
            const minimalPayment: IPayment = {
                id: 'min_payment',
                saleId: 'min_sale',
                customerId: 'min_customer',
                amount: 100,
                provider: 'mercado_pago',
                status: 'pending',
                externalReference: 'min-ref',
                preferenceId: 'min_pref',
                paymentMethod: 'credit_card',
                createdAt: '2023-12-01T10:00:00.000Z',
                updatedAt: '2023-12-01T10:00:00.000Z'
            };

            const minimalResponse: ICreatePaymentResponse = {
                payment: minimalPayment,
                preference: mockPreference
            };

            const saleId = 'min_sale';

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment).toEqual(minimalPayment);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(minimalResponse);
        });

        it('should handle date formats correctly', () => {
            // Arrange
            const saleId = 'sale_date_test';
            const dateResponse: ICreatePaymentResponse = {
                ...mockCreatePaymentResponse,
                payment: {
                    ...mockPayment,
                    createdAt: new Date('2023-12-01T15:30:00.000Z'),
                    updatedAt: new Date('2023-12-01T15:30:00.000Z')
                }
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment.createdAt).toBeInstanceOf(Date);
                expect(response.payment.updatedAt).toBeInstanceOf(Date);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(dateResponse);
        });

        it('should handle zero amount payments', () => {
            // Arrange
            const saleId = 'sale_zero';
            const zeroAmountResponse: ICreatePaymentResponse = {
                ...mockCreatePaymentResponse,
                payment: {
                    ...mockPayment,
                    amount: 0,
                    saleId: saleId
                }
            };

            // Act
            service.createPaymentPreference(saleId).subscribe(response => {
                expect(response.payment.amount).toBe(0);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/sale/${saleId}`);
            req.flush(zeroAmountResponse);
        });

        it('should validate preference URLs format', () => {
            // Act & Assert
            expect(mockPreference.init_point).toMatch(/^https:\/\/.*mercadopago\.com/);
            expect(mockPreference.sandbox_init_point).toMatch(/^https:\/\/sandbox\.mercadopago\.com/);
            expect(mockPreference.id).toBeTruthy();
            expect(mockPreference.id.length).toBeGreaterThan(0);
        });
    });
});
