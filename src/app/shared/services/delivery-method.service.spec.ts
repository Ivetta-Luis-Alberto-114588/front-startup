import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeliveryMethodService } from './delivery-method.service';
import { IDeliveryMethod, IDeliveryMethodsResponse } from '../models/idelivery-method';
import { environment } from 'src/environments/environment';

describe('DeliveryMethodService', () => {
  let service: DeliveryMethodService;
  let httpMock: HttpTestingController;
  
  const mockDeliveryMethods: IDeliveryMethod[] = [
    {
      id: '1',
      code: 'SHIPPING',
      name: 'Envío a Domicilio',
      description: 'Recibe tu pedido en la puerta de tu casa.',
      requiresAddress: true,
      isActive: true
    },
    {
      id: '2',
      code: 'PICKUP',
      name: 'Retiro en Local',
      description: 'Acércate a nuestra tienda a retirar tu pedido.',
      requiresAddress: false,
      isActive: true
    }
  ];

  const mockResponse: IDeliveryMethodsResponse = {
    deliveryMethods: mockDeliveryMethods
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DeliveryMethodService]
    });
    service = TestBed.inject(DeliveryMethodService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch active delivery methods', () => {
    service.getActiveDeliveryMethods().subscribe(methods => {
      expect(methods).toEqual(mockDeliveryMethods);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should use cache for subsequent calls', () => {
    // Primera llamada
    service.getActiveDeliveryMethods().subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    req1.flush(mockResponse);

    // Segunda llamada (debería usar cache)
    service.getActiveDeliveryMethods().subscribe(methods => {
      expect(methods).toEqual(mockDeliveryMethods);
    });

    // No debería haber una segunda petición HTTP
    httpMock.expectNone(`${environment.apiUrl}/api/delivery-methods`);
  });

  it('should find delivery method by ID', () => {
    service.getDeliveryMethodById('1').subscribe(method => {
      expect(method).toEqual(mockDeliveryMethods[0]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    req.flush(mockResponse);
  });

  it('should find delivery method by code', () => {
    service.getDeliveryMethodByCode('PICKUP').subscribe(method => {
      expect(method).toEqual(mockDeliveryMethods[1]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    req.flush(mockResponse);
  });

  it('should check if method requires address', () => {
    service.requiresAddress('1').subscribe(requires => {
      expect(requires).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    req.flush(mockResponse);
  });

  it('should handle HTTP errors', () => {
    service.getActiveDeliveryMethods().subscribe({
      next: () => fail('Expected error'),
      error: (error) => expect(error).toBeTruthy()
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    req.error(new ErrorEvent('Network error'));
  });

  it('should clear cache', () => {
    // Primera llamada con cache
    service.getActiveDeliveryMethods().subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    req1.flush(mockResponse);

    // Limpiar cache
    service.clearCache();

    // Nueva llamada debería hacer petición HTTP
    service.getActiveDeliveryMethods().subscribe();
    const req2 = httpMock.expectOne(`${environment.apiUrl}/api/delivery-methods`);
    req2.flush(mockResponse);
  });
});
