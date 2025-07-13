import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { OrderService } from './order.service';
import { IOrder } from '../models/iorder';
import { ICreateOrderPayload } from '../models/ICreateOrderPayload';
import { of, throwError } from 'rxjs';

describe('OrderService', () => {
    let service: OrderService;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;

    // Mock data
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
        deliveryMethodId: 'delivery-method-1',
        paymentMethodId: 'cash',
        notes: 'Entrega en horario de oficina',
        selectedAddressId: 'addr-1'
    };

    beforeEach(() => {
        const spy = jasmine.createSpyObj('HttpClient', ['post', 'get']);

        TestBed.configureTestingModule({
            providers: [
                OrderService,
                { provide: HttpClient, useValue: spy }
            ]
        });

        service = TestBed.inject(OrderService);
        httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    });

    describe('Service Creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('createOrder', () => {
        it('should create a new order successfully', () => {
            const mockResponse = { data: mockOrder };
            httpClientSpy.post.and.returnValue(of(mockResponse));

            service.createOrder(mockCreateOrderPayload).subscribe(order => {
                expect(order).toEqual(mockOrder);
                expect(order.id).toBe('order-1');
                expect(order.customer.name).toBe('John Doe');
                expect(order.items.length).toBe(1);
                expect(order.total).toBe(33.60);
            });

            expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
        });

        it('should handle create order error', () => {
            const errorMessage = 'Error creating order';
            httpClientSpy.post.and.returnValue(throwError({ error: errorMessage }));

            service.createOrder(mockCreateOrderPayload).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.error).toBe(errorMessage);
                }
            });

            expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
        });

        it('should create order with minimal payload using selected address', () => {
            const minimalPayload: ICreateOrderPayload = {
                items: [{ productId: 'prod-1', quantity: 1, unitPrice: 10.00 }],
                deliveryMethodId: 'delivery-method-1',
                paymentMethodId: 'cash',
                selectedAddressId: 'address-123'
            };

            const mockResponse = { data: mockOrder };
            httpClientSpy.post.and.returnValue(of(mockResponse));

            service.createOrder(minimalPayload).subscribe(order => {
                expect(order).toEqual(mockOrder);
            });

            expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
        });

        it('should create order with coupon code', () => {
            const payloadWithCoupon: ICreateOrderPayload = {
                ...mockCreateOrderPayload,
                couponCode: 'SAVE10'
            };

            const mockResponse = { data: mockOrder };
            httpClientSpy.post.and.returnValue(of(mockResponse));

            service.createOrder(payloadWithCoupon).subscribe();

            expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
        });

        it('should handle invalid response format', () => {
            const invalidResponse = { message: 'Order created but invalid format' }; // Missing data
            httpClientSpy.post.and.returnValue(of(invalidResponse));

            service.createOrder(mockCreateOrderPayload).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.message).toBe('La respuesta del backend no contiene la orden creada.');
                }
            });

            expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
        });
    });

    describe('getMyOrders', () => {
        it('should retrieve user orders from paginated response', () => {
            const mockPaginatedResponse = {
                orders: [mockOrder],
                totalCount: 1,
                currentPage: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
            };

            httpClientSpy.get.and.returnValue(of(mockPaginatedResponse));

            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([mockOrder]);
                expect(orders.length).toBe(1);
                expect(orders[0].id).toBe('order-1');
            });

            expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        });

        it('should retrieve user orders from direct array response', () => {
            const mockDirectResponse = [mockOrder];

            httpClientSpy.get.and.returnValue(of(mockDirectResponse));

            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([mockOrder]);
                expect(orders.length).toBe(1);
            });

            expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        });

        it('should handle empty orders response', () => {
            const emptyResponse = { orders: [] };

            httpClientSpy.get.and.returnValue(of(emptyResponse));

            service.getMyOrders().subscribe(orders => {
                expect(orders).toEqual([]);
                expect(orders.length).toBe(0);
            });

            expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('getOrderById', () => {
        it('should retrieve order by id successfully', () => {
            const orderId = 'order-1';
            httpClientSpy.get.and.returnValue(of(mockOrder));

            service.getOrderById(orderId).subscribe(order => {
                expect(order).toEqual(mockOrder);
                expect(order.id).toBe(orderId);
            });

            expect(httpClientSpy.get).toHaveBeenCalledWith(jasmine.stringMatching(orderId));
        });

        it('should handle order not found error', () => {
            const orderId = 'non-existent';
            httpClientSpy.get.and.returnValue(throwError({ status: 404, error: 'Order not found' }));

            service.getOrderById(orderId).subscribe({
                next: () => fail('Expected error'),
                error: (error) => {
                    expect(error.status).toBe(404);
                }
            });
        });
    });
});
