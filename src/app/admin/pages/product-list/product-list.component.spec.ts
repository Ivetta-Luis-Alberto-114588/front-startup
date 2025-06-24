import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError, EMPTY, Subject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ProductListComponent } from './product-list.component';
import { AdminProductService, PaginatedAdminProductsResponse } from '../../services/admin-product.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { IProduct } from 'src/app/features/products/model/iproduct';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

describe('Admin ProductListComponent - Pagination Tests', () => {
    let component: ProductListComponent;
    let fixture: ComponentFixture<ProductListComponent>;
    let adminProductService: jasmine.SpyObj<AdminProductService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let router: jasmine.SpyObj<Router>;
    let location: jasmine.SpyObj<Location>;
    let modalService: jasmine.SpyObj<NgbModal>;

    // Mock data
    const mockCategory = {
        id: 'cat-1',
        name: 'Pizzas',
        description: 'Deliciosas pizzas',
        isActive: true
    };

    const mockProduct: IProduct = {
        id: 'prod-1',
        name: 'Pizza Margarita',
        description: 'Pizza con mozzarella',
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

    const mockProducts: IProduct[] = Array.from({ length: 25 }, (_, i) => ({
        ...mockProduct,
        id: `prod-${i + 1}`,
        name: `Product ${i + 1}`
    }));

    const mockPaginatedResponse: PaginatedAdminProductsResponse = {
        products: mockProducts.slice(0, 10), // First 10 products
        total: 25
    };

    beforeEach(async () => {
        const adminProductServiceSpy = jasmine.createSpyObj('AdminProductService', ['getProducts', 'deleteProduct']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const locationSpy = jasmine.createSpyObj('Location', ['back']);
        const modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']); await TestBed.configureTestingModule({
            declarations: [ProductListComponent],
            imports: [NgbPaginationModule],
            providers: [
                { provide: AdminProductService, useValue: adminProductServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Location, useValue: locationSpy },
                { provide: NgbModal, useValue: modalServiceSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(ProductListComponent);
        component = fixture.componentInstance;
        adminProductService = TestBed.inject(AdminProductService) as jasmine.SpyObj<AdminProductService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        location = TestBed.inject(Location) as jasmine.SpyObj<Location>;
        modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;
    });

    describe('Pagination Functionality', () => {
        beforeEach(() => {
            adminProductService.getProducts.and.returnValue(of(mockPaginatedResponse));
        });

        it('should initialize with correct pagination defaults', () => {
            expect(component.currentPage).toBe(1);
            expect(component.itemsPerPage).toBe(10);
            expect(component.totalItems).toBe(0);
        });

        it('should load first page on component initialization', () => {
            fixture.detectChanges();

            expect(adminProductService.getProducts).toHaveBeenCalledWith({
                page: 1,
                limit: 10
            });
            expect(component.products.length).toBe(10);
            expect(component.totalItems).toBe(25);
            expect(component.currentPage).toBe(1);
        });

        it('should load page 2 when loadPage(2) is called', () => {
            const page2Response: PaginatedAdminProductsResponse = {
                products: mockProducts.slice(10, 20), // Products 11-20
                total: 25
            };

            adminProductService.getProducts.and.returnValue(of(page2Response));

            component.loadPage(2);

            expect(component.currentPage).toBe(2);
            expect(adminProductService.getProducts).toHaveBeenCalledWith({
                page: 2,
                limit: 10
            });
            expect(component.products.length).toBe(10);
            expect(component.totalItems).toBe(25);
        });

        it('should not reload same page when loadPage is called with current page', () => {
            fixture.detectChanges();
            adminProductService.getProducts.calls.reset();

            component.loadPage(1); // Already on page 1

            expect(adminProductService.getProducts).not.toHaveBeenCalled();
        });

        it('should not load page when component is loading', () => {
            component.isLoading = true;
            adminProductService.getProducts.calls.reset();

            component.loadPage(2);

            expect(adminProductService.getProducts).not.toHaveBeenCalled();
            expect(component.currentPage).toBe(1); // Should remain unchanged
        });

        it('should handle pagination with different page sizes', () => {
            component.itemsPerPage = 5;

            component.loadPage(3);

            expect(adminProductService.getProducts).toHaveBeenCalledWith({
                page: 3,
                limit: 5
            });
        });

        it('should handle error when loading page fails', () => {
            const errorResponse = { error: { error: 'Server error' } };
            adminProductService.getProducts.and.returnValue(throwError(errorResponse));

            component.loadPage(2);

            expect(component.error).toBe('No se pudieron cargar los productos.');
            expect(notificationService.showError).toHaveBeenCalledWith(
                'No se pudieron cargar los productos.',
                'Error'
            );
            expect(component.currentPage).toBe(2); // Page should still be updated
        }); it('should update isLoading state during pagination', async () => {
            const subject = new Subject<PaginatedAdminProductsResponse>();
            adminProductService.getProducts.and.returnValue(subject.asObservable());

            expect(component.isLoading).toBe(false);

            component.loadPage(2);

            expect(component.isLoading).toBe(true);

            subject.next(mockPaginatedResponse);
            subject.complete();

            expect(component.isLoading).toBe(false);
        });

        it('should calculate correct pagination parameters for different pages', () => {
            // Test page 1
            component.currentPage = 1;
            component.loadProducts();
            expect(adminProductService.getProducts).toHaveBeenCalledWith({ page: 1, limit: 10 });

            // Test page 3
            component.currentPage = 3;
            component.loadProducts();
            expect(adminProductService.getProducts).toHaveBeenCalledWith({ page: 3, limit: 10 });

            // Test with different itemsPerPage
            component.itemsPerPage = 20;
            component.currentPage = 2;
            component.loadProducts();
            expect(adminProductService.getProducts).toHaveBeenCalledWith({ page: 2, limit: 20 });
        });

        it('should handle empty results on pagination', () => {
            const emptyResponse: PaginatedAdminProductsResponse = {
                products: [],
                total: 0
            };

            adminProductService.getProducts.and.returnValue(of(emptyResponse));

            component.loadPage(1);

            expect(component.products).toEqual([]);
            expect(component.totalItems).toBe(0);
        });

        it('should reset error state when loading new page', () => {
            component.error = 'Previous error';

            component.loadPage(2);

            expect(component.error).toBeNull();
        });
    });

    describe('Integration with Delete Functionality', () => {
        beforeEach(() => {
            adminProductService.getProducts.and.returnValue(of(mockPaginatedResponse));
            adminProductService.deleteProduct.and.returnValue(of(mockProduct));
        });

        it('should adjust totalItems after deleting product without reloading', () => {
            fixture.detectChanges();

            expect(component.totalItems).toBe(25);

            component.confirmDelete('prod-1');

            expect(component.totalItems).toBe(24);
            expect(component.products.length).toBe(9); // One product removed from current page
        });

        it('should maintain current page when deleting products', () => {
            component.currentPage = 2;
            fixture.detectChanges();

            component.confirmDelete('prod-1');

            expect(component.currentPage).toBe(2);
        });
    });
});
