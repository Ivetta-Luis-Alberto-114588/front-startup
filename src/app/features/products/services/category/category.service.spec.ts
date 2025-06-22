import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { ICategory } from '../../model/icategory';
import { environment } from 'src/environments/environment';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  const mockCategory: ICategory = {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-15')
  };

  const mockCategories: ICategory[] = [
    mockCategory,
    {
      id: '2',
      name: 'Clothing',
      description: 'Fashion and apparel',
      isActive: true,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-16')
    },
    {
      id: '3',
      name: 'Books',
      description: 'Books and literature',
      isActive: false,
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-17')
    },
    {
      id: '4',
      name: 'Home & Garden',
      description: 'Home improvement and gardening supplies',
      isActive: true
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService]
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllCategories', () => {
    it('should retrieve all categories', () => {
      service.getAllCategories().subscribe(categories => {
        expect(categories).toEqual(mockCategories);
        expect(categories.length).toBe(4);
        
        // Verify specific categories
        expect(categories[0].name).toBe('Electronics');
        expect(categories[0].isActive).toBe(true);
        expect(categories[1].name).toBe('Clothing');
        expect(categories[2].name).toBe('Books');
        expect(categories[2].isActive).toBe(false);
        expect(categories[3].name).toBe('Home & Garden');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });

    it('should handle empty categories list', () => {
      service.getAllCategories().subscribe(categories => {
        expect(categories).toEqual([]);
        expect(categories.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should only return active categories when filtered by backend', () => {
      const activeCategories = mockCategories.filter(category => category.isActive);
      
      service.getAllCategories().subscribe(categories => {
        expect(categories).toEqual(activeCategories);
        expect(categories.length).toBe(3);
        expect(categories.every(category => category.isActive)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush(activeCategories);
    });

    it('should handle server error', () => {
      service.getAllCategories().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', () => {
      service.getAllCategories().subscribe({
        next: () => fail('Expected a network error'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getCategoryById', () => {
    it('should retrieve a specific category by ID', () => {
      const categoryId = '1';

      service.getCategoryById(categoryId).subscribe(category => {
        expect(category).toEqual(mockCategory);
        expect(category.id).toBe(categoryId);
        expect(category.name).toBe('Electronics');
        expect(category.description).toBe('Electronic devices and accessories');
        expect(category.isActive).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
    });

    it('should handle category not found', () => {
      const categoryId = 'non-existent';

      service.getCategoryById(categoryId).subscribe({
        next: () => fail('Expected a 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      req.flush('Category not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle special characters in category ID', () => {
      const categoryId = 'category-with-special-chars-123';

      service.getCategoryById(categoryId).subscribe(category => {
        expect(category).toEqual(mockCategory);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
    });

    it('should handle empty string category ID', () => {
      const categoryId = '';

      service.getCategoryById(categoryId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', () => {
      const newCategoryData: ICategory = {
        id: '',
        name: 'Sports',
        description: 'Sports equipment and accessories',
        isActive: true
      };

      const createdCategory: ICategory = {
        ...newCategoryData,
        id: '5',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      service.createCategory(newCategoryData).subscribe(category => {
        expect(category).toEqual(createdCategory);
        expect(category.id).toBe('5');
        expect(category.name).toBe('Sports');
        expect(category.description).toBe('Sports equipment and accessories');
        expect(category.isActive).toBe(true);
        expect(category.createdAt).toBeDefined();
        expect(category.updatedAt).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCategoryData);
      req.flush(createdCategory);
    });

    it('should handle validation errors when creating category', () => {
      const invalidCategoryData: ICategory = {
        id: '',
        name: '',
        description: '',
        isActive: true
      };

      const validationError = {
        message: 'Validation failed',
        details: [
          'Name is required',
          'Description is required'
        ]
      };

      service.createCategory(invalidCategoryData).subscribe({
        next: () => fail('Expected validation error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Validation failed');
          expect(error.error.details).toContain('Name is required');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush(validationError, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle duplicate category name', () => {
      const duplicateCategoryData: ICategory = {
        id: '',
        name: 'Electronics',
        description: 'Duplicate category',
        isActive: true
      };

      service.createCategory(duplicateCategoryData).subscribe({
        next: () => fail('Expected conflict error'),
        error: (error) => {
          expect(error.status).toBe(409);
          expect(error.statusText).toBe('Conflict');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush('Category name already exists', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', () => {
      const categoryId = '1';
      const updateData: ICategory = {
        ...mockCategory,
        name: 'Updated Electronics',
        description: 'Updated electronic devices and accessories',
        updatedAt: new Date()
      };

      service.updateCategory(categoryId, updateData).subscribe(category => {
        expect(category).toEqual(updateData);
        expect(category.id).toBe(categoryId);
        expect(category.name).toBe('Updated Electronics');
        expect(category.description).toBe('Updated electronic devices and accessories');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(updateData);
    });

    it('should handle category not found when updating', () => {
      const categoryId = 'non-existent';
      const updateData: ICategory = {
        ...mockCategory,
        name: 'Updated Category'
      };

      service.updateCategory(categoryId, updateData).subscribe({
        next: () => fail('Expected a 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      req.flush('Category not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle validation errors when updating', () => {
      const categoryId = '1';
      const invalidUpdateData: ICategory = {
        id: categoryId,
        name: '',
        description: '',
        isActive: true
      };

      service.updateCategory(categoryId, invalidUpdateData).subscribe({
        next: () => fail('Expected validation error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      req.flush('Validation failed', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle partial category updates', () => {
      const categoryId = '1';
      const partialUpdateData: ICategory = {
        ...mockCategory,
        isActive: false
      };

      service.updateCategory(categoryId, partialUpdateData).subscribe(category => {
        expect(category.isActive).toBe(false);
        expect(category.name).toBe(mockCategory.name); // Should remain unchanged
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.body).toEqual(partialUpdateData);
      req.flush(partialUpdateData);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', () => {
      const categoryId = '1';      service.deleteCategory(categoryId).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toBeNull();
      req.flush(null);
    });

    it('should handle category not found when deleting', () => {
      const categoryId = 'non-existent';

      service.deleteCategory(categoryId).subscribe({
        next: () => fail('Expected a 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      req.flush('Category not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle conflict when deleting category with dependencies', () => {
      const categoryId = '1';

      service.deleteCategory(categoryId).subscribe({
        next: () => fail('Expected a conflict error'),
        error: (error) => {
          expect(error.status).toBe(409);
          expect(error.statusText).toBe('Conflict');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      req.flush('Cannot delete category with associated products', { status: 409, statusText: 'Conflict' });
    });

    it('should handle empty string category ID when deleting', () => {
      const categoryId = '';

      service.deleteCategory(categoryId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('API configuration', () => {
    it('should use the correct API endpoint for GET all', () => {
      service.getAllCategories().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should use the correct API endpoint for GET by ID', () => {
      const categoryId = 'test-id';
      service.getCategoryById(categoryId).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
    });

    it('should use the correct API endpoint for POST', () => {
      service.createCategory(mockCategory).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.method).toBe('POST');
      req.flush(mockCategory);
    });

    it('should use the correct API endpoint for PUT', () => {
      const categoryId = 'test-id';
      service.updateCategory(categoryId, mockCategory).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockCategory);
    });

    it('should use the correct API endpoint for DELETE', () => {
      const categoryId = 'test-id';
      service.deleteCategory(categoryId).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should not send any request body for GET requests', () => {
      service.getAllCategories().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.body).toBeNull();
      req.flush([]);
    });

    it('should send correct request body for POST', () => {
      const categoryData = mockCategory;
      service.createCategory(categoryData).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      expect(req.request.body).toEqual(categoryData);
      req.flush(mockCategory);
    });

    it('should send correct request body for PUT', () => {
      const categoryId = '1';
      const categoryData = mockCategory;
      service.updateCategory(categoryId, categoryData).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/${categoryId}`);
      expect(req.request.body).toEqual(categoryData);
      req.flush(mockCategory);
    });
  });

  describe('Data integrity', () => {
    it('should preserve category data structure', () => {
      const categoryWithAllFields: ICategory = {
        id: 'complete-category',
        name: 'Complete Category',
        description: 'A category with all fields populated',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-15')
      };

      service.getAllCategories().subscribe(categories => {
        const category = categories[0];
        expect(category).toEqual(categoryWithAllFields);
        expect(category.id).toBe('complete-category');
        expect(category.name).toBe('Complete Category');
        expect(category.description).toBe('A category with all fields populated');
        expect(category.isActive).toBe(true);
        expect(category.createdAt).toEqual(new Date('2023-01-01'));
        expect(category.updatedAt).toEqual(new Date('2023-01-15'));
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush([categoryWithAllFields]);
    });

    it('should handle categories without optional fields', () => {
      const categoryWithoutOptionalFields: ICategory = {
        id: 'minimal-category',
        name: 'Minimal Category',
        description: 'Category without optional fields',
        isActive: false
      };

      service.getCategoryById('minimal-category').subscribe(category => {
        expect(category).toEqual(categoryWithoutOptionalFields);
        expect(category.createdAt).toBeUndefined();
        expect(category.updatedAt).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories/minimal-category`);
      req.flush(categoryWithoutOptionalFields);
    });

    it('should handle boolean values correctly', () => {
      const activeCategory: ICategory = { ...mockCategory, isActive: true };
      const inactiveCategory: ICategory = { ...mockCategory, id: '2', isActive: false };

      service.getAllCategories().subscribe(categories => {
        expect(categories[0].isActive).toBe(true);
        expect(categories[1].isActive).toBe(false);
        expect(typeof categories[0].isActive).toBe('boolean');
        expect(typeof categories[1].isActive).toBe('boolean');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush([activeCategory, inactiveCategory]);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long category names', () => {
      const longNameCategory: ICategory = {
        ...mockCategory,
        name: 'A'.repeat(500)
      };

      service.createCategory(longNameCategory).subscribe(category => {
        expect(category.name).toBe('A'.repeat(500));
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush(longNameCategory);
    });

    it('should handle special characters in category data', () => {
      const specialCharCategory: ICategory = {
        id: 'special-chars',
        name: 'Caté-gory with Special Chars! @#$%',
        description: 'Description with émojis 🎉 and símbolos',
        isActive: true
      };

      service.createCategory(specialCharCategory).subscribe(category => {
        expect(category.name).toBe('Caté-gory with Special Chars! @#$%');
        expect(category.description).toBe('Description with émojis 🎉 and símbolos');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      req.flush(specialCharCategory);
    });

    it('should handle concurrent requests', () => {
      // Simulate multiple concurrent requests
      service.getAllCategories().subscribe();
      service.getCategoryById('1').subscribe();
      service.getCategoryById('2').subscribe();

      const getAllReq = httpMock.expectOne(`${environment.apiUrl}/api/categories`);
      const getByIdReq1 = httpMock.expectOne(`${environment.apiUrl}/api/categories/1`);
      const getByIdReq2 = httpMock.expectOne(`${environment.apiUrl}/api/categories/2`);

      getAllReq.flush(mockCategories);
      getByIdReq1.flush(mockCategories[0]);
      getByIdReq2.flush(mockCategories[1]);

      // All requests should complete successfully
      expect(getAllReq.request.method).toBe('GET');
      expect(getByIdReq1.request.method).toBe('GET');
      expect(getByIdReq2.request.method).toBe('GET');
    });
  });
});
