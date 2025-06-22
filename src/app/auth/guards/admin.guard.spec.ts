import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { of, BehaviorSubject, Observable } from 'rxjs';

import { AdminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { IUser } from 'src/app/shared/models/iuser';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let userSubject: BehaviorSubject<IUser | null>;

  // Mocks de rutas
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;
  let mockUrlTree: UrlTree;

  // Mock de usuario administrador
  const mockAdminUser: IUser = {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    roles: ['ADMIN_ROLE', 'USER_ROLE'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock de usuario regular
  const mockRegularUser: IUser = {
    id: '2',
    name: 'Regular User',
    email: 'user@example.com',
    roles: ['USER_ROLE'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock de usuario sin roles
  const mockUserWithoutRoles: IUser = {
    id: '3',
    name: 'User Without Roles',
    email: 'noroles@example.com',
    roles: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    userSubject = new BehaviorSubject<IUser | null>(null);

    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      user$: userSubject.asObservable()
    });

    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    guard = TestBed.inject(AdminGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Setup mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;

    // Setup router mock
    mockUrlTree = { toString: () => '/dashboard' } as UrlTree;
    router.createUrlTree.and.returnValue(mockUrlTree);
  });

  afterEach(() => {
    userSubject.complete();
  });

  describe('Guard Creation', () => {
    it('should be created', () => {
      expect(guard).toBeTruthy();
    });
  });

  describe('Admin Role Verification', () => {
    it('should allow access for user with ADMIN_ROLE', (done) => {
      userSubject.next(mockAdminUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(true);
        expect(notificationService.showError).not.toHaveBeenCalled();
        expect(router.createUrlTree).not.toHaveBeenCalled();
        done();
      });
    });

    it('should allow access for user with multiple roles including ADMIN_ROLE', (done) => {
      const multiRoleAdminUser: IUser = {
        ...mockAdminUser,
        roles: ['USER_ROLE', 'ADMIN_ROLE', 'SUPER_ADMIN']
      };
      userSubject.next(multiRoleAdminUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(true);
        done();
      });
    });

    it('should deny access for user without ADMIN_ROLE', (done) => {
      userSubject.next(mockRegularUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalledWith(
          'No tienes permisos para acceder a esta sección.',
          'Acceso Denegado'
        );
        expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should deny access for user with empty roles array', (done) => {
      userSubject.next(mockUserWithoutRoles);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalledWith(
          'No tienes permisos para acceder a esta sección.',
          'Acceso Denegado'
        );
        done();
      });
    });

    it('should deny access for user with undefined roles', (done) => {
      const userWithUndefinedRoles: IUser = {
        ...mockRegularUser,
        roles: undefined as any
      };
      userSubject.next(userWithUndefinedRoles);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalledWith(
          'No tienes permisos para acceder a esta sección.',
          'Acceso Denegado'
        );
        done();
      });
    });
  });

  describe('Unauthenticated Users', () => {
    it('should deny access for null user (not authenticated)', (done) => {
      userSubject.next(null);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalledWith(
          'No tienes permisos para acceder a esta sección.',
          'Acceso Denegado'
        );
        expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should deny access for undefined user', (done) => {
      userSubject.next(undefined as any);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalledWith(
          'No tienes permisos para acceder a esta sección.',
          'Acceso Denegado'
        );
        done();
      });
    });
  });

  describe('Redirection Behavior', () => {
    it('should redirect to /dashboard when access is denied', (done) => {
      userSubject.next(mockRegularUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should return UrlTree object for redirection', (done) => {
      const customUrlTree = { toString: () => '/custom-redirect' } as UrlTree;
      router.createUrlTree.and.returnValue(customUrlTree);
      userSubject.next(mockRegularUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(customUrlTree);
        done();
      });
    });
  });

  describe('Notification Messages', () => {
    it('should show specific error message when access is denied', (done) => {
      userSubject.next(mockRegularUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledWith(
          'No tienes permisos para acceder a esta sección.',
          'Acceso Denegado'
        );
        done();
      });
    });

    it('should call notificationService exactly once per denied access attempt', (done) => {
      userSubject.next(mockRegularUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should not show notification when access is granted', (done) => {
      userSubject.next(mockAdminUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(true);
        expect(notificationService.showError).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Observable Behavior', () => {
    it('should take only the first value from user$ observable', (done) => {
      // Emit admin user first
      userSubject.next(mockAdminUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(true);
        
        // Change user to regular user after first emission
        userSubject.next(mockRegularUser);
        
        // The guard should not react to this change since it uses take(1)
        setTimeout(() => {
          expect(notificationService.showError).not.toHaveBeenCalled();
          done();
        }, 10);
      });
    });
  });

  describe('Edge Cases', () => {    it('should handle user with additional properties but valid admin role', (done) => {
      const userWithExtraProps: IUser = {
        ...mockAdminUser,
        // Additional properties that might exist but aren't in the interface
      };
      userSubject.next(userWithExtraProps);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        // Guard only checks for ADMIN_ROLE
        expect(allowed).toBe(true);
        done();
      });
    });

    it('should handle case-sensitive role comparison', (done) => {
      const userWithWrongCaseRole: IUser = {
        ...mockAdminUser,
        roles: ['admin_role', 'USER_ROLE'] // lowercase admin_role
      };
      userSubject.next(userWithWrongCaseRole);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalled();
        done();
      });
    });    it('should handle different route URLs', (done) => {
      const customState = { url: '/admin/users' } as RouterStateSnapshot;

      userSubject.next(mockAdminUser);

      const result = guard.canActivate(mockRoute, customState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(true);
        done();
      });
    });
  });

  describe('Guard Performance', () => {
    it('should complete observable after first emission', (done) => {
      userSubject.next(mockAdminUser);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;
      let emissionCount = 0;

      result.subscribe({
        next: (allowed) => {
          emissionCount++;
          expect(allowed).toBe(true);
        },
        complete: () => {
          expect(emissionCount).toBe(1);
          done();
        }
      });
    });

    it('should handle rapid user changes correctly', (done) => {
      // Simulate rapid user changes
      userSubject.next(mockRegularUser);
      userSubject.next(mockAdminUser);
      userSubject.next(null);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        // Should only get the first emission (mockRegularUser)
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle user object without roles property', (done) => {
      const userWithoutRolesProperty = {
        id: '4',
        name: 'User Without Roles Property',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
        // Note: no roles property at all
      } as any;
      
      userSubject.next(userWithoutRolesProperty);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalled();
        done();
      });
    });

    it('should handle null roles array', (done) => {
      const userWithNullRoles: IUser = {
        ...mockRegularUser,
        roles: null as any
      };
      userSubject.next(userWithNullRoles);

      const result = guard.canActivate(mockRoute, mockState) as Observable<boolean | UrlTree>;

      result.subscribe(allowed => {
        expect(allowed).toBe(mockUrlTree);
        expect(notificationService.showError).toHaveBeenCalled();
        done();
      });
    });
  });
});
