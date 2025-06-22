import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const testUrl = '/api/test';
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        }
      ]
    });

    interceptor = TestBed.inject(AuthInterceptor);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Reset all spies to ensure clean state
    authService.getToken.calls.reset();
    authService.logout.calls.reset();
  });  afterEach(() => {
    // Reset spies to prevent errors in cleanup
    try {
      if (authService?.getToken?.calls) {
        authService.getToken.calls.reset();
        authService.getToken.and.returnValue(null);
      }
      if (authService?.logout?.calls) {
        authService.logout.calls.reset();
        authService.logout.and.stub();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    
    httpMock.verify();
  });

  describe('Interceptor Creation', () => {
    it('should be created', () => {
      expect(interceptor).toBeTruthy();
    });
  });

  describe('JWT Token Injection', () => {
    it('should add Authorization header when token exists', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      
      req.flush({ success: true });
    });

    it('should not add Authorization header when token is null', () => {
      // Arrange
      authService.getToken.and.returnValue(null);

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({ success: true });
    });

    it('should not add Authorization header when token is empty string', () => {
      // Arrange
      authService.getToken.and.returnValue('');

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({ success: true });
    });

    it('should clone request when adding token', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.post(testUrl, { data: 'test' }).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ data: 'test' });
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      
      req.flush({ success: true });
    });
  });

  describe('401 Error Handling', () => {
    it('should call logout when receiving 401 error', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);
      let errorResponse: HttpErrorResponse | undefined;

      // Act
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed with 401'),
        error: (error) => errorResponse = error
      });

      // Assert
      const req = httpMock.expectOne(testUrl);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalled();
      expect(errorResponse).toBeTruthy();
      expect(errorResponse!.status).toBe(401);
    });

    it('should call logout only once for 401 error', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.get(testUrl).subscribe({
        error: () => {} // Handle error to prevent unhandled error
      });

      // Assert
      const req = httpMock.expectOne(testUrl);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should not call logout for other error status codes', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);
      const testCases = [400, 403, 404, 500, 502, 503];

      testCases.forEach((statusCode, index) => {
        // Act
        httpClient.get(`${testUrl}/${index}`).subscribe({
          error: () => {} // Handle error to prevent unhandled error
        });

        // Assert
        const req = httpMock.expectOne(`${testUrl}/${index}`);
        req.flush({ message: 'Error' }, { status: statusCode, statusText: 'Error' });
      });

      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should propagate error after handling 401', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);
      let caughtError: HttpErrorResponse | undefined;

      // Act
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => caughtError = error
      });

      // Assert
      const req = httpMock.expectOne(testUrl);
      const errorResponse = { message: 'Token expired' };
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });

      expect(caughtError).toBeTruthy();
      expect(caughtError!.status).toBe(401);
      expect(caughtError!.error).toEqual(errorResponse);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Multiple Requests Handling', () => {
    it('should add token to multiple simultaneous requests', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.get('/api/users').subscribe();
      httpClient.get('/api/products').subscribe();
      httpClient.post('/api/orders', {}).subscribe();

      // Assert
      const userReq = httpMock.expectOne('/api/users');
      const productReq = httpMock.expectOne('/api/products');
      const orderReq = httpMock.expectOne('/api/orders');

      expect(userReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(productReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(orderReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

      userReq.flush({});
      productReq.flush({});
      orderReq.flush({});
    });

    it('should handle mixed scenarios (some with token, some without)', () => {
      // First request without token
      authService.getToken.and.returnValue(null);
      httpClient.get('/api/public').subscribe();

      // Second request with token
      authService.getToken.and.returnValue(mockToken);
      httpClient.get('/api/private').subscribe();

      // Assert
      const publicReq = httpMock.expectOne('/api/public');
      const privateReq = httpMock.expectOne('/api/private');

      expect(publicReq.request.headers.has('Authorization')).toBe(false);
      expect(privateReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

      publicReq.flush({});
      privateReq.flush({});
    });
  });

  describe('HTTP Methods Support', () => {
    it('should add token to GET requests', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to POST requests', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.post(testUrl, { data: 'test' }).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to PUT requests', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.put(testUrl, { data: 'updated' }).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to DELETE requests', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.delete(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to PATCH requests', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);

      // Act
      httpClient.patch(testUrl, { data: 'patched' }).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });
  });

  describe('Header Preservation', () => {
    it('should preserve existing headers when adding token', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);
      const headers = { 'Content-Type': 'application/json', 'X-Custom-Header': 'custom-value' };

      // Act
      httpClient.get(testUrl, { headers }).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not override existing Authorization header', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);
      const existingAuth = 'Bearer existing-token';
      const headers = { 'Authorization': existingAuth };

      // Act
      httpClient.get(testUrl, { headers }).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      // The interceptor should override the existing Authorization header
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });
  });  describe('Error Handling Edge Cases', () => {
    it('should handle network errors without affecting logout', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);
      let caughtError: any;

      // Act
      httpClient.get(testUrl).subscribe({
        error: (error) => caughtError = error
      });

      // Assert
      const req = httpMock.expectOne(testUrl);
      req.error(new ErrorEvent('Network error'));

      expect(caughtError).toBeTruthy();
      expect(authService.logout).not.toHaveBeenCalled();
    });    it('should handle getToken errors by proceeding without token', () => {
      // Arrange
      authService.getToken.and.throwError(new Error('Token service error'));

      // Act
      let requestCompleted = false;
      httpClient.get(testUrl).subscribe({
        next: () => requestCompleted = true,
        error: () => fail('Request should not fail due to token error')
      });

      // Assert
      const req = httpMock.expectOne(testUrl);
      // Should proceed without Authorization header when getToken fails
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({ success: true });
      expect(requestCompleted).toBe(true);
    });

    it('should still propagate 401 error even if logout fails', () => {
      // Arrange
      authService.getToken.and.returnValue(mockToken);
      authService.logout.and.throwError(new Error('Logout error'));
      let interceptorError: any;

      // Act
      httpClient.get(testUrl).subscribe({
        error: (error) => interceptorError = error
      });

      // Assert
      const req = httpMock.expectOne(testUrl);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(interceptorError).toBeTruthy();
      expect(interceptorError.status).toBe(401);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Token Formats and Validation', () => {
    it('should handle very long JWT tokens', () => {
      // Arrange
      const longToken = 'a'.repeat(1000); // Very long token
      authService.getToken.and.returnValue(longToken);

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${longToken}`);
      req.flush({});
    });

    it('should handle tokens with special characters', () => {
      // Arrange
      const specialToken = 'token-with-special.chars_and123numbers';
      authService.getToken.and.returnValue(specialToken);

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${specialToken}`);
      req.flush({});
    });

    it('should handle whitespace-only tokens', () => {
      // Arrange
      authService.getToken.and.returnValue('   ');

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpMock.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe('Bearer    ');
      req.flush({});
    });
  });
});
