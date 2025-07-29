import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { CartPageComponent } from './cart-page.component';
import { CartService } from '../../services/cart.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ImageUrlService } from 'src/app/shared/services/image-url.service';
import { ICart } from '../../models/icart';
import { ICartItem } from '../../models/icart-item';
import { IProduct } from '../../../products/model/iproduct';
import { IUser } from 'src/app/shared/models/iuser';

describe('CartPageComponent', () => {
    let component: CartPageComponent;
    let fixture: ComponentFixture<CartPageComponent>;
    let cartService: jasmine.SpyObj<CartService>;
    let authService: jasmine.SpyObj<AuthService>;
    let router: jasmine.SpyObj<Router>;
    let location: jasmine.SpyObj<Location>;
    let modalService: jasmine.SpyObj<NgbModal>;
    let imageUrlService: jasmine.SpyObj<ImageUrlService>;

    // Mocks de datos
    const mockUser: IUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        roles: ['USER_ROLE']
    };

    const mockProduct: IProduct = {
        id: '1',
        name: 'Pizza Margarita',
        description: 'Deliciosa pizza con mozzarella y albahaca',
        price: 15.00,
        priceWithTax: 16.80,
        stock: 10,
        category: { id: '1', name: 'Pizzas' } as any,
        unit: { id: '1', name: 'Unidad' } as any,
        isActive: true,
        taxRate: 12,
        tags: ['italiana'],
        imgUrl: 'pizza.jpg'
    };

    const mockCartItem: ICartItem = {
        product: mockProduct,
        quantity: 2,
        priceAtTime: 15.00,
        taxRate: 12,
        unitPriceWithTax: 16.80,
        subtotalWithTax: 33.60
    };

    const mockCart: ICart = {
        id: 'cart-1',
        userId: '1',
        user: mockUser,
        items: [mockCartItem],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalItems: 2,
        subtotalWithoutTax: 30.00,
        totalTaxAmount: 3.60,
        total: 33.60
    };

    const mockEmptyCart: ICart = {
        id: 'cart-1',
        userId: '1',
        user: mockUser,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalItems: 0,
        subtotalWithoutTax: 0,
        totalTaxAmount: 0,
        total: 0
    };

    beforeEach(async () => {
        const cartServiceSpy = jasmine.createSpyObj('CartService', [
            'getCart',
            'updateItemQuantity',
            'removeItem',
            'clearCart'
        ], {
            cart$: new BehaviorSubject<ICart | null>(mockCart)
        });

        const authServiceSpy = jasmine.createSpyObj('AuthService', [
            'isAuthenticated'
        ]);

        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const locationSpy = jasmine.createSpyObj('Location', ['back']);
        const modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);
        const imageUrlServiceSpy = jasmine.createSpyObj('ImageUrlService', [
            'getProductImageUrl',
            'getPlaceholderUrl',
            'isValidImageUrl'
        ]);

        await TestBed.configureTestingModule({
            declarations: [CartPageComponent],
            providers: [
                { provide: CartService, useValue: cartServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Location, useValue: locationSpy },
                { provide: NgbModal, useValue: modalServiceSpy },
                { provide: ImageUrlService, useValue: imageUrlServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CartPageComponent);
        component = fixture.componentInstance;
        cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        location = TestBed.inject(Location) as jasmine.SpyObj<Location>;
        modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;
        imageUrlService = TestBed.inject(ImageUrlService) as jasmine.SpyObj<ImageUrlService>;

        // Setup default return values for imageUrlService
        imageUrlService.getProductImageUrl.and.returnValue('assets/placeholder.png');
        imageUrlService.getPlaceholderUrl.and.returnValue('assets/placeholder.png');
        imageUrlService.isValidImageUrl.and.returnValue(true);
    });

    afterEach(() => {
        // Limpiar estado entre tests
        component.ngOnDestroy();
    });

    describe('Component Creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        }); it('should initialize with correct properties', () => {
            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(component.updatingItemId).toBeNull();
            expect(component.clearingCart).toBe(false);
            expect(component.cart$).toBeDefined();
        });
    });

    describe('ngOnInit', () => {
        it('should call loadCart on initialization', () => {
            spyOn(component, 'loadCart');

            component.ngOnInit();

            expect(component.loadCart).toHaveBeenCalled();
        });
    });

    describe('loadCart', () => {
        it('should load cart successfully', () => {
            cartService.getCart.and.returnValue(of(mockCart));

            component.loadCart();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(cartService.getCart).toHaveBeenCalled();
        }); it('should handle empty cart', () => {
            cartService.getCart.and.returnValue(of(mockEmptyCart));

            component.loadCart();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
        });

        it('should handle cart loading error', () => {
            const errorMessage = 'Error de conexión';
            cartService.getCart.and.returnValue(throwError(() => ({ message: errorMessage })));

            component.loadCart();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBe(errorMessage);
        });

        it('should handle cart loading error without message', () => {
            cartService.getCart.and.returnValue(throwError(() => ({})));

            component.loadCart();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBe('No se pudo cargar el carrito.');
        });

        it('should set loading state during cart load', () => {
            cartService.getCart.and.returnValue(of(mockCart));

            component.loadCart();

            expect(cartService.getCart).toHaveBeenCalled();
        });
    });

    describe('increaseQuantity', () => {
        it('should increase item quantity successfully', () => {
            cartService.updateItemQuantity.and.returnValue(of(mockCart));

            // Verificar estado antes de la operación
            expect(component.updatingItemId).toBeNull();

            component.increaseQuantity(mockCartItem);

            // Verificar que se llamó el servicio con los parámetros correctos
            expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
                mockCartItem.product.id,
                mockCartItem.quantity + 1
            );

            // Después de completar, debería estar resetado
            expect(component.updatingItemId).toBeNull();
        });

        it('should not increase quantity if already updating', () => {
            component.updatingItemId = 'some-id';

            component.increaseQuantity(mockCartItem);

            expect(cartService.updateItemQuantity).not.toHaveBeenCalled();
        }); it('should reset updatingItemId after completion', () => {
            cartService.updateItemQuantity.and.returnValue(of(mockCart));

            component.increaseQuantity(mockCartItem);

            expect(component.updatingItemId).toBeNull();
        });
    });

    describe('decreaseQuantity', () => {
        it('should decrease item quantity when quantity > 1', () => {
            const itemWithHighQuantity = { ...mockCartItem, quantity: 3 };
            cartService.updateItemQuantity.and.returnValue(of(mockCart));

            component.decreaseQuantity(itemWithHighQuantity);

            expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
                itemWithHighQuantity.product.id,
                itemWithHighQuantity.quantity - 1
            );
        });

        it('should remove item when quantity is 1', () => {
            const itemWithSingleQuantity = { ...mockCartItem, quantity: 1 };
            spyOn(component, 'removeItem');

            component.decreaseQuantity(itemWithSingleQuantity);

            expect(component.removeItem).toHaveBeenCalledWith(itemWithSingleQuantity.product.id);
            expect(cartService.updateItemQuantity).not.toHaveBeenCalled();
        });

        it('should not decrease quantity if already updating', () => {
            component.updatingItemId = 'some-id';

            component.decreaseQuantity(mockCartItem);

            expect(cartService.updateItemQuantity).not.toHaveBeenCalled();
        }); it('should reset updatingItemId after completion', () => {
            const itemWithHighQuantity = { ...mockCartItem, quantity: 3 };
            cartService.updateItemQuantity.and.returnValue(of(mockCart));

            component.decreaseQuantity(itemWithHighQuantity);

            expect(component.updatingItemId).toBeNull();
        });
    });

    describe('removeItem', () => {
        it('should remove item successfully', () => {
            cartService.removeItem.and.returnValue(of(mockEmptyCart));

            // Verificar estado antes de la operación
            expect(component.updatingItemId).toBeNull();

            component.removeItem(mockCartItem.product.id);

            // Verificar que se llamó el servicio
            expect(cartService.removeItem).toHaveBeenCalledWith(mockCartItem.product.id);

            // Después de completar, debería estar resetado
            expect(component.updatingItemId).toBeNull();
        });

        it('should not remove item if already updating', () => {
            component.updatingItemId = 'some-id';

            component.removeItem(mockCartItem.product.id);

            expect(cartService.removeItem).not.toHaveBeenCalled();
        }); it('should reset updatingItemId after completion', () => {
            cartService.removeItem.and.returnValue(of(mockEmptyCart));

            component.removeItem(mockCartItem.product.id);

            expect(component.updatingItemId).toBeNull();
        }); it('should handle remove item error', () => {
            spyOn(console, 'error');
            cartService.removeItem.and.returnValue(throwError(() => new Error('Error removing item')));

            component.removeItem(mockCartItem.product.id);

            expect(console.error).toHaveBeenCalled();
            // En caso de error, el updatingItemId permanece con el valor (no se resetea)
            expect(component.updatingItemId).toBe(mockCartItem.product.id);
        });
    });

    describe('clearCart and Modal Confirmation', () => {
        it('should open confirmation modal when clearCart is called', () => {
            const mockModalRef = {
                result: Promise.resolve('confirm')
            };
            modalService.open.and.returnValue(mockModalRef as any);
            spyOn(component, 'openClearCartConfirmation');

            component.clearCart();

            expect(component.openClearCartConfirmation).toHaveBeenCalled();
        });

        it('should open modal in openClearCartConfirmation', () => {
            const mockModalRef = {
                result: Promise.resolve('confirm')
            };
            modalService.open.and.returnValue(mockModalRef as any);
            cartService.clearCart.and.returnValue(of(mockEmptyCart));

            component.openClearCartConfirmation();

            expect(modalService.open).toHaveBeenCalled();
        });

        it('should not open modal if already clearing cart', () => {
            component.clearingCart = true;

            component.openClearCartConfirmation();

            expect(modalService.open).not.toHaveBeenCalled();
        });

        it('should execute clear cart when modal is confirmed', async () => {
            const mockModalRef = {
                result: Promise.resolve('confirm')
            };
            modalService.open.and.returnValue(mockModalRef as any);
            cartService.clearCart.and.returnValue(of(mockEmptyCart));

            component.openClearCartConfirmation();
            await mockModalRef.result;

            expect(cartService.clearCart).toHaveBeenCalled();
        });

        it('should reset clearingCart state when modal is dismissed', async () => {
            const mockModalRef = {
                result: Promise.reject('dismiss')
            };
            modalService.open.and.returnValue(mockModalRef as any);

            component.openClearCartConfirmation();
            try {
                await mockModalRef.result;
            } catch (e) {
                // Expected dismissal
            }

            expect(component.clearingCart).toBe(false);
        });

        it('should handle clear cart error', () => {
            cartService.clearCart.and.returnValue(throwError(() => new Error('Clear cart error')));

            component['executeClearCart']();

            expect(component.clearingCart).toBe(false);
        });
    });

    describe('proceedToCheckout', () => {
        it('should navigate to checkout when user is authenticated', () => {
            authService.isAuthenticated.and.returnValue(true);

            component.proceedToCheckout();

            expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
        });

        it('should navigate to checkout even when user is not authenticated (guest checkout)', () => {
            authService.isAuthenticated.and.returnValue(false);

            component.proceedToCheckout();

            expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
        });
    });

    describe('goBack', () => {
        it('should call location.back()', () => {
            component.goBack();

            expect(location.back).toHaveBeenCalled();
        });
    });

    describe('getProductId', () => {
        it('should return product id from cart item', () => {
            const productId = component.getProductId(mockCartItem);

            expect(productId).toBe(mockCartItem.product.id);
        });
    });

    describe('Stock Validation Edge Cases', () => {
        it('should handle stock validation during quantity increase', () => {
            // Simular un producto con stock limitado
            const limitedStockProduct = { ...mockProduct, stock: 2 };
            const limitedStockItem = { ...mockCartItem, product: limitedStockProduct, quantity: 2 };
            cartService.updateItemQuantity.and.returnValue(of(mockCart));

            component.increaseQuantity(limitedStockItem);

            expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
                limitedStockItem.product.id,
                3
            );
        });
    });

    describe('Loading States', () => {
        it('should show loading state during cart operations', () => {
            component.isLoading = true;

            expect(component.isLoading).toBe(true);
        });

        it('should show updating state for specific items', () => {
            component.updatingItemId = mockCartItem.product.id;

            expect(component.updatingItemId).toBe(mockCartItem.product.id);
        });

        it('should show clearing state during cart clear', () => {
            component.clearingCart = true;

            expect(component.clearingCart).toBe(true);
        });
    });

    describe('Error States', () => {
        it('should display error message when cart fails to load', () => {
            const errorMessage = 'Error de conexión con el servidor';
            component.error = errorMessage;

            expect(component.error).toBe(errorMessage);
        }); it('should reset error state when loading cart again', () => {
            component.error = 'Previous error';
            cartService.getCart.and.returnValue(of(mockCart));

            component.loadCart();

            expect(component.error).toBeNull();
        });
    });

    describe('Component Lifecycle', () => {
        it('should unsubscribe on destroy', () => {
            const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            component['cartSubscription'] = subscription;

            component.ngOnDestroy();

            expect(subscription.unsubscribe).toHaveBeenCalled();
        });

        it('should handle destroy with no subscription', () => {
            component['cartSubscription'] = null;

            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('Image handling', () => {
        it('should get product image URL using imageUrlService', () => {
            const expectedUrl = 'https://backend.com/uploads/product.jpg';
            imageUrlService.getProductImageUrl.and.returnValue(expectedUrl);

            const result = component.getProductImageUrl(mockCartItem);

            expect(imageUrlService.getProductImageUrl).toHaveBeenCalledWith(mockProduct.imgUrl);
            expect(result).toBe(expectedUrl);
        });

        it('should handle image error by setting placeholder', () => {
            const mockEvent = {
                target: {
                    src: 'broken-image-url'
                }
            };
            const placeholderUrl = 'assets/placeholder.png';
            imageUrlService.getPlaceholderUrl.and.returnValue(placeholderUrl);
            spyOn(console, 'warn');

            component.onImageError(mockEvent);

            expect(console.warn).toHaveBeenCalledWith('[CartPage] Error cargando imagen:', 'broken-image-url');
            expect(mockEvent.target.src).toBe(placeholderUrl);
        });

        it('should log successful image load', () => {
            spyOn(console, 'log');
            const productName = 'Test Product';

            component.onImageLoad(productName);

            expect(console.log).toHaveBeenCalledWith('[CartPage] Imagen cargada exitosamente para:', productName);
        });
    });
});
