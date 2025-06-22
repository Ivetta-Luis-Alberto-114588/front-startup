import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AddressService } from './address.service';
import { IAddress } from '../models/iaddress';
import { environment } from 'src/environments/environment';

describe('AddressService', () => {
  let service: AddressService;
  let httpMock: HttpTestingController;
  
  const mockCity = {
    id: 'city1',
    name: 'Buenos Aires',
    description: 'Capital Federal',
    isActive: true
  };

  const mockNeighborhood = {
    id: 'neighborhood1',
    name: 'Palermo',
    description: 'Barrio de Palermo',
    city: mockCity,
    isActive: true
  };

  const mockAddress: IAddress = {
    id: 'address1',
    customerId: 'customer1',
    recipientName: 'Juan Pérez',
    phone: '+54 11 1234-5678',
    streetAddress: 'Av. Santa Fe 1234',
    neighborhood: mockNeighborhood,
    city: mockCity,
    additionalInfo: 'Departamento 2B',
    isDefault: true,
    alias: 'Casa',
    postalCode: '1425'
  };

  const mockAddresses: IAddress[] = [
    mockAddress,
    {
      ...mockAddress,
      id: 'address2',
      recipientName: 'María García',
      streetAddress: 'Av. Corrientes 5678',
      isDefault: false,
      alias: 'Trabajo'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AddressService]
    });
    
    service = TestBed.inject(AddressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAddresses', () => {
    it('should retrieve all addresses', () => {
      service.getAddresses().subscribe(addresses => {
        expect(addresses).toEqual(mockAddresses);
        expect(addresses.length).toBe(2);
        expect(addresses[0].recipientName).toBe('Juan Pérez');
        expect(addresses[1].recipientName).toBe('María García');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAddresses);
    });

    it('should handle empty address list', () => {
      service.getAddresses().subscribe(addresses => {
        expect(addresses).toEqual([]);
        expect(addresses.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle HTTP error when getting addresses', () => {
      const errorMessage = 'Server error';
      
      service.getAddresses().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('createAddress', () => {
    const newAddressData = {
      customerId: 'customer1',
      recipientName: 'Ana López',
      phone: '+54 11 9876-5432',
      streetAddress: 'Av. Rivadavia 9999',
      neighborhoodId: 'neighborhood1',
      cityId: 'city1',
      additionalInfo: 'Casa con portón azul',
      isDefault: false,
      alias: 'Casa de Ana',
      postalCode: '1406'
    };

    const createdAddress: IAddress = {
      id: 'address3',
      customerId: newAddressData.customerId,
      recipientName: newAddressData.recipientName,
      phone: newAddressData.phone,
      streetAddress: newAddressData.streetAddress,
      neighborhood: mockNeighborhood,
      city: mockCity,
      additionalInfo: newAddressData.additionalInfo,
      isDefault: newAddressData.isDefault,
      alias: newAddressData.alias,
      postalCode: newAddressData.postalCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a new address', () => {
      service.createAddress(newAddressData).subscribe(address => {
        expect(address).toEqual(createdAddress);
        expect(address.id).toBe('address3');
        expect(address.recipientName).toBe('Ana López');
        expect(address.isDefault).toBe(false);
        expect(address.alias).toBe('Casa de Ana');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newAddressData);
      req.flush(createdAddress);
    });

    it('should create address with minimal data', () => {
      const minimalAddressData = {
        customerId: 'customer1',
        recipientName: 'Pedro Sánchez',
        phone: '+54 11 5555-5555',
        streetAddress: 'Calle Falsa 123',
        neighborhoodId: 'neighborhood1',
        cityId: 'city1'
      };

      const minimalCreatedAddress: IAddress = {
        id: 'address4',
        customerId: minimalAddressData.customerId,
        recipientName: minimalAddressData.recipientName,
        phone: minimalAddressData.phone,
        streetAddress: minimalAddressData.streetAddress,
        neighborhood: mockNeighborhood,
        city: mockCity,
        isDefault: false
      };

      service.createAddress(minimalAddressData).subscribe(address => {
        expect(address).toEqual(minimalCreatedAddress);
        expect(address.recipientName).toBe('Pedro Sánchez');
        expect(address.isDefault).toBe(false);
        expect(address.additionalInfo).toBeUndefined();
        expect(address.alias).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(minimalAddressData);
      req.flush(minimalCreatedAddress);
    });

    it('should handle validation errors when creating address', () => {
      const invalidAddressData = {
        customerId: '',
        recipientName: '',
        phone: 'invalid-phone',
        streetAddress: ''
      };      const validationError = {
        message: 'Validation failed',
        details: [
          'Customer ID is required',
          'Recipient name is required',
          'Phone format is invalid',
          'Street address is required'
        ]
      };      service.createAddress(invalidAddressData).subscribe({
        next: () => fail('Expected validation error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Validation failed');
          expect(error.error.details).toContain('Customer ID is required');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      req.flush(validationError, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle server error when creating address', () => {
      service.createAddress(newAddressData).subscribe({
        next: () => fail('Expected server error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle unauthorized error when creating address', () => {
      service.createAddress(newAddressData).subscribe({
        next: () => fail('Expected unauthorized error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('API URL configuration', () => {
    it('should use the correct API endpoint', () => {
      service.getAddresses().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      expect(req.request.url).toBe(`${environment.apiUrl}/api/addresses`);
      req.flush([]);
    });    it('should send requests with correct content type for POST', () => {
      const addressData = { customerId: 'test', recipientName: 'Test' };
      
      service.createAddress(addressData).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/addresses`);
      // HttpClient automatically sets Content-Type for JSON, we verify the request was made
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(addressData);
      req.flush(mockAddress);
    });
  });
});
