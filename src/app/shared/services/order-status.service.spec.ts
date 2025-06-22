import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderStatusService } from './order-status.service';
import { IOrderStatus, IOrderStatusesResponse } from '../models/iorder-status';
import { environment } from 'src/environments/environment';

describe('OrderStatusService', () => {
  let service: OrderStatusService;
  let httpMock: HttpTestingController;

  const mockOrderStatus: IOrderStatus = {
    _id: '1',
    name: 'Pendiente',
    code: 'PENDING',
    description: 'Pedido pendiente de procesamiento',
    color: '#FFC107',
    priority: 1,
    isActive: true,
    isDefault: true,
    isFinal: false,
    allowedTransitions: ['2', '3'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-15')
  };

  const mockOrderStatuses: IOrderStatus[] = [
    mockOrderStatus,
    {
      _id: '2',
      name: 'Procesando',
      code: 'PROCESSING',
      description: 'Pedido en proceso',
      color: '#17A2B8',
      priority: 2,
      isActive: true,
      isDefault: false,
      isFinal: false,
      allowedTransitions: ['3', '4'],
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-16')
    },
    {
      _id: '3',
      name: 'Completado',
      code: 'COMPLETED',
      description: 'Pedido completado',
      color: '#28A745',
      priority: 10,
      isActive: true,
      isDefault: false,
      isFinal: true,
      allowedTransitions: [],
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-17')
    }
  ];

  const mockBackendResponse = {
    total: 3,
    orderStatuses: [
      {
        _id: '1',
        name: 'Pendiente',
        code: 'PENDING',
        description: 'Pedido pendiente de procesamiento',
        color: '#FFC107',
        order: 1,
        isActive: true,
        isDefault: true,
        canTransitionTo: ['2', '3'],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-15T00:00:00.000Z'
      },
      {
        _id: '2',
        name: 'Procesando',
        code: 'PROCESSING',
        description: 'Pedido en proceso',
        color: '#17A2B8',
        priority: 2,
        isActive: true,
        isDefault: false,
        canTransitionTo: ['3', '4'],
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-16T00:00:00.000Z'
      },
      {
        _id: '3',
        name: 'Completado',
        code: 'COMPLETED',
        description: 'Pedido completado',
        color: '#28A745',
        priority: 10,
        isActive: true,
        isDefault: false,
        canTransitionTo: [],
        createdAt: '2023-01-03T00:00:00.000Z',
        updatedAt: '2023-01-17T00:00:00.000Z'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderStatusService]
    });
    service = TestBed.inject(OrderStatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getOrderStatuses', () => {
    it('should retrieve all order statuses and transform them correctly', () => {
      service.getOrderStatuses().subscribe(response => {
        expect(response.total).toBe(3);
        expect(response.orderStatuses.length).toBe(3);
        
        const firstStatus = response.orderStatuses[0];
        expect(firstStatus._id).toBe('1');
        expect(firstStatus.name).toBe('Pendiente');
        expect(firstStatus.code).toBe('PENDING');
        expect(firstStatus.priority).toBe(1); // Transformed from 'order'
        expect(firstStatus.isFinal).toBe(false);
        expect(firstStatus.allowedTransitions).toEqual(['2', '3']);
        
        const lastStatus = response.orderStatuses[2];
        expect(lastStatus.isFinal).toBe(true); // No transitions means final
        expect(lastStatus.allowedTransitions).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse);
    });

    it('should handle empty order statuses list', () => {
      const emptyResponse = { total: 0, orderStatuses: [] };
      
      service.getOrderStatuses().subscribe(response => {
        expect(response.total).toBe(0);
        expect(response.orderStatuses).toEqual([]);
        expect(response.orderStatuses.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      req.flush(emptyResponse);
    });

    it('should handle backend field variations correctly', () => {
      const backendWithIdField = {
        total: 1,
        orderStatuses: [{
          id: 'backend-id', // Different field name
          name: 'Test Status',
          code: 'TEST',
          description: 'Test description',
          color: '#000000',
          order: 5, // Using 'order' instead of 'priority'
          isActive: true,
          isDefault: false,
          canTransitionTo: ['other-id']
        }]
      };

      service.getOrderStatuses().subscribe(response => {
        const status = response.orderStatuses[0];
        expect(status._id).toBe('backend-id'); // Should map 'id' to '_id'
        expect(status.priority).toBe(5); // Should map 'order' to 'priority'
        expect(status.isFinal).toBe(false);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      req.flush(backendWithIdField);
    });

    it('should handle server errors', () => {
      service.getOrderStatuses().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle authentication errors', () => {
      service.getOrderStatuses().subscribe({
        next: () => fail('Expected an authentication error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getOrderStatusById', () => {
    it('should retrieve a specific order status by ID', () => {
      const statusId = '1';
      const backendStatus = mockBackendResponse.orderStatuses[0];

      service.getOrderStatusById(statusId).subscribe(status => {
        expect(status._id).toBe('1');
        expect(status.name).toBe('Pendiente');
        expect(status.code).toBe('PENDING');
        expect(status.priority).toBe(1);
        expect(status.isDefault).toBe(true);
        expect(status.createdAt).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/${statusId}`);
      expect(req.request.method).toBe('GET');
      req.flush(backendStatus);
    });

    it('should handle order status not found', () => {
      const statusId = 'non-existent';

      service.getOrderStatusById(statusId).subscribe({
        next: () => fail('Expected a 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/${statusId}`);
      req.flush('Order status not found', { status: 404, statusText: 'Not Found' });
    });

    it('should transform backend response correctly', () => {
      const statusId = '2';
      const backendStatus = {
        id: '2', // Backend uses 'id'
        name: 'Backend Status',
        code: 'BACKEND',
        description: 'Status from backend',
        color: '#FF0000',
        order: 3, // Backend uses 'order'
        isActive: false,
        isDefault: false,
        canTransitionTo: ['1'], // Backend uses 'canTransitionTo'
        createdAt: '2023-02-01T00:00:00.000Z'
      };

      service.getOrderStatusById(statusId).subscribe(status => {
        expect(status._id).toBe('2'); // Should be mapped from 'id'
        expect(status.priority).toBe(3); // Should be mapped from 'order'
        expect(status.allowedTransitions).toEqual(['1']); // Should be mapped from 'canTransitionTo'
        expect(status.isFinal).toBe(false); // Should be calculated
        expect(status.createdAt).toEqual(new Date('2023-02-01T00:00:00.000Z'));
        expect(status.updatedAt).toBeUndefined(); // Not provided in backend response
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/${statusId}`);
      req.flush(backendStatus);
    });
  });

  describe('getOrderStatusByCode', () => {
    it('should retrieve order status by code', () => {
      const statusCode = 'PENDING';
      const backendStatus = mockBackendResponse.orderStatuses[0];

      service.getOrderStatusByCode(statusCode).subscribe(status => {
        expect(status.code).toBe('PENDING');
        expect(status.name).toBe('Pendiente');
        expect(status._id).toBe('1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/by-code/${statusCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(backendStatus);
    });

    it('should handle invalid status code', () => {
      const statusCode = 'INVALID_CODE';

      service.getOrderStatusByCode(statusCode).subscribe({
        next: () => fail('Expected a 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/by-code/${statusCode}`);
      req.flush('Status code not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle special characters in status code', () => {
      const statusCode = 'SPECIAL-CODE_123';
      const backendStatus = {
        _id: 'special-id',
        name: 'Special Status',
        code: statusCode,
        description: 'Special status',
        color: '#123456',
        priority: 1,
        isActive: true,
        isDefault: false,
        canTransitionTo: []
      };

      service.getOrderStatusByCode(statusCode).subscribe(status => {
        expect(status.code).toBe(statusCode);
        expect(status.name).toBe('Special Status');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/by-code/${statusCode}`);
      req.flush(backendStatus);
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icon for PENDING status', () => {
      const icon = service.getStatusIcon('PENDING');
      expect(icon).toBe('bi bi-clock text-warning');
    });

    it('should return correct icon for PROCESSING status', () => {
      const icon = service.getStatusIcon('PROCESSING');
      expect(icon).toBe('bi bi-gear text-info');
    });

    it('should return correct icon for PAID status', () => {
      const icon = service.getStatusIcon('PAID');
      expect(icon).toBe('bi bi-check-circle text-success');
    });

    it('should return correct icon for PREPARING status', () => {
      const icon = service.getStatusIcon('PREPARING');
      expect(icon).toBe('bi bi-tools text-primary');
    });

    it('should return correct icon for READY status', () => {
      const icon = service.getStatusIcon('READY');
      expect(icon).toBe('bi bi-box text-primary');
    });

    it('should return correct icon for SHIPPED status', () => {
      const icon = service.getStatusIcon('SHIPPED');
      expect(icon).toBe('bi bi-truck text-info');
    });

    it('should return correct icon for COMPLETED status', () => {
      const icon = service.getStatusIcon('COMPLETED');
      expect(icon).toBe('bi bi-check-circle-fill text-success');
    });

    it('should return correct icon for CANCELLED status', () => {
      const icon = service.getStatusIcon('CANCELLED');
      expect(icon).toBe('bi bi-x-circle text-danger');
    });

    it('should return default icon for unknown status', () => {
      const icon = service.getStatusIcon('UNKNOWN_STATUS');
      expect(icon).toBe('bi bi-question-circle text-muted');
    });

    it('should return default icon for empty string', () => {
      const icon = service.getStatusIcon('');
      expect(icon).toBe('bi bi-question-circle text-muted');
    });

    it('should return default icon for null/undefined status', () => {
      const iconForNull = service.getStatusIcon(null as any);
      const iconForUndefined = service.getStatusIcon(undefined as any);
      
      expect(iconForNull).toBe('bi bi-question-circle text-muted');
      expect(iconForUndefined).toBe('bi bi-question-circle text-muted');
    });

    it('should handle case sensitivity', () => {
      const lowerCaseIcon = service.getStatusIcon('pending');
      const mixedCaseIcon = service.getStatusIcon('Pending');
      
      // Should return default for non-exact matches
      expect(lowerCaseIcon).toBe('bi bi-question-circle text-muted');
      expect(mixedCaseIcon).toBe('bi bi-question-circle text-muted');
    });

    it('should handle all defined status codes', () => {
      const statusCodes = ['PENDING', 'PROCESSING', 'PAID', 'PREPARING', 'READY', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
      
      statusCodes.forEach(code => {
        const icon = service.getStatusIcon(code);
        expect(icon).not.toBe('bi bi-question-circle text-muted');
        expect(icon).toContain('bi bi-');
        expect(icon).toContain('text-');
      });
    });
  });

  describe('Data transformation', () => {
    it('should handle missing optional fields in backend response', () => {
      const minimalBackendStatus = {
        _id: 'minimal-id',
        name: 'Minimal Status',
        code: 'MINIMAL',
        color: '#000000',
        isActive: true,
        isDefault: false
      };

      service.getOrderStatusById('minimal-id').subscribe(status => {
        expect(status._id).toBe('minimal-id');
        expect(status.name).toBe('Minimal Status');
        expect(status.description).toBeUndefined();
        expect(status.priority).toBeUndefined();
        expect(status.allowedTransitions).toEqual([]);
        expect(status.isFinal).toBe(true); // No transitions = final
        expect(status.createdAt).toBeUndefined();
        expect(status.updatedAt).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/minimal-id`);
      req.flush(minimalBackendStatus);
    });

    it('should prioritize _id over id when both are present', () => {
      const backendStatusWithBothIds = {
        _id: 'mongo-id',
        id: 'simple-id',
        name: 'Status with both IDs',
        code: 'BOTH_IDS',
        color: '#000000',
        isActive: true,
        isDefault: false
      };

      service.getOrderStatusById('test').subscribe(status => {
        expect(status._id).toBe('mongo-id'); // Should prefer _id over id
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/test`);
      req.flush(backendStatusWithBothIds);
    });

    it('should handle date string conversion', () => {
      const backendStatusWithDates = {
        _id: 'date-test',
        name: 'Date Test Status',
        code: 'DATE_TEST',
        color: '#000000',
        isActive: true,
        isDefault: false,
        createdAt: '2023-06-15T10:30:45.123Z',
        updatedAt: '2023-06-20T14:22:33.456Z'
      };

      service.getOrderStatusById('date-test').subscribe(status => {
        expect(status.createdAt).toEqual(new Date('2023-06-15T10:30:45.123Z'));
        expect(status.updatedAt).toEqual(new Date('2023-06-20T14:22:33.456Z'));
        expect(status.createdAt instanceof Date).toBe(true);
        expect(status.updatedAt instanceof Date).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/date-test`);
      req.flush(backendStatusWithDates);
    });
  });

  describe('API configuration', () => {
    it('should use the correct API endpoint for getOrderStatuses', () => {
      service.getOrderStatuses().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      expect(req.request.method).toBe('GET');
      req.flush({ total: 0, orderStatuses: [] });
    });

    it('should use the correct API endpoint for getOrderStatusById', () => {
      const statusId = 'test-id';
      service.getOrderStatusById(statusId).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/${statusId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse.orderStatuses[0]);
    });

    it('should use the correct API endpoint for getOrderStatusByCode', () => {
      const statusCode = 'TEST_CODE';
      service.getOrderStatusByCode(statusCode).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/by-code/${statusCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse.orderStatuses[0]);
    });

    it('should not send request body for GET requests', () => {
      service.getOrderStatuses().subscribe();
      service.getOrderStatusById('1').subscribe();
      service.getOrderStatusByCode('PENDING').subscribe();
      
      const getAllReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      const getByIdReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/1`);
      const getByCodeReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/by-code/PENDING`);

      expect(getAllReq.request.body).toBeNull();
      expect(getByIdReq.request.body).toBeNull();
      expect(getByCodeReq.request.body).toBeNull();

      getAllReq.flush({ total: 0, orderStatuses: [] });
      getByIdReq.flush(mockBackendResponse.orderStatuses[0]);
      getByCodeReq.flush(mockBackendResponse.orderStatuses[0]);
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent requests', () => {
      service.getOrderStatuses().subscribe();
      service.getOrderStatusById('1').subscribe();
      service.getOrderStatusByCode('PENDING').subscribe();

      const getAllReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      const getByIdReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/1`);
      const getByCodeReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/by-code/PENDING`);

      getAllReq.flush(mockBackendResponse);
      getByIdReq.flush(mockBackendResponse.orderStatuses[0]);
      getByCodeReq.flush(mockBackendResponse.orderStatuses[0]);

      expect(getAllReq.request.method).toBe('GET');
      expect(getByIdReq.request.method).toBe('GET');
      expect(getByCodeReq.request.method).toBe('GET');
    });    it('should handle empty string parameters', () => {
      service.getOrderStatusById('').subscribe(status => {
        expect(status).toBeDefined();
      });
      service.getOrderStatusByCode('').subscribe(status => {
        expect(status).toBeDefined();
      });

      const getByIdReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/`);
      const getByCodeReq = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses/by-code/`);

      getByIdReq.flush(mockBackendResponse.orderStatuses[0]);
      getByCodeReq.flush(mockBackendResponse.orderStatuses[0]);
    });

    it('should handle network errors', () => {
      service.getOrderStatuses().subscribe({
        next: () => fail('Expected a network error'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/order-statuses`);
      req.error(new ErrorEvent('Network error'));
    });
  });
});
