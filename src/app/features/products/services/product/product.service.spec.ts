import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService, SearchParams, PaginatedProductsResponse } from './product.service';
import { environment } from 'src/environments/environment';
import { IProduct } from '../../model/iproduct';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

describe('ProductService', () => {
    let service: ProductService;
    let httpMock: HttpTestingController;

    const mockCategory = {
        id: 'cat1',
        name: 'Test Category',
        description: 'Test Category Description',
        isActive: true
    };

    const mockUnit = {
        id: 'unit1',
        name: 'Test Unit',
        description: 'Test Unit Description',
        isActive: true
    };

    const mockProduct: IProduct = {
        id: 'prod1',
        name: 'Test Product',
        description: 'Test Product Description',
        price: 100,
        priceWithTax: 121,
        stock: 10,
        taxRate: 21,
        isActive: true,
        imgUrl: 'test-product.jpg',
        category: mockCategory,
        unit: mockUnit,
        tags: ['tag1', 'tag2'],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
    };

    const mockProduct2: IProduct = {
        id: 'prod2',
        name: 'Another Product',
        description: 'Another Product Description',
        price: 200,
        priceWithTax: 242,
        stock: 5,
        taxRate: 21,
        isActive: true,
        imgUrl: 'another-product.jpg',
        category: mockCategory,
        unit: mockUnit,
        tags: ['tag2', 'tag3'],
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-02')
    };

    const mockPaginatedResponse: PaginatedProductsResponse = {
        total: 2,
        products: [mockProduct, mockProduct2]
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ProductService]
        });

        service = TestBed.inject(ProductService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('searchProducts', () => {
        it('should search products with basic parameters', () => {
            const searchParams: SearchParams = {
                page: 1,
                limit: 10,
                q: 'test'
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
                expect(response.products.length).toBe(2);
                expect(response.total).toBe(2);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('page') === '1' &&
                    request.params.get('limit') === '10' &&
                    request.params.get('q') === 'test';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should search products with category filter', () => {
            const searchParams: SearchParams = {
                page: 1,
                limit: 10,
                categories: 'cat1'
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('categories') === 'cat1';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should search products with multiple categories', () => {
            const searchParams: SearchParams = {
                categories: ['cat1', 'cat2']
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('categories') === 'cat1,cat2';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should search products with price range', () => {
            const searchParams: SearchParams = {
                minPrice: 50,
                maxPrice: 150,
                sortBy: 'price',
                sortOrder: 'asc'
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('minPrice') === '50' &&
                    request.params.get('maxPrice') === '150' &&
                    request.params.get('sortBy') === 'price' &&
                    request.params.get('sortOrder') === 'asc';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should search products with tags filter', () => {
            const searchParams: SearchParams = {
                tags: ['tag1', 'tag2']
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('tags') === 'tag1,tag2';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should ignore empty and null parameters', () => {
            const searchParams: SearchParams = {
                page: 1,
                q: '',
                categories: [],
                minPrice: undefined,
                tags: null as any
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('page') === '1' &&
                    !request.params.has('q') &&
                    !request.params.has('categories') &&
                    !request.params.has('minPrice') &&
                    !request.params.has('tags');
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should handle search errors', () => {
            const searchParams: SearchParams = { q: 'test' };

            service.searchProducts(searchParams).subscribe({
                error: (error) => {
                    expect(error.status).toBe(500);
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/products/search?q=test`);
            req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
        });
    });

    describe('getProductsByCategory', () => {
        it('should get products by category with pagination', () => {
            const categoryId = 'cat1';
            const pagination: PaginationDto = { page: 1, limit: 10 };

            service.getProductsByCategory(categoryId, pagination).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
                expect(response.products[0].category.id).toBe('cat1');
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/by-category/${categoryId}` &&
                    request.params.get('page') === '1' &&
                    request.params.get('limit') === '10';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should handle category not found error', () => {
            const categoryId = 'invalid-cat';
            const pagination: PaginationDto = { page: 1, limit: 10 };

            service.getProductsByCategory(categoryId, pagination).subscribe({
                error: (error) => {
                    expect(error.status).toBe(404);
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/products/by-category/${categoryId}?page=1&limit=10`);
            req.flush('Category not found', { status: 404, statusText: 'Not Found' });
        });
    });

    describe('getProductsById', () => {
        it('should get a single product by ID', () => {
            const productId = 'prod1';

            service.getProductsById(productId).subscribe(product => {
                expect(product).toEqual(mockProduct);
                expect(product.id).toBe(productId);
                expect(product.name).toBe('Test Product');
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/products/${productId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockProduct);
        });

        it('should handle product not found error', () => {
            const productId = 'invalid-prod';

            service.getProductsById(productId).subscribe({
                error: (error) => {
                    expect(error.status).toBe(404);
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/products/${productId}`);
            req.flush('Product not found', { status: 404, statusText: 'Not Found' });
        });
    });

    describe('getAllProducts', () => {
        it('should get all products with pagination', () => {
            const pagination: PaginationDto = { page: 1, limit: 20 };
            const mockProductList = [mockProduct, mockProduct2];

            service.getAllProducts(pagination).subscribe(products => {
                expect(products).toEqual(mockProductList);
                expect(products.length).toBe(2);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products` &&
                    request.params.get('page') === '1' &&
                    request.params.get('limit') === '20';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockProductList);
        });

        it('should handle server errors', () => {
            const pagination: PaginationDto = { page: 1, limit: 10 };

            service.getAllProducts(pagination).subscribe({
                error: (error) => {
                    expect(error.status).toBe(500);
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/products?page=1&limit=10`);
            req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
        });
    });

    describe('complex search scenarios', () => {
        it('should handle complex search with all parameters', () => {
            const searchParams: SearchParams = {
                page: 2,
                limit: 5,
                q: 'premium',
                categories: ['cat1', 'cat2'],
                minPrice: 100,
                maxPrice: 500,
                sortBy: 'name',
                sortOrder: 'desc',
                tags: ['premium', 'featured']
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                const params = request.params;
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    params.get('page') === '2' &&
                    params.get('limit') === '5' &&
                    params.get('q') === 'premium' &&
                    params.get('categories') === 'cat1,cat2' &&
                    params.get('minPrice') === '100' &&
                    params.get('maxPrice') === '500' &&
                    params.get('sortBy') === 'name' &&
                    params.get('sortOrder') === 'desc' &&
                    params.get('tags') === 'premium,featured';
            });

            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('should return empty results when no products match', () => {
            const emptyResponse: PaginatedProductsResponse = {
                total: 0,
                products: []
            };

            const searchParams: SearchParams = {
                q: 'nonexistent'
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response.products.length).toBe(0);
                expect(response.total).toBe(0);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/api/products/search?q=nonexistent`);
            req.flush(emptyResponse);
        });
    });

    describe('parameter validation', () => {
        it('should handle zero values correctly', () => {
            const searchParams: SearchParams = {
                minPrice: 0,
                maxPrice: 0
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('minPrice') === '0' &&
                    request.params.get('maxPrice') === '0';
            });

            req.flush(mockPaginatedResponse);
        });

        it('should handle single category as string', () => {
            const searchParams: SearchParams = {
                categories: 'single-cat'
            };

            service.searchProducts(searchParams).subscribe(response => {
                expect(response).toEqual(mockPaginatedResponse);
            });

            const req = httpMock.expectOne(request => {
                return request.url === `${environment.apiUrl}/api/products/search` &&
                    request.params.get('categories') === 'single-cat';
            });

            req.flush(mockPaginatedResponse);
        });
    });
});
