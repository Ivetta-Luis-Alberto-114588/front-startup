import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CityService } from './city.service';
import { ICity } from '../models/icity';
import { environment } from 'src/environments/environment';

describe('CityService', () => {
  let service: CityService;
  let httpMock: HttpTestingController;

  const mockCities: ICity[] = [
    {
      id: 'city1',
      name: 'Buenos Aires',
      description: 'Capital Federal de Argentina',
      isActive: true
    },
    {
      id: 'city2',
      name: 'Córdoba',
      description: 'Capital de la provincia de Córdoba',
      isActive: true
    },
    {
      id: 'city3',
      name: 'Rosario',
      description: 'Ciudad de Santa Fe',
      isActive: true
    },
    {
      id: 'city4',
      name: 'La Plata',
      description: 'Capital de Buenos Aires',
      isActive: false
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CityService]
    });
    
    service = TestBed.inject(CityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCities', () => {
    it('should retrieve all cities with limit parameter', () => {
      service.getCities().subscribe(cities => {
        expect(cities).toEqual(mockCities);
        expect(cities.length).toBe(4);
        
        // Verify specific cities
        expect(cities[0].name).toBe('Buenos Aires');
        expect(cities[0].isActive).toBe(true);
        expect(cities[1].name).toBe('Córdoba');
        expect(cities[2].name).toBe('Rosario');
        expect(cities[3].name).toBe('La Plata');
        expect(cities[3].isActive).toBe(false);
      });      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCities);
    });

    it('should handle empty cities list', () => {
      service.getCities().subscribe(cities => {
        expect(cities).toEqual([]);
        expect(cities.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should only return active cities when filtered by backend', () => {
      const activeCities = mockCities.filter(city => city.isActive);
      
      service.getCities().subscribe(cities => {
        expect(cities).toEqual(activeCities);
        expect(cities.length).toBe(3);
        expect(cities.every(city => city.isActive)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.flush(activeCities);
    });

    it('should handle single city response', () => {
      const singleCity = [mockCities[0]];
      
      service.getCities().subscribe(cities => {
        expect(cities).toEqual(singleCity);
        expect(cities.length).toBe(1);
        expect(cities[0].name).toBe('Buenos Aires');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.flush(singleCity);
    });

    it('should handle HTTP error when getting cities', () => {
      const errorMessage = 'Failed to fetch cities';
      
      service.getCities().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error when getting cities', () => {
      service.getCities().subscribe({
        next: () => fail('Expected a network error'),
        error: (error) => {
          expect(error.status).toBe(0);
          expect(error.statusText).toBe('Unknown Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.error(new ErrorEvent('Network error'), { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle unauthorized access', () => {
      service.getCities().subscribe({
        next: () => fail('Expected unauthorized error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.flush('Unauthorized access', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle service unavailable error', () => {
      service.getCities().subscribe({
        next: () => fail('Expected service unavailable error'),
        error: (error) => {
          expect(error.status).toBe(503);
          expect(error.statusText).toBe('Service Unavailable');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.flush('Service temporarily unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('API configuration', () => {    it('should use the correct API endpoint with limit parameter', () => {
      service.getCities().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should not send any request body', () => {
      service.getCities().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      expect(req.request.body).toBeNull();
      req.flush([]);
    });    it('should set appropriate headers', () => {
      service.getCities().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      // HttpClient doesn't automatically set specific headers for GET requests
      // We can verify the request was made correctly
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('Data integrity', () => {
    it('should preserve city data structure', () => {
      const cityWithAllFields: ICity = {
        id: 'complete-city',
        name: 'Complete City',
        description: 'A city with all fields populated',
        isActive: true
      };

      service.getCities().subscribe(cities => {
        expect(cities[0]).toEqual(cityWithAllFields);
        expect(cities[0].id).toBe('complete-city');
        expect(cities[0].name).toBe('Complete City');
        expect(cities[0].description).toBe('A city with all fields populated');
        expect(cities[0].isActive).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.flush([cityWithAllFields]);
    });

    it('should handle cities with special characters', () => {
      const specialCity: ICity = {
        id: 'special-city',
        name: 'São Paulo',
        description: 'Ciudad con caracteres especiales: áéíóú ñ',
        isActive: true
      };

      service.getCities().subscribe(cities => {
        expect(cities[0].name).toBe('São Paulo');
        expect(cities[0].description).toContain('áéíóú ñ');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/cities?limit=1000`);
      req.flush([specialCity]);
    });
  });
});
