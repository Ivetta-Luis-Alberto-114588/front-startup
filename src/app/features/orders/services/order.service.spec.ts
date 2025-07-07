import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { IOrder } from '../models/iorder';
import { ICreateOrderPayload } from '../models/ICreateOrderPayload';
import { environment } from 'src/environments/environment';

describe('OrderService', () => {
    let service: OrderService;
    let httpMock: HttpTestingController;
    const apiUrl = `${environment.apiUrl}/api/sales`;  // Mocks de datos
    const mockCustomer = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        neighborhood: {
            id: 'nbr-1',
            name: 'Centro',
            description: 'Barrio céntrico de la ciudad',
            city: {
                id: 'city-1',
                name: 'Buenos Aires',
                description: 'Capital de Argentina',
                isActive: true
            },
            isActive: true
        },
        isActive: true,
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockOrderStatus = {
        _id: 'status-1',
        id: 'status-1',
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

    const mockOrderItem = {
        id: 'item-1',
        product: {
            id: 'prod-1',
            name: 'Pizza Margarita',
            description: 'Pizza con mozzarella y albahaca',
            price: 15.00,
            priceWithTax: 16.80,
            stock: 10,
            category: { id: 'cat-1', name: 'Pizzas', description: 'Deliciosas pizzas', isActive: true },
            unit: { id: 'unit-1', name: 'Unidad' },
            isActive: true,
            taxRate: 12,
            tags: ['italiana'],
            imgUrl: 'pizza.jpg'
        },
        quantity: 2,
        unitPrice: 15.00,
        unitPriceWithTax: 16.80,
        subtotal: 30.00,
        taxAmount: 3.60,
        total: 33.60
    };

    const mockOrder: IOrder = {
        id: 'order-1',
        customer: mockCustomer,
        items: [mockOrderItem],
        subtotal: 30.00,
        taxAmount: 3.60,
        discountRate: 0,
        discountAmount: 0,
        total: 33.60,
        date: new Date('2024-01-15'),
        status: mockOrderStatus,
        notes: 'Entrega en horario de oficina',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    };

    const mockCreateOrderPayload: ICreateOrderPayload = {
        items: [
            {
                productId: 'prod-1',
                quantity: 2,
                unitPrice: 15.00
            }
        ],
        deliveryMethod: 'delivery-method-1',
        paymentMethodId: 'cash',
        notes: 'Entrega en horario de oficina',
        selectedAddressId: 'addr-1'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [OrderService]
        });
        service = TestBed.inject(OrderService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('createOrder', () => {
        it('should create a new order successfully', () => {
            service.createOrder(mockCreateOrderPayload).subscribe(order => {
                expect(order).toEqual(mockOrder);
                expect(order.id).toBe('order-1');
                expect(order.customer.name).toBe('John Doe');
                expect(order.items.length).toBe(1);
                expect(order.total).toBe(33.60);
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(mockCreateOrderPayload);
            req.flush(mockOrder);
        });

        it('should send correct payload when creating order', () => {
            service.createOrder(mockCreateOrderPayload).subscribe();

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.body.items).toEqual(mockCreateOrderPayload.items);
            expect(req.request.body.notes).toBe(mockCreateOrderPayload.notes);
            expect(req.request.body.selectedAddressId).toBe(mockCreateOrderPayload.selectedAddressId);
            req.flush(mockOrder);
        });

        it('should handle create order error', () => {
            const errorMessage = 'Error creating order';

            service.createOrder(mockCreateOrderPayload).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.error).toBe(errorMessage);
                }
            });

            const req = httpMock.expectOne(apiUrl);
            req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
        });

        it('should create order with minimal payload using selected address', () => {
            const minimalPayload: ICreateOrderPayload = {
                items: [{ productId: 'prod-1', quantity: 1, unitPrice: 10.00 }],
                deliveryMethod: 'delivery-method-1',
                paymentMethodId: 'cash',
                selectedAddressId: 'address-123'
            };

            service.createOrder(minimalPayload).subscribe(order => {
                expect(order).toEqual(mockOrder);
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.body.items.length).toBe(1);
            expect(req.request.body.selectedAddressId).toBe('address-123');
            expect(req.request.body.notes).toContain('Pedido realizado desde el checkout');
            req.flush(mockOrder);
        });

        it('should create order with coupon code', () => {
            const payloadWithCoupon: ICreateOrderPayload = {
                ...mockCreateOrderPayload,
                couponCode: 'SAVE10'
            };

            service.createOrder(payloadWithCoupon).subscribe();

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.body.couponCode).toBe('SAVE10');
            req.flush(mockOrder);
        });
    });

    describe('getMyOrders', () => {
        it('should retrieve user orders from paginated response', () => {
            const mockPaginatedResponse = {
                orders: [mockOrder],
                total: 1,
                page: 1,
                limit: 10
            };

            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([mockOrder]);
                expect(orders.length).toBe(1);
                expect(orders[0].id).toBe('order-1');
            });

            const req = httpMock.expectOne(`${apiUrl}/my-orders`);
            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should retrieve user orders from direct array response', () => {
            const mockDirectResponse = [mockOrder];

            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([mockOrder]);
                expect(orders.length).toBe(1);
            });

            const req = httpMock.expectOne(`${apiUrl}/my-orders`);
            req.flush(mockDirectResponse);
        });

        it('should handle empty orders response', () => {
            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([]);
                expect(orders.length).toBe(0);
            });

            const req = httpMock.expectOne(`${apiUrl}/my-orders`);
            req.flush({ orders: [] });
        });

        it('should handle invalid response structure', () => {
            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([]);
            });

            const req = httpMock.expectOne(`${apiUrl}/my-orders`);
            req.flush({ invalidStructure: true });
        });

        it('should handle null response', () => {
            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([]);
            });

            const req = httpMock.expectOne(`${apiUrl}/my-orders`);
            req.flush(null);
        });

        it('should handle get orders error', () => {
            service.getMyOrders().subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.status).toBe(401);
                }
            });

            const req = httpMock.expectOne(`${apiUrl}/my-orders`);
            req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
        });

        it('should retrieve multiple orders correctly', () => {
            const mockOrder2: IOrder = {
                ...mockOrder,
                id: 'order-2',
                total: 25.50,
                date: new Date('2024-01-16')
            };

            const mockResponse = { orders: [mockOrder, mockOrder2] };

            service.getMyOrders().subscribe(orders => {
                expect(orders.length).toBe(2);
                expect(orders[0].id).toBe('order-1');
                expect(orders[1].id).toBe('order-2');
                expect(orders[0].total).toBe(33.60);
                expect(orders[1].total).toBe(25.50);
            });

            const req = httpMock.expectOne(`${apiUrl}/my-orders`);
            req.flush(mockResponse);
        });
    });

    describe('getOrderById', () => {
        it('should retrieve specific order by ID', () => {
            const orderId = 'order-1';

            service.getOrderById(orderId).subscribe(order => {
                expect(order).toEqual(mockOrder);
                expect(order.id).toBe(orderId);
                expect(order.customer.name).toBe('John Doe');
            });

            const req = httpMock.expectOne(`${apiUrl}/${orderId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockOrder);
        });

        it('should sanitize order ID before making request', () => {
            const orderId = '  order-1  '; // Con espacios
            const cleanOrderId = 'order-1';

            service.getOrderById(orderId).subscribe();

            const req = httpMock.expectOne(`${apiUrl}/${cleanOrderId}`);
            expect(req.request.url).toContain(cleanOrderId);
            expect(req.request.url).not.toContain('  ');
            req.flush(mockOrder);
        });

        it('should handle order not found error', () => {
            const orderId = 'non-existent-order';

            service.getOrderById(orderId).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.status).toBe(404);
                }
            });

            const req = httpMock.expectOne(`${apiUrl}/${orderId}`);
            req.flush('Order not found', { status: 404, statusText: 'Not Found' });
        });

        it('should handle unauthorized access to order', () => {
            const orderId = 'order-1';

            service.getOrderById(orderId).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.status).toBe(403);
                }
            });

            const req = httpMock.expectOne(`${apiUrl}/${orderId}`);
            req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
        });

        it('should handle server error when retrieving order', () => {
            const orderId = 'order-1';

            service.getOrderById(orderId).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.status).toBe(500);
                }
            });

            const req = httpMock.expectOne(`${apiUrl}/${orderId}`);
            req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
        }); it('should retrieve order with complete details', () => {
            const detailedOrder: IOrder = {
                ...mockOrder,
                shippingDetails: {
                    recipientName: 'John Doe',
                    phone: '+1234567890',
                    streetAddress: '123 Main St',
                    postalCode: '1000',
                    neighborhoodName: 'Centro',
                    cityName: 'Buenos Aires',
                    additionalInfo: 'Ring doorbell twice'
                }
            };

            service.getOrderById('order-1').subscribe(order => {
                expect(order.shippingDetails).toBeDefined();
                expect(order.shippingDetails?.streetAddress).toBe('123 Main St');
                expect(order.shippingDetails?.additionalInfo).toBe('Ring doorbell twice');
                expect(order.shippingDetails?.recipientName).toBe('John Doe');
            });

            const req = httpMock.expectOne(`${apiUrl}/order-1`);
            req.flush(detailedOrder);
        });
    });

    describe('API Integration', () => {
        it('should use correct base URL for all endpoints', () => {
            // Create order
            service.createOrder(mockCreateOrderPayload).subscribe();
            const createReq = httpMock.expectOne(apiUrl);
            expect(createReq.request.url).toBe(apiUrl);
            createReq.flush(mockOrder);

            // Get my orders
            service.getMyOrders().subscribe();
            const myOrdersReq = httpMock.expectOne(`${apiUrl}/my-orders`);
            expect(myOrdersReq.request.url).toBe(`${apiUrl}/my-orders`);
            myOrdersReq.flush({ orders: [mockOrder] });

            // Get order by ID
            service.getOrderById('order-1').subscribe();
            const getOrderReq = httpMock.expectOne(`${apiUrl}/order-1`);
            expect(getOrderReq.request.url).toBe(`${apiUrl}/order-1`);
            getOrderReq.flush(mockOrder);
        });

        it('should handle network errors consistently', () => {
            const networkError = new ErrorEvent('Network error', {
                message: 'Network connection failed'
            });

            // Test createOrder network error
            service.createOrder(mockCreateOrderPayload).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.error.message).toBe('Network connection failed');
                }
            });

            const createReq = httpMock.expectOne(apiUrl);
            createReq.error(networkError);

            // Test getMyOrders network error
            service.getMyOrders().subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.error.message).toBe('Network connection failed');
                }
            });

            const myOrdersReq = httpMock.expectOne(`${apiUrl}/my-orders`);
            myOrdersReq.error(networkError);

            // Test getOrderById network error
            service.getOrderById('order-1').subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.error.message).toBe('Network connection failed');
                }
            });

            const getOrderReq = httpMock.expectOne(`${apiUrl}/order-1`);
            getOrderReq.error(networkError);
        });
    });

    describe('Data Validation', () => {
        it('should handle orders with different status types', () => {
            const processedStatus = {
                ...mockOrderStatus,
                _id: 'status-2',
                code: 'PROCESSED',
                name: 'Procesado',
                color: '#28a745'
            };

            const processedOrder: IOrder = {
                ...mockOrder,
                status: processedStatus
            };

            service.getOrderById('order-1').subscribe(order => {
                expect(order.status.code).toBe('PROCESSED');
                expect(order.status.name).toBe('Procesado');
                expect(order.status.color).toBe('#28a745');
            });

            const req = httpMock.expectOne(`${apiUrl}/order-1`);
            req.flush(processedOrder);
        });

        it('should handle orders with multiple items', () => {
            const multiItemOrder: IOrder = {
                ...mockOrder,
                items: [
                    mockOrderItem,
                    {
                        ...mockOrderItem,
                        id: 'item-2',
                        product: {
                            ...mockOrderItem.product,
                            id: 'prod-2',
                            name: 'Pizza Pepperoni'
                        },
                        quantity: 1,
                        total: 16.80
                    }
                ],
                total: 50.40
            };

            service.getOrderById('order-1').subscribe(order => {
                expect(order.items.length).toBe(2);
                expect(order.total).toBe(50.40);
                expect(order.items[0].product.name).toBe('Pizza Margarita');
                expect(order.items[1].product.name).toBe('Pizza Pepperoni');
            });

            const req = httpMock.expectOne(`${apiUrl}/order-1`);
            req.flush(multiItemOrder);
        });

        it('should handle orders with discount applied', () => {
            const discountedOrder: IOrder = {
                ...mockOrder,
                subtotal: 30.00,
                discountRate: 10,
                discountAmount: 3.00,
                total: 30.60 // 30 + 3.60 tax - 3.00 discount
            };

            service.getOrderById('order-1').subscribe(order => {
                expect(order.discountRate).toBe(10);
                expect(order.discountAmount).toBe(3.00);
                expect(order.total).toBe(30.60);
            });

            const req = httpMock.expectOne(`${apiUrl}/order-1`);
            req.flush(discountedOrder);
        });
    });
});
