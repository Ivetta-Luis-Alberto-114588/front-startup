import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminProductService, PaginatedAdminProductsResponse, ProductFormData } from './admin-product.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { IProduct } from 'src/app/features/products/model/iproduct';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { environment } from 'src/environments/environment';

describe('AdminProductService', () => {
  let service: AdminProductService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const baseUrl = `${environment.apiUrl.trim()}/api/admin/products`;
  const mockToken = 'admin-jwt-token';
  const mockProduct: IProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test product description',
    price: 99.99,
    stock: 50,
    category: { id: 'cat1', name: 'Electronics', description: 'Electronics category', isActive: true },
    unit: { id: 'unit1', name: 'piece', description: 'Piece unit', isActive: true },
    taxRate: 0.15,
    priceWithTax: 114.99,
    isActive: true,
    tags: ['featured'],
    imgUrl: 'https://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPaginatedResponse: PaginatedAdminProductsResponse = {
    total: 100,
    products: [mockProduct]
  };

  const mockProductFormData: ProductFormData = {
    name: 'New Product',
    description: 'New product description',
    price: 149.99,
    stock: 25,
    category: 'cat1',
    unit: 'unit1',
    taxRate: 0.15,
    isActive: true,
    tags: ['featured', 'new'],
    imgUrl: 'https://example.com/new-image.jpg'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AdminProductService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(AdminProductService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authService.getToken.and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getProducts() - Pagination and Listing', () => {
    it('should retrieve paginated products with correct parameters', () => {
      // Arrange
      const pagination: PaginationDto = { page: 1, limit: 10 };

      // Act
      service.getProducts(pagination).subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.total).toBe(100);
        expect(response.products.length).toBe(1);
        expect(response.products[0]).toEqual(mockProduct);
      });

      // Assert
      const req = httpMock.expectOne(request => {
        return request.url === baseUrl &&
               request.method === 'GET' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '10';
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });    it('should handle different pagination parameters', () => {
      // Arrange
      const pagination: PaginationDto = { page: 3, limit: 25 };

      // Act
      service.getProducts(pagination).subscribe(response => {
        expect(response).toBeDefined();
        expect(response.total).toBe(0);
        expect(response.products).toEqual([]);
      });

      // Assert
      const req = httpMock.expectOne(request => {
        return request.params.get('page') === '3' &&
               request.params.get('limit') === '25';
      });

      req.flush({ total: 0, products: [] });
    });    it('should handle empty products response', () => {
      // Arrange
      const pagination: PaginationDto = { page: 1, limit: 10 };
      const emptyResponse: PaginatedAdminProductsResponse = { total: 0, products: [] };

      // Act
      service.getProducts(pagination).subscribe(response => {
        expect(response.total).toBe(0);
        expect(response.products.length).toBe(0);
      });

      // Assert
      const req = httpMock.expectOne(request => {
        return request.url === baseUrl &&
               request.method === 'GET' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '10';
      });
      req.flush(emptyResponse);
    });    it('should handle large pagination requests', () => {
      // Arrange
      const pagination: PaginationDto = { page: 100, limit: 100 };

      // Act
      service.getProducts(pagination).subscribe(response => {
        expect(response).toBeDefined();
        expect(response.total).toBe(10000);
        expect(response.products).toEqual([]);
      });

      // Assert
      const req = httpMock.expectOne(request => {
        return request.params.get('page') === '100' &&
               request.params.get('limit') === '100';
      });

      req.flush({ total: 10000, products: [] });
    });
  });
  describe('getProductById() - Single Product Retrieval', () => {
    it('should retrieve a single product by ID', () => {
      // Arrange
      const productId = '12345';

      // Act
      service.getProductById(productId).subscribe(product => {
        expect(product).toEqual(mockProduct);
        expect(product.id).toBe('1');
        expect(product.name).toBe('Test Product');
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });

    it('should handle product not found error (404)', () => {
      // Arrange
      const productId = 'non-existent';
      let errorResponse: any;

      // Act
      service.getProductById(productId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      req.flush({ message: 'Product not found' }, { status: 404, statusText: 'Not Found' });

      expect(errorResponse.status).toBe(404);
    });    it('should sanitize product ID before making request', () => {
      // Arrange
      const dirtyId = '  product-123  ';

      // Act
      service.getProductById(dirtyId).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${dirtyId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });
  });

  describe('createProduct() - Product Creation', () => {
    it('should create a new product without image', () => {
      // Act
      service.createProduct(mockProductFormData).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      // Assert
      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);

      // Verify FormData contents
      const formData = req.request.body as FormData;
      expect(formData.get('name')).toBe(mockProductFormData.name);
      expect(formData.get('description')).toBe(mockProductFormData.description);
      expect(formData.get('price')).toBe(mockProductFormData.price.toString());
      expect(formData.get('stock')).toBe(mockProductFormData.stock.toString());
      expect(formData.get('category')).toBe(mockProductFormData.category);
      expect(formData.get('unit')).toBe(mockProductFormData.unit);
      expect(formData.get('taxRate')).toBe(mockProductFormData.taxRate.toString());
      expect(formData.get('isActive')).toBe('true');
      expect(formData.get('tags')).toBe('featured,new');

      req.flush(mockProduct);
    });

    it('should create a new product with image file', () => {
      // Arrange
      const imageFile = new File(['image content'], 'test-image.jpg', { type: 'image/jpeg' });

      // Act
      service.createProduct(mockProductFormData, imageFile).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });      // Assert
      const req = httpMock.expectOne(baseUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.get('image')).toEqual(imageFile);
      expect(formData.get('name')).toBe(mockProductFormData.name);

      req.flush(mockProduct);
    });

    it('should handle product creation with minimal data', () => {
      // Arrange
      const minimalData: ProductFormData = {
        name: 'Minimal Product',
        description: 'Basic description',
        price: 10.00,
        stock: 1,
        category: 'cat1',
        unit: 'unit1',
        taxRate: 0.0
      };

      // Act
      service.createProduct(minimalData).subscribe();

      // Assert
      const req = httpMock.expectOne(baseUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.get('isActive')).toBe('true'); // Default value
      expect(formData.get('tags')).toBe(''); // Empty tags

      req.flush(mockProduct);
    });

    it('should handle product creation with isActive false', () => {
      // Arrange
      const inactiveProductData: ProductFormData = {
        ...mockProductFormData,
        isActive: false
      };

      // Act
      service.createProduct(inactiveProductData).subscribe();

      // Assert
      const req = httpMock.expectOne(baseUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.get('isActive')).toBe('false');

      req.flush(mockProduct);
    });

    it('should handle validation errors during creation', () => {
      // Arrange
      let errorResponse: any;

      // Act
      service.createProduct(mockProductFormData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });

      // Assert
      const req = httpMock.expectOne(baseUrl);
      req.flush(
        { 
          message: 'Validation failed',
          errors: { name: 'Name is required', price: 'Price must be positive' }
        }, 
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorResponse.status).toBe(400);
    });
  });

  describe('updateProduct() - Product Updates', () => {
    it('should update an existing product with partial data', () => {
      // Arrange
      const productId = '12345';
      const updateData: Partial<ProductFormData> = {
        name: 'Updated Product Name',
        price: 199.99,
        isActive: false
      };

      // Act
      service.updateProduct(productId, updateData).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      expect(req.request.method).toBe('PUT');
      
      const formData = req.request.body as FormData;
      expect(formData.get('name')).toBe('Updated Product Name');
      expect(formData.get('price')).toBe('199.99');
      expect(formData.get('isActive')).toBe('false');

      req.flush(mockProduct);
    });

    it('should update product with new image', () => {
      // Arrange
      const productId = '12345';
      const newImage = new File(['new image'], 'new-image.png', { type: 'image/png' });
      const updateData: Partial<ProductFormData> = { name: 'Updated Name' };

      // Act
      service.updateProduct(productId, updateData, newImage).subscribe();      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      const formData = req.request.body as FormData;
      
      expect(formData.get('image')).toEqual(newImage);
      expect(formData.get('name')).toBe('Updated Name');

      req.flush(mockProduct);
    });

    it('should handle image removal by setting imgUrl to empty string', () => {
      // Arrange
      const productId = '12345';
      const updateData: Partial<ProductFormData> = {
        name: 'Updated Name',
        imgUrl: '' // Explicitly remove image
      };

      // Act
      service.updateProduct(productId, updateData).subscribe();

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      const formData = req.request.body as FormData;
      
      expect(formData.get('imgUrl')).toBe('');
      expect(formData.get('name')).toBe('Updated Name');

      req.flush(mockProduct);
    });

    it('should handle tags array updates', () => {
      // Arrange
      const productId = '12345';
      const updateData: Partial<ProductFormData> = {
        tags: ['updated', 'tags', 'array']
      };

      // Act
      service.updateProduct(productId, updateData).subscribe();

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      const formData = req.request.body as FormData;
      
      expect(formData.get('tags')).toBe('updated,tags,array');

      req.flush(mockProduct);
    });

    it('should skip undefined and null values in updates', () => {
      // Arrange
      const productId = '12345';
      const updateData: Partial<ProductFormData> = {
        name: 'Updated Name',
        description: undefined,
        price: null as any,
        stock: 100
      };

      // Act
      service.updateProduct(productId, updateData).subscribe();

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      const formData = req.request.body as FormData;
      
      expect(formData.get('name')).toBe('Updated Name');
      expect(formData.get('stock')).toBe('100');
      expect(formData.has('description')).toBe(false);
      expect(formData.has('price')).toBe(false);

      req.flush(mockProduct);
    });

    it('should handle product update not found error', () => {
      // Arrange
      const productId = 'non-existent';
      const updateData: Partial<ProductFormData> = { name: 'Updated Name' };
      let errorResponse: any;

      // Act
      service.updateProduct(productId, updateData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      req.flush({ message: 'Product not found' }, { status: 404, statusText: 'Not Found' });

      expect(errorResponse.status).toBe(404);
    });
  });

  describe('deleteProduct() - Product Deletion', () => {
    it('should delete a product successfully', () => {
      // Arrange
      const productId = '12345';

      // Act
      service.deleteProduct(productId).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockProduct);
    });

    it('should handle product deletion not found error', () => {
      // Arrange
      const productId = 'non-existent';
      let errorResponse: any;

      // Act
      service.deleteProduct(productId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      req.flush({ message: 'Product not found' }, { status: 404, statusText: 'Not Found' });

      expect(errorResponse.status).toBe(404);
    });

    it('should handle authorization errors during deletion', () => {
      // Arrange
      const productId = '12345';
      let errorResponse: any;

      // Act
      service.deleteProduct(productId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorResponse.status).toBe(401);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', () => {
      // Arrange
      const pagination: PaginationDto = { page: 1, limit: 10 };
      let errorResponse: any;

      // Act
      service.getProducts(pagination).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });      // Assert
      const req = httpMock.expectOne(request => {
        return request.url === baseUrl &&
               request.method === 'GET' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '10';
      });
      req.error(new ErrorEvent('Network error'));

      expect(errorResponse).toBeTruthy();
    });

    it('should handle server errors (500)', () => {
      // Arrange
      const pagination: PaginationDto = { page: 1, limit: 10 };
      let errorResponse: any;

      // Act
      service.getProducts(pagination).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });      // Assert
      const req = httpMock.expectOne(request => {
        return request.url === baseUrl &&
               request.method === 'GET' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '10';
      });
      req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(errorResponse.status).toBe(500);
    });

    it('should handle malformed JSON responses', () => {
      // Arrange
      const pagination: PaginationDto = { page: 1, limit: 10 };
      let errorResponse: any;

      // Act
      service.getProducts(pagination).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => errorResponse = error
      });      // Assert
      const req = httpMock.expectOne(request => {
        return request.url === baseUrl &&
               request.method === 'GET' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '10';
      });      req.error(new ErrorEvent('Parse error'), { status: 0, statusText: 'Parse Error' });

      expect(errorResponse).toBeTruthy();
    });
  });

  describe('FormData Handling', () => {
    it('should handle special characters in product data', () => {
      // Arrange
      const specialData: ProductFormData = {
        name: 'Product with "quotes" & <tags>',
        description: 'Description with\nnewlines and\ttabs',
        price: 99.99,
        stock: 10,
        category: 'cat1',
        unit: 'unit1',
        taxRate: 0.15,
        tags: ['tag with spaces', 'tag-with-dashes', 'tag_with_underscores']
      };

      // Act
      service.createProduct(specialData).subscribe();

      // Assert
      const req = httpMock.expectOne(baseUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.get('name')).toBe('Product with "quotes" & <tags>');
      expect(formData.get('description')).toBe('Description with\nnewlines and\ttabs');
      expect(formData.get('tags')).toBe('tag with spaces,tag-with-dashes,tag_with_underscores');

      req.flush(mockProduct);
    });

    it('should handle very large image files', () => {
      // Arrange
      const largeImageContent = 'x'.repeat(1024 * 1024); // 1MB string
      const largeImageFile = new File([largeImageContent], 'large-image.jpg', { type: 'image/jpeg' });

      // Act
      service.createProduct(mockProductFormData, largeImageFile).subscribe();      // Assert
      const req = httpMock.expectOne(baseUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.get('image')).toEqual(largeImageFile);

      req.flush(mockProduct);
    });
  });
});
