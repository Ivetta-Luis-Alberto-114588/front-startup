import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockQueryParamMapWithToken = new Map([['token', 'mock-reset-token']]);
  const mockQueryParamMapWithoutToken = new Map();

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['resetPassword']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [ResetPasswordComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(mockQueryParamMapWithToken) } }
      ]
    });

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize form with empty values and validators', () => {
      fixture.detectChanges();
      
      expect(component.resetPasswordForm).toBeDefined();
      expect(component.password?.value).toBe('');
      expect(component.confirmPassword?.value).toBe('');
      expect(component.password?.hasError('required')).toBeTruthy();
      expect(component.confirmPassword?.hasError('required')).toBeTruthy();
    });

    it('should extract token from query params on init', () => {
      fixture.detectChanges();
      
      expect(component.token).toBe('mock-reset-token');
      expect(component.isTokenValid).toBeTruthy();
      expect(component.error).toBeNull();
    });

    it('should handle missing token in query params', () => {
      // Create a mock that returns null for get('token')
      const mockQueryParamMapWithoutToken = {
        get: jasmine.createSpy('get').and.returnValue(null)
      };

      // Reconfigure with no token
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ResetPasswordComponent],
        imports: [ReactiveFormsModule],
        providers: [
          { provide: AuthService, useValue: authServiceSpy },
          { provide: NotificationService, useValue: notificationServiceSpy },
          { provide: Router, useValue: routerSpy },
          { provide: ActivatedRoute, useValue: { queryParamMap: of(mockQueryParamMapWithoutToken) } }
        ]
      });

      fixture = TestBed.createComponent(ResetPasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.token).toBeNull();
      expect(component.isTokenValid).toBeFalsy();
      expect(component.error).toContain('El enlace de restablecimiento no es válido');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
        component.error!,
        'Token Inválido'
      );
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate password field', () => {
      const passwordControl = component.password;
      
      // Required validation
      expect(passwordControl?.hasError('required')).toBeTruthy();
      
      // Minimum length validation
      passwordControl?.setValue('123');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      // Valid password
      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should validate confirm password field', () => {
      const confirmPasswordControl = component.confirmPassword;
      
      expect(confirmPasswordControl?.hasError('required')).toBeTruthy();
      
      confirmPasswordControl?.setValue('123456');
      expect(confirmPasswordControl?.hasError('required')).toBeFalsy();
    });

    it('should validate password match', () => {
      component.password?.setValue('password123');
      component.confirmPassword?.setValue('different123');
      component.resetPasswordForm.updateValueAndValidity();
      
      expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeTruthy();
      
      component.confirmPassword?.setValue('password123');
      component.resetPasswordForm.updateValueAndValidity();
      expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should mark all fields as touched when form is submitted with invalid data', () => {
      spyOn(component.resetPasswordForm, 'markAllAsTouched');
      
      component.onSubmit();
      
      expect(component.resetPasswordForm.markAllAsTouched).toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle password visibility', () => {
      expect(component.showPassword).toBeFalsy();
      
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTruthy();
      
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeFalsy();
    });

    it('should toggle confirm password visibility', () => {
      expect(component.showConfirmPassword).toBeFalsy();
      
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword).toBeTruthy();
      
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword).toBeFalsy();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.password?.setValue('newpassword123');
      component.confirmPassword?.setValue('newpassword123');
    });

    it('should not submit if form is invalid', () => {
      component.password?.setValue('');
      
      component.onSubmit();
      
      expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalsy();
    });

    it('should not submit if token is missing', () => {
      component.token = null;
      
      component.onSubmit();
      
      expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalsy();
    });

    it('should successfully reset password', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Contraseña actualizada exitosamente' };
      // Use delay(0) to make the observable asynchronous
      authServiceSpy.resetPassword.and.returnValue(of(mockResponse).pipe(delay(0)));
      
      component.onSubmit();
      
      // Immediately after onSubmit - loading should be true
      expect(component.isLoading).toBeTruthy();
      expect(authServiceSpy.resetPassword).toHaveBeenCalledWith({
        token: 'mock-reset-token',
        newPassword: 'newpassword123',
        passwordConfirmation: 'newpassword123'
      });
      
      tick(); // Complete observable
      
      expect(component.isLoading).toBeFalsy();
      expect(component.successMessage).toBe(mockResponse.message);
      expect(component.error).toBeNull();
      expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith(
        mockResponse.message,
        'Contraseña Actualizada'
      );
      expect(component.resetPasswordForm.pristine).toBeTruthy(); // Form should be reset
      
      tick(3500); // Wait for navigation timeout
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));

    it('should handle reset password error with specific error message', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: { error: 'Token inválido o expirado' }
      });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => errorResponse).pipe(delay(0)));
      
      component.onSubmit();
      
      tick(); // Process the error
      
      expect(component.isLoading).toBeFalsy();
      expect(component.error).toBe('Token inválido o expirado');
      expect(component.successMessage).toBeNull();
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
        'Token inválido o expirado',
        'Error'
      );
    }));

    it('should handle reset password error with 401 status (invalid token)', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({
        status: 401,
        error: { error: 'Token inválido' }
      });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      tick(); // Process the error
      
      expect(component.isLoading).toBeFalsy();
      expect(component.isTokenValid).toBeFalsy();
      expect(component.error).toBe('El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
        'El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.',
        'Error'
      );
    }));

    it('should handle reset password error with 400 status (bad request)', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({
        status: 400,
        error: { error: 'Datos inválidos' }
      });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      tick(); // Process the error
      
      expect(component.isLoading).toBeFalsy();
      expect(component.isTokenValid).toBeFalsy();
      expect(component.error).toBe('El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
        'El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.',
        'Error'
      );
    }));

    it('should handle generic reset password error', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: {}
      });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      tick(); // Process the error
      
      expect(component.isLoading).toBeFalsy();
      expect(component.error).toBe('Ocurrió un error al restablecer la contraseña. Inténtalo más tarde.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
        'Ocurrió un error al restablecer la contraseña. Inténtalo más tarde.',
        'Error'
      );
    }));

    it('should handle error without error object', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({
        status: 500
      });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      tick(); // Process the error
      
      expect(component.isLoading).toBeFalsy();
      expect(component.error).toBe('Ocurrió un error al restablecer la contraseña. Inténtalo más tarde.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
        'Ocurrió un error al restablecer la contraseña. Inténtalo más tarde.',
        'Error'
      );
    }));
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe from route subscription on destroy', () => {
      fixture.detectChanges();
      
      spyOn(component['routeSub']!, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(component['routeSub']!.unsubscribe).toHaveBeenCalled();
    });

    it('should handle null subscription on destroy', () => {
      fixture.detectChanges();
      component['routeSub'] = null;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return password form control', () => {
      expect(component.password).toBe(component.resetPasswordForm.get('password'));
    });

    it('should return confirmPassword form control', () => {
      expect(component.confirmPassword).toBe(component.resetPasswordForm.get('confirmPassword'));
    });
  });
});
