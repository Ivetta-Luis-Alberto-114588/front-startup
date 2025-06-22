import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, User, RegisterPayload } from './auth.service';
import { environment } from 'src/environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['USER_ROLE'], // Campo 'roles' como en MongoDB
    createdAt: '2025-05-30T21:12:12.591Z',
    updatedAt: '2025-05-30T21:12:12.591Z',
    __v: 0
  };

  const mockAdminUser: User = {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    roles: ['ADMIN_ROLE'], // Campo 'roles' como en MongoDB
    createdAt: '2025-05-30T21:12:12.591Z',
    updatedAt: '2025-05-30T21:12:12.591Z',
    __v: 0
  };

  const mockUserWithToken = {
    ...mockUser,
    token: 'mock-token'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should register a new user successfully', () => {
      const registerData: RegisterPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: mockUser // Usuario por defecto con USER_ROLE
      };

      service.register(registerData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(mockResponse);
    });

    it('should handle registration error', () => {
      const registerData: RegisterPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const mockError = { 
        error: { 
          message: 'Email already exists' 
        }, 
        status: 400 
      };

      service.register(registerData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/register`);
      req.flush(mockError.error, { status: mockError.status, statusText: 'Bad Request' });
    });

    it('should register user with USER_ROLE by default', () => {
      const registerData: RegisterPayload = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          ...mockUser,
          name: 'New User',
          email: 'newuser@example.com',
          password: '$2a$10$ZyrA8gIco69jWII7st2SrOUH3RkplK682plHvJ6K0kLrgMI.2tGo6' // Hash de contraseña como en MongoDB
        }
      };

      service.register(registerData).subscribe(response => {
        expect(response.user.roles).toEqual(['USER_ROLE']);
        expect(response.user.roles).not.toContain('ADMIN_ROLE');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/register`);
      req.flush(mockResponse);
    });
  });

  describe('login', () => {
    it('should login user successfully', () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        message: 'Login exitoso',
        user: mockUserWithToken
      };

      service.login(credentials.email, credentials.password).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.getUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      const credentials = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const mockError = { 
        error: { 
          message: 'Credenciales inválidas' 
        }, 
        status: 401 
      };

      service.login(credentials.email, credentials.password).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(mockError.error, { status: mockError.status, statusText: 'Unauthorized' });
    });

    it('should login regular user with USER_ROLE', () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        message: 'Login exitoso',
        user: mockUserWithToken
      };

      service.login(credentials.email, credentials.password).subscribe(response => {
        expect(response.user.roles).toEqual(['USER_ROLE']);
        expect(service.getUser()?.roles).toEqual(['USER_ROLE']);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(mockResponse);
    });

    it('should login admin user with ADMIN_ROLE', () => {
      const credentials = {
        email: 'admin@example.com',
        password: 'adminpassword'
      };

      const mockAdminWithToken = {
        ...mockAdminUser,
        token: 'admin-token'
      };

      const mockResponse = {
        success: true,
        message: 'Login exitoso',
        user: mockAdminWithToken
      };

      service.login(credentials.email, credentials.password).subscribe(response => {
        expect(response.user.roles).toEqual(['ADMIN_ROLE']);
        expect(service.getUser()?.roles).toEqual(['ADMIN_ROLE']);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(mockResponse);
    });
  });

  describe('authentication state', () => {
    it('should return false for isAuthenticated when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true for isAuthenticated when token exists', () => {
      localStorage.setItem('token', 'mock-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return user from observable', () => {
      service.user$.subscribe(user => {
        expect(user).toBeNull(); // Initially null
      });
    });

    it('should logout user and clear data', () => {
      // Set initial user and token
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      service.logout();
      
      expect(service.getUser()).toBeNull();
      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('token management', () => {
    it('should get token from localStorage', () => {
      localStorage.setItem('token', 'stored-token');
      expect(service.getToken()).toBe('stored-token');
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should clear token on logout', () => {
      localStorage.setItem('token', 'mock-token');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('user management', () => {
    it('should get user from localStorage', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.getUser()).toEqual(mockUser);
    });

    it('should return null when no user exists', () => {
      expect(service.getUser()).toBeNull();
    });

    it('should handle invalid user data in localStorage', () => {
      localStorage.setItem('user', 'invalid-json');
      expect(service.getUser()).toBeNull();
      expect(localStorage.getItem('user')).toBeNull(); // Should be cleared
    });
  });

  describe('password reset', () => {
    it('should request password reset successfully', () => {
      const email = 'john@example.com';
      const mockResponse = {
        success: true,
        message: 'Password reset email sent'
      };

      service.requestPasswordReset(email).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email });
      req.flush(mockResponse);
    });

    it('should reset password successfully', () => {
      const resetData = {
        token: 'reset-token',
        newPassword: 'newpassword123',
        passwordConfirmation: 'newpassword123'
      };

      const mockResponse = {
        success: true,
        message: 'Password reset successfully'
      };

      service.resetPassword(resetData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(resetData);
      req.flush(mockResponse);
    });
  });

  describe('user roles', () => {
    it('should differentiate between USER_ROLE and ADMIN_ROLE', () => {
      // Test USER_ROLE
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.getUser()?.roles).toEqual(['USER_ROLE']);
      expect(service.getUser()?.roles).not.toContain('ADMIN_ROLE');

      // Clear both localStorage and service cache manually
      localStorage.clear();
      (service as any).user = null; // Reset internal cache
      
      // Test ADMIN_ROLE
      localStorage.setItem('user', JSON.stringify(mockAdminUser));
      expect(service.getUser()?.roles).toEqual(['ADMIN_ROLE']);
      expect(service.getUser()?.roles).not.toContain('USER_ROLE');
    });

    it('should handle users with multiple roles', () => {
      const userWithMultipleRoles = {
        ...mockUser,
        roles: ['USER_ROLE', 'ADMIN_ROLE']
      };

      localStorage.setItem('user', JSON.stringify(userWithMultipleRoles));
      const user = service.getUser();
      
      expect(user?.roles).toContain('USER_ROLE');
      expect(user?.roles).toContain('ADMIN_ROLE');
      expect(user?.roles?.length).toBe(2);
    });

    it('should handle user without roles', () => {
      const userWithoutRoles = {
        ...mockUser,
        roles: undefined
      };

      localStorage.setItem('user', JSON.stringify(userWithoutRoles));
      const user = service.getUser();
      
      expect(user?.roles).toBeUndefined();
    });
  });
});
