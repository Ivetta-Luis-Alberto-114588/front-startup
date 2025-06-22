import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { environment } from 'src/environments/environment';
import { ICart } from '../models/icart';
import { IUser } from 'src/app/shared/models/iuser';
import { IProduct } from '../../products/model/iproduct';

describe('CartService', () => {
    let service: CartService;
    let httpMock: HttpTestingController;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;

    const mockUser: IUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['USER_ROLE'],
        createdAt: '2025-05-30T21:12:12.591Z',
        updatedAt: '2025-05-30T21:12:12.591Z',
        __v: 0
    }; const mockProduct: IProduct = {
        id: 'prod1',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        priceWithTax: 121,
        stock: 10,
        taxRate: 21,
        isActive: true,
        imgUrl: 'test.jpg',
        category: { id: 'cat1', name: 'Test Category', description: 'Test', isActive: true } as any,
        unit: { id: 'unit1', name: 'Test Unit', description: 'Test', isActive: true } as any,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockCart: ICart = {
        id: 'cart1',
        userId: '1',
        user: mockUser,
        items: [
            {
                product: mockProduct,
                quantity: 2,
                priceAtTime: 100,
                taxRate: 21,
                unitPriceWithTax: 121,
                subtotalWithTax: 242
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalItems: 2,
        subtotalWithoutTax: 200,
        totalTaxAmount: 42,
        total: 242
    };
    beforeEach(() => {
        const notificationSpy = jasmine.createSpyObj('NotificationService',
            ['showSuccess', 'showError', 'showInfo', 'showWarning']);
        const authSpy = jasmine.createSpyObj('AuthService',
            ['isAuthenticated', 'getToken']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                CartService,
                { provide: NotificationService, useValue: notificationSpy },
                { provide: AuthService, useValue: authSpy }
            ]
        });

        service = TestBed.inject(CartService);
        httpMock = TestBed.inject(HttpTestingController);
        notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

        // Reset cart state to avoid interference between tests
        (service as any).cartSubject.next(null);
    });

    afterEach(() => {
        httpMock.verify();
        // Clean up any subscriptions or state
        (service as any).cartSubject.next(null);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getCart', () => {
        it('should retrieve cart successfully', () => {
            service.getCart().subscribe(cart => {
                expect(cart).toEqual(mockCart);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            expect(req.request.method).toBe('GET');
            req.flush(mockCart);
        }); it('should handle 404 error when cart does not exist', () => {
            let cartResult: ICart | null = undefined as any;

            service.getCart().subscribe({
                next: (cart) => {
                    cartResult = cart;
                },
                error: (error) => {
                    // Should catch the error but cart state should be null
                    expect(error.message).toBe('Carrito no encontrado');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush('Cart not found', { status: 404, statusText: 'Not Found' });

            // Should not show error notification for 404
            expect(notificationServiceSpy.showError).not.toHaveBeenCalled();
            // Cart state should be updated to null
            expect(service.getCurrentCartValue()).toBeNull();
        }); it('should handle server errors', () => {
            service.getCart().subscribe({
                error: (error) => {
                    expect(error.message).toContain('Ocurrió un error al obtener el carrito');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });
    });

    describe('addItem', () => {
        it('should add item to cart successfully', () => {
            const productId = 'prod1';
            const quantity = 2;

            service.addItem(productId, quantity).subscribe(cart => {
                expect(cart).toEqual(mockCart);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ productId, quantity });
            req.flush(mockCart);

            expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith(
                jasmine.stringContaining('añadido(s) al carrito'),
                'Carrito Actualizado'
            );
        });

        it('should handle authentication errors', () => {
            const productId = 'prod1';
            const quantity = 1;

            service.addItem(productId, quantity).subscribe({
                error: (error) => {
                    expect(error.message).toContain('No autorizado');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });
    });

    describe('updateItemQuantity', () => {
        it('should update item quantity successfully', () => {
            const productId = 'prod1';
            const quantity = 3;

            service.updateItemQuantity(productId, quantity).subscribe(cart => {
                expect(cart).toEqual(mockCart);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/${productId}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual({ quantity });
            req.flush(mockCart);

            expect(notificationServiceSpy.showInfo).toHaveBeenCalledWith(
                jasmine.stringContaining('actualizada'),
                'Carrito Actualizado'
            );
        });
    });

    describe('removeItem', () => {
        it('should remove item from cart successfully', () => {
            const productId = 'prod1';
            const updatedCart = {
                ...mockCart,
                items: [],
                totalItems: 0,
                subtotalWithoutTax: 0,
                totalTaxAmount: 0,
                total: 0
            };

            service.removeItem(productId).subscribe(cart => {
                expect(cart).toEqual(updatedCart);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/${productId}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(updatedCart);

            expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith(
                'Producto eliminado del carrito.',
                'Carrito Actualizado'
            );
        });
    });

    describe('clearCart', () => {
        it('should clear cart successfully', () => {
            const emptyCart = {
                ...mockCart,
                items: [],
                totalItems: 0,
                subtotalWithoutTax: 0,
                totalTaxAmount: 0,
                total: 0
            };

            service.clearCart().subscribe(cart => {
                expect(cart).toEqual(emptyCart);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            expect(req.request.method).toBe('DELETE');
            req.flush(emptyCart);

            expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith(
                'El carrito ha sido vaciado.',
                'Carrito Actualizado'
            );
        });
    });
    describe('cart state management', () => {
        it('should emit cart state changes', () => {
            let emittedCart: ICart | null = null;

            service.cart$.subscribe(cart => {
                emittedCart = cart;
            });

            service.getCart().subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush(mockCart);

            expect(emittedCart).toEqual(jasmine.objectContaining({
                id: mockCart.id,
                userId: mockCart.userId,
                totalItems: mockCart.totalItems
            }));
        });

        it('should return current cart value synchronously', () => {
            // First load cart
            service.getCart().subscribe();
            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush(mockCart);

            // Then test getCurrentCartValue
            const currentCart = service.getCurrentCartValue();
            expect(currentCart).toEqual(mockCart);
        });

        it('should initialize with null cart state', () => {
            const initialCart = service.getCurrentCartValue();
            expect(initialCart).toBeNull();
        });
    });

    describe('error handling', () => {
        it('should handle network errors', () => {
            service.getCart().subscribe({
                error: (error) => {
                    expect(error.message).toContain('No se pudo conectar con el servidor');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });

        it('should handle unauthorized access on add item', () => {
            service.addItem('prod1', 1).subscribe({
                error: (error) => {
                    expect(error.message).toContain('No autorizado');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
                jasmine.stringContaining('No autorizado'),
                'Error en Carrito'
            );
        }); it('should handle validation errors on update quantity', () => {
            service.updateItemQuantity('prod1', 0).subscribe({
                error: (error) => {
                    expect(error.message).toContain('Ocurrió un error al actualizar cantidad del item');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/prod1`);
            req.flush({ message: 'Quantity must be greater than 0' }, { status: 400, statusText: 'Bad Request' });

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });
    });

    describe('reactive state updates', () => {
        it('should update cart state after adding item', () => {
            let cartStates: (ICart | null)[] = [];

            service.cart$.subscribe(cart => {
                cartStates.push(cart);
            });

            // Initial state should be null
            expect(cartStates[0]).toBeNull();

            // Add item
            service.addItem('prod1', 1).subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            req.flush(mockCart);

            // Should have updated state
            expect(cartStates.length).toBe(2);
            expect(cartStates[1]).toBeTruthy();
            expect(cartStates[1]?.totalItems).toBe(mockCart.totalItems);
        });

        it('should maintain cart state consistency across operations', () => {
            // First, load cart
            service.getCart().subscribe();
            let req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush(mockCart);

            // Verify state
            expect(service.getCurrentCartValue()).toEqual(jasmine.objectContaining({
                id: mockCart.id,
                totalItems: mockCart.totalItems
            }));

            // Update quantity
            const updatedCart = { ...mockCart, totalItems: 3, total: 363 };
            service.updateItemQuantity('prod1', 3).subscribe();
            req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/prod1`);
            req.flush(updatedCart);

            // Verify updated state
            expect(service.getCurrentCartValue()).toEqual(jasmine.objectContaining({
                id: updatedCart.id,
                totalItems: updatedCart.totalItems
            }));
        });
    });
});
