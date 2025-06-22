import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
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
    });    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('constructor and initialization', () => {
        it('should initialize with correct API URL', () => {
            expect((service as any).cartApiUrl).toBe(`${environment.apiUrl}/api/cart`);
        });

        it('should initialize with null cart state', () => {
            expect(service.getCurrentCartValue()).toBeNull();
        });        it('should initialize cart$ observable with null value', () => {
            let initialValue: ICart | null = undefined as any;
            const subscription = service.cart$.subscribe(cart => {
                initialValue = cart;
            });
            
            expect(initialValue).toBeNull();
            subscription.unsubscribe();
        });
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
    });    describe('error handling', () => {
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
        });

        it('should handle validation errors on update quantity', () => {
            service.updateItemQuantity('prod1', 0).subscribe({
                error: (error) => {
                    expect(error.message).toContain('Ocurrió un error al actualizar cantidad del item');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/prod1`);
            req.flush({ message: 'Quantity must be greater than 0' }, { status: 400, statusText: 'Bad Request' });

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });

        it('should handle backend error messages', () => {
            service.addItem('prod1', 1).subscribe({
                error: (error) => {
                    expect(error.message).toBe('Custom backend error');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            req.flush({ error: 'Custom backend error' }, { status: 400, statusText: 'Bad Request' });

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
                'Custom backend error',
                'Error en Carrito'
            );
        });

        it('should handle errors on remove item', () => {
            service.removeItem('prod1').subscribe({
                error: (error) => {
                    expect(error.message).toContain('Ocurrió un error al eliminar item del carrito');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/prod1`);
            req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });

        it('should handle errors on clear cart', () => {
            service.clearCart().subscribe({
                error: (error) => {
                    expect(error.message).toContain('Ocurrió un error al vaciar el carrito');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });        it('should handle network errors on different operations', () => {
            // Test network error on updateItemQuantity
            service.updateItemQuantity('prod1', 2).subscribe({
                error: (error) => {
                    expect(error.message).toContain('No se pudo conectar con el servidor');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/prod1`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });

        it('should handle different status codes properly', () => {
            // Test 400 error
            service.addItem('prod1', 1).subscribe({
                error: (error) => {
                    expect(error.message).toContain('Ocurrió un error al añadir item al carrito');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });

        it('should handle custom error format from backend', () => {
            service.clearCart().subscribe({
                error: (error) => {
                    expect(error.message).toBe('Custom error message');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush({ error: 'Custom error message' }, { status: 400, statusText: 'Bad Request' });

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
                'Custom error message',
                'Error en Carrito'
            );
        });

        it('should handle general HTTP errors without specific handling', () => {
            service.removeItem('prod1').subscribe({
                error: (error) => {
                    expect(error.message).toContain('Ocurrió un error al eliminar item del carrito');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/prod1`);
            req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
                jasmine.stringContaining('Ocurrió un error al eliminar item del carrito'),
                'Error en Carrito'
            );
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
            req.flush(updatedCart);            // Verify updated state
            expect(service.getCurrentCartValue()).toEqual(jasmine.objectContaining({
                id: updatedCart.id,
                totalItems: updatedCart.totalItems
            }));
        });
    });    describe('loadInitialCartIfAuthenticated', () => {
        it('should load cart when user is authenticated', () => {
            authServiceSpy.isAuthenticated.and.returnValue(true);
            
            // Spy on getCart method and return a successful observable
            const getCartSpy = spyOn(service, 'getCart').and.callThrough();
            
            (service as any).loadInitialCartIfAuthenticated();

            expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
            expect(getCartSpy).toHaveBeenCalled();

            // Handle the HTTP request
            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush(mockCart);
        });

        it('should set cart to null when user is not authenticated', () => {
            authServiceSpy.isAuthenticated.and.returnValue(false);
            
            (service as any).loadInitialCartIfAuthenticated();

            expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
            expect(service.getCurrentCartValue()).toBeNull();
        });

        it('should handle error when loading initial cart fails', () => {
            authServiceSpy.isAuthenticated.and.returnValue(true);
            
            // Call the method
            (service as any).loadInitialCartIfAuthenticated();

            // Simulate the HTTP request that getCart makes and make it fail
            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart`);
            req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

            // Error should be handled in getCart's error handler
            expect(notificationServiceSpy.showError).toHaveBeenCalled();
        });
    });

    describe('updateItemQuantity edge cases', () => {
        it('should show correct message when item is removed from cart (quantity 0)', () => {
            const productId = 'prod1';
            const quantity = 0;
            const cartWithoutItem = {
                ...mockCart,
                items: [],
                totalItems: 0,
                subtotalWithoutTax: 0,
                totalTaxAmount: 0,
                total: 0
            };

            service.updateItemQuantity(productId, quantity).subscribe(cart => {
                expect(cart).toEqual(cartWithoutItem);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/${productId}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual({ quantity });
            req.flush(cartWithoutItem);

            expect(notificationServiceSpy.showInfo).toHaveBeenCalledWith(
                'Producto eliminado del carrito.',
                'Carrito Actualizado'
            );
        });
    });

    describe('addItem edge cases', () => {
        it('should show generic product name when product not found in response', () => {
            const productId = 'unknown-product';
            const quantity = 1;
            const cartWithUnknownProduct = {
                ...mockCart,
                items: [] // Empty items array
            };

            service.addItem(productId, quantity).subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            req.flush(cartWithUnknownProduct);

            expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith(
                '1 x Producto añadido(s) al carrito.',
                'Carrito Actualizado'
            );
        });
    });    describe('constructor and initialization', () => {
        it('should initialize with correct API URL', () => {
            expect((service as any).cartApiUrl).toBe(`${environment.apiUrl}/api/cart`);
        });        it('should initialize with null cart state', () => {
            expect(service.getCurrentCartValue()).toBeNull();
        });
    });

    describe('notification scenarios', () => {
        it('should show success notification with correct product name when adding item', () => {
            const productId = 'prod1';
            const quantity = 3;

            service.addItem(productId, quantity).subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items`);
            req.flush(mockCart);

            expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith(
                `${quantity} x ${mockCart.items[0].product.name} añadido(s) al carrito.`,
                'Carrito Actualizado'
            );
        });

        it('should show info notification when updating quantity for existing item', () => {
            const productId = 'prod1';
            const quantity = 5;

            service.updateItemQuantity(productId, quantity).subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/api/cart/items/${productId}`);
            req.flush(mockCart);

            expect(notificationServiceSpy.showInfo).toHaveBeenCalledWith(
                `Cantidad de ${mockCart.items[0].product.name} actualizada a ${quantity}.`,
                'Carrito Actualizado'
            );        });
    });

    describe('_updateCartState private method', () => {
        it('should update cart subject when called directly', () => {
            let emittedCart: ICart | null = null;

            service.cart$.subscribe(cart => {
                emittedCart = cart;
            });

            // Call private method through reflection
            (service as any)._updateCartState(mockCart);

            expect(emittedCart).toBeTruthy();
            expect(service.getCurrentCartValue()).toEqual(mockCart);
        });

        it('should handle null cart update', () => {
            // First set a cart
            (service as any)._updateCartState(mockCart);
            expect(service.getCurrentCartValue()).toEqual(mockCart);

            // Then set to null
            (service as any)._updateCartState(null);
            expect(service.getCurrentCartValue()).toBeNull();
        });
    });
});
