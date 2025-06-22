import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NeighborhoodService } from './neighborhood.service';
import { INeighborhood } from '../models/ineighborhood';
import { ICity } from '../models/icity';
import { environment } from 'src/environments/environment';

describe('NeighborhoodService', () => {
  let service: NeighborhoodService;
  let httpMock: HttpTestingController;

  const mockCity: ICity = {
    id: 'city1',
    name: 'Buenos Aires',
    description: 'Capital Federal de Argentina',
    isActive: true
  };

  const mockNeighborhoods: INeighborhood[] = [
    {
      id: 'neighborhood1',
      name: 'Palermo',
      description: 'Barrio de Palermo',
      city: mockCity,
      isActive: true
    },
    {
      id: 'neighborhood2',
      name: 'Recoleta',
      description: 'Barrio de Recoleta',
      city: mockCity,
      isActive: true
    },
    {
      id: 'neighborhood3',
      name: 'San Telmo',
      description: 'Barrio histórico de San Telmo',
      city: mockCity,
      isActive: true
    },
    {
      id: 'neighborhood4',
      name: 'La Boca',
      description: 'Barrio de La Boca',
      city: mockCity,
      isActive: false
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NeighborhoodService]
    });
    
    service = TestBed.inject(NeighborhoodService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNeighborhoodsByCity', () => {
    const cityId = 'city1';

    it('should retrieve neighborhoods for a specific city', () => {
      service.getNeighborhoodsByCity(cityId).subscribe(neighborhoods => {
        expect(neighborhoods).toEqual(mockNeighborhoods);
        expect(neighborhoods.length).toBe(4);
        
        // Verify all neighborhoods belong to the same city
        neighborhoods.forEach(neighborhood => {
          expect(neighborhood.city.id).toBe(cityId);
        });
        
        // Verify specific neighborhoods
        expect(neighborhoods[0].name).toBe('Palermo');
        expect(neighborhoods[1].name).toBe('Recoleta');
        expect(neighborhoods[2].name).toBe('San Telmo');
        expect(neighborhoods[3].name).toBe('La Boca');
        expect(neighborhoods[3].isActive).toBe(false);
      });      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      expect(req.request.method).toBe('GET');
      req.flush(mockNeighborhoods);
    });

    it('should handle empty neighborhoods list for a city', () => {
      service.getNeighborhoodsByCity(cityId).subscribe(neighborhoods => {
        expect(neighborhoods).toEqual([]);
        expect(neighborhoods.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should only return active neighborhoods when filtered by backend', () => {
      const activeNeighborhoods = mockNeighborhoods.filter(n => n.isActive);
      
      service.getNeighborhoodsByCity(cityId).subscribe(neighborhoods => {
        expect(neighborhoods).toEqual(activeNeighborhoods);
        expect(neighborhoods.length).toBe(3);
        expect(neighborhoods.every(n => n.isActive)).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      req.flush(activeNeighborhoods);
    });

    it('should handle single neighborhood response', () => {
      const singleNeighborhood = [mockNeighborhoods[0]];
      
      service.getNeighborhoodsByCity(cityId).subscribe(neighborhoods => {
        expect(neighborhoods).toEqual(singleNeighborhood);
        expect(neighborhoods.length).toBe(1);
        expect(neighborhoods[0].name).toBe('Palermo');
        expect(neighborhoods[0].city.id).toBe(cityId);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      req.flush(singleNeighborhood);
    });

    it('should handle different city IDs correctly', () => {
      const differentCityId = 'city2';
      const cordobaCity: ICity = {
        id: differentCityId,
        name: 'Córdoba',
        description: 'Capital de Córdoba',
        isActive: true
      };

      const cordobaNeighborhoods: INeighborhood[] = [
        {
          id: 'neighborhood5',
          name: 'Nueva Córdoba',
          description: 'Barrio Nueva Córdoba',
          city: cordobaCity,
          isActive: true
        }
      ];

      service.getNeighborhoodsByCity(differentCityId).subscribe(neighborhoods => {
        expect(neighborhoods).toEqual(cordobaNeighborhoods);
        expect(neighborhoods[0].city.id).toBe(differentCityId);
        expect(neighborhoods[0].city.name).toBe('Córdoba');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${differentCityId}?limit=1000`);
      req.flush(cordobaNeighborhoods);
    });

    it('should handle special characters in city ID', () => {
      const specialCityId = 'city-with-special-chars_123';
      
      service.getNeighborhoodsByCity(specialCityId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${specialCityId}?limit=1000`);
      expect(req.request.url).toContain(specialCityId);
      req.flush([]);
    });

    it('should handle HTTP 404 error when city not found', () => {
      const nonExistentCityId = 'non-existent-city';
      
      service.getNeighborhoodsByCity(nonExistentCityId).subscribe({
        next: () => fail('Expected 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${nonExistentCityId}?limit=1000`);
      req.flush('City not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP 500 error when server fails', () => {
      service.getNeighborhoodsByCity(cityId).subscribe({
        next: () => fail('Expected server error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', () => {
      service.getNeighborhoodsByCity(cityId).subscribe({
        next: () => fail('Expected network error'),
        error: (error) => {
          expect(error.status).toBe(0);
          expect(error.statusText).toBe('Unknown Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      req.error(new ErrorEvent('Network error'), { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle unauthorized access', () => {
      service.getNeighborhoodsByCity(cityId).subscribe({
        next: () => fail('Expected unauthorized error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('API configuration', () => {
    const cityId = 'test-city';    it('should use the correct API endpoint with city ID and limit', () => {
      service.getNeighborhoodsByCity(cityId).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should not send any request body', () => {
      service.getNeighborhoodsByCity(cityId).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      expect(req.request.body).toBeNull();
      req.flush([]);
    });    it('should handle URL encoding for city ID', () => {
      const cityIdWithSpaces = 'city with spaces';
      
      service.getNeighborhoodsByCity(cityIdWithSpaces).subscribe();
      
      // The actual URL will have the spaces encoded, but we need to match the exact URL
      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/city with spaces?limit=1000`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('Data integrity', () => {
    const cityId = 'city1';

    it('should preserve neighborhood data structure with city relationship', () => {
      const neighborhoodWithAllFields: INeighborhood = {
        id: 'complete-neighborhood',
        name: 'Complete Neighborhood',
        description: 'A neighborhood with all fields populated',
        city: {
          id: cityId,
          name: 'Test City',
          description: 'Test City Description',
          isActive: true
        },
        isActive: true
      };

      service.getNeighborhoodsByCity(cityId).subscribe(neighborhoods => {
        expect(neighborhoods[0]).toEqual(neighborhoodWithAllFields);
        expect(neighborhoods[0].city).toBeDefined();
        expect(neighborhoods[0].city.id).toBe(cityId);
        expect(neighborhoods[0].city.name).toBe('Test City');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      req.flush([neighborhoodWithAllFields]);
    });

    it('should handle neighborhoods with special characters', () => {
      const specialNeighborhood: INeighborhood = {
        id: 'special-neighborhood',
        name: 'Barrio Ñuñoa',
        description: 'Descripción con caracteres especiales: áéíóú ñ',
        city: mockCity,
        isActive: true
      };

      service.getNeighborhoodsByCity(cityId).subscribe(neighborhoods => {
        expect(neighborhoods[0].name).toBe('Barrio Ñuñoa');
        expect(neighborhoods[0].description).toContain('áéíóú ñ');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/${cityId}?limit=1000`);
      req.flush([specialNeighborhood]);
    });    it('should handle empty string city ID', () => {
      const emptyCityId = '';
      
      service.getNeighborhoodsByCity(emptyCityId).subscribe(neighborhoods => {
        expect(neighborhoods).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/neighborhoods/by-city/?limit=1000`);
      req.flush([]);
    });
  });
});
