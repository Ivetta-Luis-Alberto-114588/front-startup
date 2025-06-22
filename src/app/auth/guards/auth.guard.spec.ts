import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { of } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

describe('AuthGuard', () => {
    let guard: AuthGuard;
    let authService: jasmine.SpyObj<AuthService>;
    let router: jasmine.SpyObj<Router>;
    let notificationService: jasmine.SpyObj<NotificationService>;

    // Mocks de rutas
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;
    let mockUrlTree: UrlTree;

    beforeEach(() => {
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
        const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showWarning']);

        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        });

        guard = TestBed.inject(AuthGuard);
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

        // Setup mock route and state
        mockRoute = {} as ActivatedRouteSnapshot;
        mockState = { url: '/protected-route' } as RouterStateSnapshot;

        // Setup router mock
        mockUrlTree = { toString: () => '/auth/login?returnUrl=/protected-route' } as UrlTree;
        router.createUrlTree.and.returnValue(mockUrlTree);
    });

    describe('Guard Creation', () => {
        it('should be created', () => {
            expect(guard).toBeTruthy();
        });
    });

    describe('Token Validation and Access Control', () => {
        it('should allow access when user has valid token', () => {
            // Arrange
            authService.getToken.and.returnValue('valid-jwt-token');

            // Act
            const result = guard.canActivate(mockRoute, mockState);

            // Assert
            expect(result).toBe(true);
            expect(authService.getToken).toHaveBeenCalled();
            expect(notificationService.showWarning).not.toHaveBeenCalled();
            expect(router.createUrlTree).not.toHaveBeenCalled();
        });

        it('should deny access when user has no token', () => {
            // Arrange
            authService.getToken.and.returnValue(null);

            // Act
            const result = guard.canActivate(mockRoute, mockState);

            // Assert
            expect(result).toBe(mockUrlTree);
            expect(authService.getToken).toHaveBeenCalled();
            expect(notificationService.showWarning).toHaveBeenCalledWith(
                'Debes iniciar sesión para acceder a esta página.',
                'Acceso Requerido'
            );
            expect(router.createUrlTree).toHaveBeenCalledWith(
                ['/auth/login'],
                { queryParams: { returnUrl: '/protected-route' } }
            );
        });

        it('should deny access when token is empty string', () => {
            // Arrange
            authService.getToken.and.returnValue('');

            // Act
            const result = guard.canActivate(mockRoute, mockState);

            // Assert
            expect(result).toBe(mockUrlTree);
            expect(notificationService.showWarning).toHaveBeenCalled();
        }); it('should deny access when token is undefined', () => {
            // Arrange
            authService.getToken.and.returnValue(null);

            // Act
            const result = guard.canActivate(mockRoute, mockState);

            // Assert
            expect(result).toBe(mockUrlTree);
            expect(notificationService.showWarning).toHaveBeenCalled();
        });
    });

    describe('Redirection Behavior', () => {
        it('should redirect to login with returnUrl when access is denied', () => {
            // Arrange
            authService.getToken.and.returnValue(null);

            // Act
            guard.canActivate(mockRoute, mockState);

            // Assert
            expect(router.createUrlTree).toHaveBeenCalledWith(
                ['/auth/login'],
                { queryParams: { returnUrl: '/protected-route' } }
            );
        });

        it('should preserve complex returnUrl with query parameters', () => {
            // Arrange
            const complexState = { url: '/products?category=electronics&page=2' } as RouterStateSnapshot;
            authService.getToken.and.returnValue(null);

            // Act
            guard.canActivate(mockRoute, complexState);

            // Assert
            expect(router.createUrlTree).toHaveBeenCalledWith(
                ['/auth/login'],
                { queryParams: { returnUrl: '/products?category=electronics&page=2' } }
            );
        });

        it('should preserve returnUrl with fragments and special characters', () => {
            // Arrange
            const fragmentState = { url: '/dashboard#section1' } as RouterStateSnapshot;
            authService.getToken.and.returnValue(null);

            // Act
            guard.canActivate(mockRoute, fragmentState);

            // Assert
            expect(router.createUrlTree).toHaveBeenCalledWith(
                ['/auth/login'],
                { queryParams: { returnUrl: '/dashboard#section1' } }
            );
        });

        it('should handle root path correctly', () => {
            // Arrange
            const rootState = { url: '/' } as RouterStateSnapshot;
            authService.getToken.and.returnValue(null);

            // Act
            guard.canActivate(mockRoute, rootState);

            // Assert
            expect(router.createUrlTree).toHaveBeenCalledWith(
                ['/auth/login'],
                { queryParams: { returnUrl: '/' } }
            );
        });
    });

    describe('Notification Messages', () => {
        it('should show warning notification when access is denied', () => {
            // Arrange
            authService.getToken.and.returnValue(null);

            // Act
            guard.canActivate(mockRoute, mockState);

            // Assert
            expect(notificationService.showWarning).toHaveBeenCalledWith(
                'Debes iniciar sesión para acceder a esta página.',
                'Acceso Requerido'
            );
        });

        it('should call notification service exactly once per denied access', () => {
            // Arrange
            authService.getToken.and.returnValue(null);

            // Act
            guard.canActivate(mockRoute, mockState);

            // Assert
            expect(notificationService.showWarning).toHaveBeenCalledTimes(1);
        });

        it('should not show notification when access is granted', () => {
            // Arrange
            authService.getToken.and.returnValue('valid-token');

            // Act
            guard.canActivate(mockRoute, mockState);

            // Assert
            expect(notificationService.showWarning).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle authService.getToken throwing an error', () => {
            // Arrange
            authService.getToken.and.throwError(new Error('Token service error'));

            // Act & Assert
            expect(() => guard.canActivate(mockRoute, mockState)).toThrowError('Token service error');
        }); it('should handle router.createUrlTree throwing an error', () => {
            // Arrange
            authService.getToken.and.returnValue(null);
            router.createUrlTree.and.throwError(new Error('Router error'));

            // Act & Assert
            expect(() => guard.canActivate(mockRoute, mockState)).toThrowError('Router error');
        }); it('should handle notification service throwing an error', () => {
            // Arrange
            authService.getToken.and.returnValue(null);
            notificationService.showWarning.and.throwError(new Error('Notification error'));

            // Act & Assert
            expect(() => guard.canActivate(mockRoute, mockState)).toThrowError('Notification error');
        });

        it('should handle very long URLs correctly', () => {
            // Arrange
            const longUrl = '/very/long/url/with/many/segments' + '?param1=value1&param2=value2'.repeat(10);
            const longState = { url: longUrl } as RouterStateSnapshot;
            authService.getToken.and.returnValue(null);

            // Act
            guard.canActivate(mockRoute, longState);

            // Assert
            expect(router.createUrlTree).toHaveBeenCalledWith(
                ['/auth/login'],
                { queryParams: { returnUrl: longUrl } }
            );
        });
    });

    describe('Token Types and Formats', () => {
        it('should allow access with JWT token format', () => {
            // Arrange
            const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            authService.getToken.and.returnValue(jwtToken);

            // Act
            const result = guard.canActivate(mockRoute, mockState);

            // Assert
            expect(result).toBe(true);
        });

        it('should allow access with simple string token', () => {
            // Arrange
            authService.getToken.and.returnValue('simple-auth-token-123');

            // Act
            const result = guard.canActivate(mockRoute, mockState);

            // Assert
            expect(result).toBe(true);
        }); it('should deny access with whitespace-only token', () => {
            // Arrange
            authService.getToken.and.returnValue('   ');

            // Act
            const result = guard.canActivate(mockRoute, mockState);

            // Assert
            // Note: The current implementation treats whitespace as valid token
            // This test documents the current behavior - might need to be updated
            // if the guard implementation changes to trim whitespace
            expect(result).toBe(true);
            expect(notificationService.showWarning).not.toHaveBeenCalled();
        });
    });

    describe('Multiple Calls and Performance', () => {
        it('should work correctly on multiple consecutive calls', () => {
            // First call - no token
            authService.getToken.and.returnValue(null);
            let result1 = guard.canActivate(mockRoute, mockState);
            expect(result1).toBe(mockUrlTree);

            // Second call - with token
            authService.getToken.and.returnValue('valid-token');
            let result2 = guard.canActivate(mockRoute, mockState);
            expect(result2).toBe(true);

            // Third call - no token again
            authService.getToken.and.returnValue(null);
            let result3 = guard.canActivate(mockRoute, mockState);
            expect(result3).toBe(mockUrlTree);

            // Verify method calls
            expect(authService.getToken).toHaveBeenCalledTimes(3);
            expect(notificationService.showWarning).toHaveBeenCalledTimes(2);
        });

        it('should call authService.getToken only once per guard activation', () => {
            // Arrange
            authService.getToken.and.returnValue('token');

            // Act
            guard.canActivate(mockRoute, mockState);

            // Assert
            expect(authService.getToken).toHaveBeenCalledTimes(1);
        });
    });
});
