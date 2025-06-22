import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../services/product/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { IProduct } from '../../model/iproduct';
import { ICategory } from '../../model/icategory';

describe('ProductDetailComponent', () => {
    let component: ProductDetailComponent;
    let fixture: ComponentFixture<ProductDetailComponent>;
    let productService: jasmine.SpyObj<ProductService>;
    let cartService: jasmine.SpyObj<CartService>;
    let authService: jasmine.SpyObj<AuthService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let router: jasmine.SpyObj<Router>;
    let location: jasmine.SpyObj<Location>;    let activatedRoute: any;

    // Mocks de datos
    const mockCategory: ICategory = {
        id: 'cat-1',
        name: 'Pizzas',
        description: 'Deliciosas pizzas caseras',
        isActive: true
    };

    const mockProduct: IProduct = {
        id: 'prod-1',
        name: 'Pizza Margarita',
        description: 'Pizza con mozzarella y albahaca fresca',
        price: 15.00,
        priceWithTax: 16.80,
        stock: 10,
        category: mockCategory,
        unit: { id: 'unit-1', name: 'Unidad' } as any,
        isActive: true,
        taxRate: 12,
        tags: ['italiana'],
        imgUrl: 'pizza.jpg'
    };

    const mockOutOfStockProduct: IProduct = {
        ...mockProduct,
        id: 'prod-2',
        name: 'Pizza Agotada',
        stock: 0
    };

    const mockLimitedStockProduct: IProduct = {
        ...mockProduct,
        id: 'prod-3',
        name: 'Pizza Stock Limitado',
        stock: 2
    };

    beforeEach(async () => {
        // Crear ParamMap observable
        const paramMapSubject = new BehaviorSubject(new Map([['idProduct', 'prod-1']]));

        const activatedRouteSpy = {
            paramMap: paramMapSubject.asObservable()
        };

        const productServiceSpy = jasmine.createSpyObj('ProductService', [
            'getProductsById'
        ]);

        const cartServiceSpy = jasmine.createSpyObj('CartService', [
            'addItem'
        ]);

        const authServiceSpy = jasmine.createSpyObj('AuthService', [
            'isAuthenticated'
        ]);

        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'showInfo',
            'showError',
            'showSuccess',
            'showWarning'
        ]);

        const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
            url: '/products/cat-1/prod-1'
        });

        const locationSpy = jasmine.createSpyObj('Location', ['back']);

        await TestBed.configureTestingModule({
            declarations: [ProductDetailComponent],
            providers: [
                { provide: ProductService, useValue: productServiceSpy },
                { provide: CartService, useValue: cartServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Location, useValue: locationSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProductDetailComponent);
        component = fixture.componentInstance;
        productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
        cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        location = TestBed.inject(Location) as jasmine.SpyObj<Location>;
        activatedRoute = TestBed.inject(ActivatedRoute);
    });

    afterEach(() => {
        // Limpiar estado entre tests
        component.ngOnDestroy();
        localStorage.removeItem('pendingCartAction');
    });

    describe('Component Creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize with correct default properties', () => {
            expect(component.product).toBeNull();
            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(component.quantity).toBe(1);
            expect(component.isAddingToCart).toBe(false);
        });
    });

    describe('ngOnInit and Product Loading', () => {
        it('should load product successfully when ID is provided', () => {
            productService.getProductsById.and.returnValue(of(mockProduct));

            component.ngOnInit();

            expect(productService.getProductsById).toHaveBeenCalledWith('prod-1');
            expect(component.product).toEqual(mockProduct);
            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(component.quantity).toBe(1);
        });

        it('should handle 404 error when product not found', () => {
            const errorResponse = { status: 404 };
            productService.getProductsById.and.returnValue(throwError(() => errorResponse));

            component.ngOnInit();

            expect(component.error).toBe('Producto no encontrado.');
            expect(component.isLoading).toBe(false);
            expect(component.product).toBeNull();
        });

        it('should handle general server error', () => {
            const errorResponse = { status: 500 };
            productService.getProductsById.and.returnValue(throwError(() => errorResponse));

            component.ngOnInit();

            expect(component.error).toBe('No se pudo cargar el detalle del producto. Intente más tarde.');
            expect(component.isLoading).toBe(false);
            expect(component.product).toBeNull();
        });

        it('should handle missing product ID in route', () => {
            // Simular ruta sin parámetro de producto
            const paramMapSubject = new BehaviorSubject(new Map());
            activatedRoute.paramMap = paramMapSubject.asObservable();

            component.ngOnInit();

            expect(component.error).toBe('ID de producto no especificado en la ruta.');
            expect(component.isLoading).toBe(false);
            expect(productService.getProductsById).not.toHaveBeenCalled();
        });

        it('should reset state when loading new product', () => {
            productService.getProductsById.and.returnValue(of(mockProduct));

            // Establecer estado previo
            component.product = mockLimitedStockProduct;
            component.quantity = 5;
            component.error = 'Previous error';

            component.ngOnInit();

            expect(component.error).toBeNull();
            expect(component.quantity).toBe(1);
            expect(component.product).toEqual(mockProduct);
        });
    });

    describe('Quantity Controls', () => {
        beforeEach(() => {
            component.product = mockProduct; // Stock = 10
            component.quantity = 1;
        });

        it('should increase quantity when below stock limit', () => {
            component.increaseQuantity();

            expect(component.quantity).toBe(2);
        });

        it('should not increase quantity when at stock limit', () => {
            component.quantity = mockProduct.stock; // 10

            component.increaseQuantity();

            expect(component.quantity).toBe(mockProduct.stock);
        });

        it('should not increase quantity when product is null', () => {
            component.product = null;
            component.quantity = 1;

            component.increaseQuantity();

            expect(component.quantity).toBe(1);
        });

        it('should decrease quantity when above minimum', () => {
            component.quantity = 3;

            component.decreaseQuantity();

            expect(component.quantity).toBe(2);
        });

        it('should not decrease quantity below 1', () => {
            component.quantity = 1;

            component.decreaseQuantity();

            expect(component.quantity).toBe(1);
        });

        it('should handle quantity controls with limited stock product', () => {
            component.product = mockLimitedStockProduct; // Stock = 2
            component.quantity = 1;

            component.increaseQuantity();
            expect(component.quantity).toBe(2);

            component.increaseQuantity(); // Should not increase beyond stock
            expect(component.quantity).toBe(2);
        });
    });

    describe('addToCart - Authentication Required', () => {
        beforeEach(() => {
            component.product = mockProduct;
            component.quantity = 2;
        });

        it('should add product to cart when user is authenticated', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));

            component.addToCart();

            expect(cartService.addItem).toHaveBeenCalledWith(mockProduct.id, 2);
            expect(component.isAddingToCart).toBe(false);
        });

        it('should redirect to login when user is not authenticated', () => {
            authService.isAuthenticated.and.returnValue(false);

            component.addToCart();

            expect(notificationService.showInfo).toHaveBeenCalledWith(
                'Inicia sesión para añadir al carrito.',
                'Inicio Requerido'
            );
            expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
                queryParams: { returnUrl: router.url }
            });
            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should save pending cart action when not authenticated', () => {
            authService.isAuthenticated.and.returnValue(false);
            spyOn(localStorage, 'setItem');

            component.addToCart();

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'pendingCartAction',
                JSON.stringify({ productId: mockProduct.id, quantity: 2 })
            );
        });

        it('should not add to cart if product is null', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.product = null;

            component.addToCart();

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should not add to cart if already adding to cart', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.isAddingToCart = true;

            component.addToCart();

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should not add to cart if product is out of stock', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.product = mockOutOfStockProduct;

            component.addToCart();

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should not add to cart if quantity is zero or negative', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.quantity = 0;

            component.addToCart();

            expect(notificationService.showWarning).toHaveBeenCalledWith('La cantidad debe ser mayor a cero.');
            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should not add to cart if quantity exceeds stock', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.product = mockLimitedStockProduct; // Stock = 2
            component.quantity = 5;

            component.addToCart();

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should handle add to cart error', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(throwError(() => new Error('Cart error')));
            spyOn(console, 'error');

            component.addToCart();

            expect(console.error).toHaveBeenCalled();
            expect(component.isAddingToCart).toBe(false);
        });

        it('should set and clear loading state during add to cart', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));

            expect(component.isAddingToCart).toBe(false);

            component.addToCart();

            expect(component.isAddingToCart).toBe(false); // Cleared after completion
        });
    });

    describe('goBack Navigation', () => {
        it('should call location.back()', () => {
            component.goBack();

            expect(location.back).toHaveBeenCalled();
        });
    });

    describe('Component Lifecycle', () => {
        it('should unsubscribe on destroy', () => {
            const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            component['routeSub'] = subscription;

            component.ngOnDestroy();

            expect(subscription.unsubscribe).toHaveBeenCalled();
        });

        it('should handle destroy with no subscription', () => {
            component['routeSub'] = null;

            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('Loading States', () => {
        it('should show loading state during product load', () => {
            // Simular respuesta lenta
            productService.getProductsById.and.returnValue(of(mockProduct));

            component.ngOnInit();

            expect(productService.getProductsById).toHaveBeenCalled();
        });

        it('should show adding to cart loading state', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));
            component.product = mockProduct;

            component.addToCart();

            expect(cartService.addItem).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should display appropriate error messages', () => {
            component.error = 'Test error message';

            expect(component.error).toBe('Test error message');
        });

        it('should reset error state when loading product again', () => {
            component.error = 'Previous error';
            productService.getProductsById.and.returnValue(of(mockProduct));

            component.ngOnInit();

            expect(component.error).toBeNull();
        });
    });

    describe('Stock Validation Edge Cases', () => {
        it('should handle zero stock product', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.product = mockOutOfStockProduct;
            component.quantity = 1;

            component.addToCart();

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should prevent quantity increase beyond stock', () => {
            component.product = mockLimitedStockProduct; // Stock = 2
            component.quantity = 2;

            component.increaseQuantity();

            expect(component.quantity).toBe(2); // Should not increase
        });

        it('should allow adding exact stock quantity', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));
            component.product = mockLimitedStockProduct; // Stock = 2
            component.quantity = 2;

            component.addToCart();

            expect(cartService.addItem).toHaveBeenCalledWith(mockLimitedStockProduct.id, 2);
        });
    });

    describe('Route Parameter Changes', () => {
        it('should reload product when route parameter changes', () => {
            productService.getProductsById.and.returnValue(of(mockProduct));

            // Simular cambio de parámetro de ruta
            const paramMapSubject = new BehaviorSubject(new Map([['idProduct', 'prod-2']]));
            activatedRoute.paramMap = paramMapSubject.asObservable();

            component.ngOnInit();

            expect(productService.getProductsById).toHaveBeenCalledWith('prod-2');
        });
    });

    describe('Quantity Validation Edge Cases', () => {
        beforeEach(() => {
            component.product = mockProduct;
        });

        it('should handle negative quantity input prevention', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.quantity = -1;

            component.addToCart();

            expect(notificationService.showWarning).toHaveBeenCalledWith('La cantidad debe ser mayor a cero.');
            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should handle boundary quantity values', () => {
            component.quantity = 1;

            // Test minimum boundary
            component.decreaseQuantity();
            expect(component.quantity).toBe(1);

            // Test maximum boundary
            component.quantity = mockProduct.stock; // 10
            component.increaseQuantity();
            expect(component.quantity).toBe(mockProduct.stock);
        });
    });
});
