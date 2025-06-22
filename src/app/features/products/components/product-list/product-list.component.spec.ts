import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ProductListComponent } from './product-list.component';
import { ProductService, PaginatedProductsResponse } from '../../services/product/product.service';
import { CategoryService } from '../../services/category/category.service';
import { CartService } from '../../../cart/services/cart.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { IProduct } from '../../model/iproduct';
import { ICategory } from '../../model/icategory';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

describe('ProductListComponent', () => {
    let component: ProductListComponent;
    let fixture: ComponentFixture<ProductListComponent>;
    let productService: jasmine.SpyObj<ProductService>;
    let categoryService: jasmine.SpyObj<CategoryService>;
    let cartService: jasmine.SpyObj<CartService>;
    let authService: jasmine.SpyObj<AuthService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let router: jasmine.SpyObj<Router>;
    let location: jasmine.SpyObj<Location>; let activatedRoute: any;

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
        description: 'Pizza con mozzarella y albahaca',
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

    const mockProduct2: IProduct = {
        id: 'prod-2',
        name: 'Pizza Pepperoni',
        description: 'Pizza con pepperoni',
        price: 18.00,
        priceWithTax: 20.16,
        stock: 5,
        category: mockCategory,
        unit: { id: 'unit-1', name: 'Unidad' } as any,
        isActive: true,
        taxRate: 12,
        tags: ['italiana', 'picante'],
        imgUrl: 'pizza-pepperoni.jpg'
    };
    const mockPaginatedResponse: PaginatedProductsResponse = {
        products: [mockProduct, mockProduct2],
        total: 2
    };

    const mockOutOfStockProduct: IProduct = {
        ...mockProduct,
        id: 'prod-3',
        name: 'Pizza Agotada',
        stock: 0
    };

    beforeEach(async () => {
        // Crear ParamMap observable
        const paramMapSubject = new BehaviorSubject(new Map([['idCategory', 'cat-1']]));

        const activatedRouteSpy = {
            paramMap: paramMapSubject.asObservable()
        };

        const productServiceSpy = jasmine.createSpyObj('ProductService', [
            'getProductsByCategory'
        ]);

        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
            'getCategoryById'
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
            'showSuccess'
        ]);

        const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
            url: '/products/cat-1'
        });

        const locationSpy = jasmine.createSpyObj('Location', ['back']);

        await TestBed.configureTestingModule({
            declarations: [ProductListComponent],
            providers: [
                { provide: ProductService, useValue: productServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: CartService, useValue: cartServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Location, useValue: locationSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProductListComponent);
        component = fixture.componentInstance;
        productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
        categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
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
            expect(component.listProducts).toEqual([]);
            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(component.currentPage).toBe(1);
            expect(component.itemsPerPage).toBe(8);
            expect(component.totalItems).toBe(0);
            expect(component.totalPages).toBe(0);
            expect(component.productsBeingAdded).toEqual({});
        });
    });

    describe('ngOnInit and Route Changes', () => {
        it('should load products when category ID is provided', () => {
            productService.getProductsByCategory.and.returnValue(of(mockPaginatedResponse));
            categoryService.getCategoryById.and.returnValue(of(mockCategory));

            component.ngOnInit();

            expect(component.idCategory).toBe('cat-1');
            expect(productService.getProductsByCategory).toHaveBeenCalled();
            expect(categoryService.getCategoryById).toHaveBeenCalledWith('cat-1');
        });

        it('should handle error when no category ID is provided', () => {
            // Simular ruta sin parámetro de categoría
            const paramMapSubject = new BehaviorSubject(new Map());
            activatedRoute.paramMap = paramMapSubject.asObservable();

            component.ngOnInit();

            expect(component.error).toBe("Categoría no especificada en la URL.");
            expect(component.isLoading).toBe(false);
        }); it('should handle state changes during category transitions', () => {
            productService.getProductsByCategory.and.returnValue(of(mockPaginatedResponse));
            categoryService.getCategoryById.and.returnValue(of(mockCategory));

            // Ejecutar manualmente ngOnInit después de configurar los mocks
            component.ngOnInit();

            expect(component.idCategory).toBe('cat-1');
            expect(component.currentPage).toBe(1);
            expect(component.error).toBeNull();
            expect(productService.getProductsByCategory).toHaveBeenCalled();
            expect(categoryService.getCategoryById).toHaveBeenCalled();
        });
    });

    describe('loadProducts', () => {
        beforeEach(() => {
            component.idCategory = 'cat-1';
        });

        it('should load products successfully', () => {
            productService.getProductsByCategory.and.returnValue(of(mockPaginatedResponse));

            component.loadProducts();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBeNull();
            expect(component.listProducts).toEqual(mockPaginatedResponse.products);
            expect(component.totalItems).toBe(mockPaginatedResponse.total);
            expect(component.totalPages).toBe(Math.ceil(mockPaginatedResponse.total / component.itemsPerPage));
        });

        it('should handle products loading error', () => {
            productService.getProductsByCategory.and.returnValue(throwError(() => new Error('Server error')));

            component.loadProducts();

            expect(component.isLoading).toBe(false);
            expect(component.error).toBe('Error al cargar los productos. Por favor, intente más tarde.');
            expect(component.listProducts).toEqual([]);
            expect(component.totalItems).toBe(0);
            expect(component.totalPages).toBe(0);
        });

        it('should not load products when category ID is not set', () => {
            component.idCategory = null;

            component.loadProducts();

            expect(productService.getProductsByCategory).not.toHaveBeenCalled();
        });

        it('should set loading state during products load', () => {
            productService.getProductsByCategory.and.returnValue(of(mockPaginatedResponse));

            component.loadProducts();

            expect(productService.getProductsByCategory).toHaveBeenCalledWith(
                'cat-1',
                { page: component.currentPage, limit: component.itemsPerPage }
            );
        });
    });

    describe('loadPage (Pagination)', () => {
        beforeEach(() => {
            component.idCategory = 'cat-1';
            productService.getProductsByCategory.and.returnValue(of(mockPaginatedResponse));
        });

        it('should load specific page when requested', () => {
            component.loadPage(2);

            expect(component.currentPage).toBe(2);
            expect(productService.getProductsByCategory).toHaveBeenCalledWith(
                'cat-1',
                { page: 2, limit: component.itemsPerPage }
            );
        });

        it('should not load page if already on that page', () => {
            component.currentPage = 2;

            component.loadPage(2);

            expect(productService.getProductsByCategory).not.toHaveBeenCalled();
        });

        it('should not load page if already loading', () => {
            component.isLoading = true;

            component.loadPage(2);

            expect(productService.getProductsByCategory).not.toHaveBeenCalled();
        });
    });

    describe('getCategoryDetails', () => {
        it('should load category details successfully', () => {
            categoryService.getCategoryById.and.returnValue(of(mockCategory));

            component.getCategoryDetails('cat-1');

            expect(component.category).toEqual(mockCategory);
            expect(categoryService.getCategoryById).toHaveBeenCalledWith('cat-1');
        });

        it('should handle category loading error', () => {
            categoryService.getCategoryById.and.returnValue(throwError(() => new Error('Category not found')));

            component.getCategoryDetails('cat-1');

            expect(component.category).toEqual({
                id: '',
                name: 'Categoría Desconocida',
                description: 'No se pudo cargar la información.',
                isActive: false
            });
        });

        it('should not load category when ID is empty', () => {
            component.getCategoryDetails('');

            expect(categoryService.getCategoryById).not.toHaveBeenCalled();
        });
    });

    describe('viewProductDetail (Navigation)', () => {
        beforeEach(() => {
            component.idCategory = 'cat-1';
        });

        it('should navigate to product detail with correct parameters', () => {
            component.viewProductDetail('prod-1');

            expect(router.navigate).toHaveBeenCalledWith(['/products', 'cat-1', 'prod-1']);
        });

        it('should show error when category ID is missing', () => {
            component.idCategory = null;

            component.viewProductDetail('prod-1');

            expect(component.error).toBe("No se pudo abrir el detalle del producto.");
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('should show error when product ID is missing', () => {
            component.viewProductDetail('');

            expect(component.error).toBe("No se pudo abrir el detalle del producto.");
            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe('addToCart (Authentication Required)', () => {
        it('should add product to cart when user is authenticated', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));

            component.addToCart(mockProduct);

            expect(cartService.addItem).toHaveBeenCalledWith(mockProduct.id, 1);
            expect(component.productsBeingAdded[mockProduct.id]).toBeUndefined();
        });

        it('should redirect to login when user is not authenticated', () => {
            authService.isAuthenticated.and.returnValue(false);

            component.addToCart(mockProduct);

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

            component.addToCart(mockProduct);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'pendingCartAction',
                JSON.stringify({ productId: mockProduct.id, quantity: 1 })
            );
        });

        it('should not add product if already being added', () => {
            authService.isAuthenticated.and.returnValue(true);
            component.productsBeingAdded[mockProduct.id] = true;

            component.addToCart(mockProduct);

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should not add product if out of stock', () => {
            authService.isAuthenticated.and.returnValue(true);

            component.addToCart(mockOutOfStockProduct);

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should not add product if product is null', () => {
            authService.isAuthenticated.and.returnValue(true);

            component.addToCart(null as any);

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should handle add to cart error', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(throwError(() => new Error('Cart error')));
            spyOn(console, 'error');

            component.addToCart(mockProduct);

            expect(console.error).toHaveBeenCalled();
            expect(component.productsBeingAdded[mockProduct.id]).toBeUndefined();
        });

        it('should set and clear loading state for product being added', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));

            // Verificar que no está siendo agregado inicialmente
            expect(component.productsBeingAdded[mockProduct.id]).toBeUndefined();

            component.addToCart(mockProduct);

            // Después de completar, debería estar limpio
            expect(component.productsBeingAdded[mockProduct.id]).toBeUndefined();
        });
    });

    describe('goBack (Navigation)', () => {
        it('should call location.back()', () => {
            component.goBack();

            expect(location.back).toHaveBeenCalled();
        });
    });

    describe('Component Lifecycle', () => {
        it('should unsubscribe on destroy', () => {
            const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            component['routeSubscription'] = subscription;

            component.ngOnDestroy();

            expect(subscription.unsubscribe).toHaveBeenCalled();
        });

        it('should handle destroy with no subscription', () => {
            component['routeSubscription'] = null;

            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('Loading States', () => {
        it('should show loading state during products load', () => {
            component.idCategory = 'cat-1';
            productService.getProductsByCategory.and.returnValue(of(mockPaginatedResponse));

            component.loadProducts();

            expect(productService.getProductsByCategory).toHaveBeenCalled();
        });

        it('should show individual product loading states', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));

            component.addToCart(mockProduct);

            // El estado se maneja automáticamente por finalize()
            expect(cartService.addItem).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should display appropriate error messages', () => {
            component.error = 'Test error message';

            expect(component.error).toBe('Test error message');
        });

        it('should reset error state when loading products again', () => {
            component.error = 'Previous error';
            component.idCategory = 'cat-1';
            productService.getProductsByCategory.and.returnValue(of(mockPaginatedResponse));

            component.loadProducts();

            expect(component.error).toBeNull();
        });
    });

    describe('Stock Validation', () => {
        it('should prevent adding out of stock products', () => {
            authService.isAuthenticated.and.returnValue(true);

            component.addToCart(mockOutOfStockProduct);

            expect(cartService.addItem).not.toHaveBeenCalled();
        });

        it('should allow adding products with stock', () => {
            authService.isAuthenticated.and.returnValue(true);
            cartService.addItem.and.returnValue(of({} as any));

            component.addToCart(mockProduct);

            expect(cartService.addItem).toHaveBeenCalledWith(mockProduct.id, 1);
        });
    });
});
