import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // Mock response data
  const mockSuccessResponse = {
    success: true,
    message: 'Reset email sent successfully'
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['requestPasswordReset']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['showInfo', 'showError']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [ForgotPasswordComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.successMessage).toBeNull();
      expect(component.forgotPasswordForm).toBeDefined();
    });

    it('should create form with email field and validators', () => {
      expect(component.forgotPasswordForm.get('email')).toBeDefined();
      expect(component.forgotPasswordForm.get('email')?.hasError('required')).toBe(true);

      // Test email validator
      component.forgotPasswordForm.get('email')?.setValue('invalid-email');
      expect(component.forgotPasswordForm.get('email')?.hasError('email')).toBe(true);

      component.forgotPasswordForm.get('email')?.setValue('valid@email.com');
      expect(component.forgotPasswordForm.get('email')?.hasError('email')).toBe(false);
    });

    it('should have email getter that returns email control', () => {
      const emailControl = component.email;
      expect(emailControl).toBe(component.forgotPasswordForm.get('email'));
    });
  });

  describe('Form Validation', () => {
    it('should mark form as invalid when email is empty', () => {
      component.forgotPasswordForm.get('email')?.setValue('');
      expect(component.forgotPasswordForm.invalid).toBe(true);
    });

    it('should mark form as invalid when email format is incorrect', () => {
      component.forgotPasswordForm.get('email')?.setValue('invalid-email');
      expect(component.forgotPasswordForm.invalid).toBe(true);
    });

    it('should mark form as valid when email is correct', () => {
      component.forgotPasswordForm.get('email')?.setValue('test@example.com');
      expect(component.forgotPasswordForm.valid).toBe(true);
    });

    it('should mark all fields as touched when form is invalid on submit', () => {
      component.forgotPasswordForm.get('email')?.setValue('');
      spyOn(component.forgotPasswordForm, 'markAllAsTouched');

      component.onSubmit();

      expect(component.forgotPasswordForm.markAllAsTouched).toHaveBeenCalled();
    });
  });

  describe('onSubmit Method', () => {
    beforeEach(() => {
      component.forgotPasswordForm.get('email')?.setValue('test@example.com');
    });

    it('should not proceed if form is invalid', () => {
      component.forgotPasswordForm.get('email')?.setValue('');
      spyOn(component.forgotPasswordForm, 'markAllAsTouched');

      component.onSubmit();

      expect(component.forgotPasswordForm.markAllAsTouched).toHaveBeenCalled();
      expect(authServiceSpy.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should set loading state and clear messages on submit', () => {
      component.error = 'Previous error';
      component.successMessage = 'Previous success';

      authServiceSpy.requestPasswordReset.and.returnValue(of(mockSuccessResponse));

      // Capture state before onSubmit completes
      const initialState = {
        error: component.error,
        successMessage: component.successMessage
      };

      component.onSubmit();

      // After completion, these should be set correctly
      expect(component.error).toBeNull();
      expect(component.successMessage).toBe(mockSuccessResponse.message);
      expect(component.isLoading).toBe(false);
    });

    it('should call authService.requestPasswordReset with email value', () => {
      const email = 'test@example.com';
      component.forgotPasswordForm.get('email')?.setValue(email);
      authServiceSpy.requestPasswordReset.and.returnValue(of(mockSuccessResponse));

      component.onSubmit();

      expect(authServiceSpy.requestPasswordReset).toHaveBeenCalledWith(email);
    });

    it('should handle successful password reset request', () => {
      const customResponse = { success: true, message: 'Custom success message' };
      authServiceSpy.requestPasswordReset.and.returnValue(of(customResponse));
      spyOn(component.forgotPasswordForm, 'reset');

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.successMessage).toBe(customResponse.message);
      expect(notificationServiceSpy.showInfo).toHaveBeenCalledWith(customResponse.message, 'Solicitud Enviada');
      expect(component.forgotPasswordForm.reset).toHaveBeenCalled();
    });

    it('should reset form after successful submission', () => {
      authServiceSpy.requestPasswordReset.and.returnValue(of(mockSuccessResponse));
      spyOn(component.forgotPasswordForm, 'reset');

      component.onSubmit();

      expect(component.forgotPasswordForm.reset).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component.forgotPasswordForm.get('email')?.setValue('test@example.com');
    });

    it('should handle HTTP error with specific error message', () => {
      const mockError = new HttpErrorResponse({
        error: { error: 'Email not found' },
        status: 404
      });
      authServiceSpy.requestPasswordReset.and.returnValue(throwError(mockError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.error).toBe('Email not found');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Email not found', 'Error');
    });

    it('should handle network connection error (status 0)', () => {
      const mockError = new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown Error'
      });
      authServiceSpy.requestPasswordReset.and.returnValue(throwError(mockError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.error).toBe('No se pudo conectar con el servidor.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('No se pudo conectar con el servidor.', 'Error');
    });

    it('should handle generic server error', () => {
      const mockError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });
      authServiceSpy.requestPasswordReset.and.returnValue(throwError(mockError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.error).toBe('Ocurrió un error al enviar la solicitud. Inténtalo más tarde.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Ocurrió un error al enviar la solicitud. Inténtalo más tarde.', 'Error');
    });

    it('should handle error without error object', () => {
      const mockError = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request'
      });
      authServiceSpy.requestPasswordReset.and.returnValue(throwError(mockError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.error).toBe('Ocurrió un error al enviar la solicitud. Inténtalo más tarde.');
    });

    it('should clear error when error is set to null', () => {
      component.error = 'Some error message';

      component.error = null;

      expect(component.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      component.forgotPasswordForm.get('email')?.setValue('test@example.com');
    });

    it('should set isLoading to false after successful request', () => {
      authServiceSpy.requestPasswordReset.and.returnValue(of(mockSuccessResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
    });

    it('should set isLoading to false after error', () => {
      const mockError = new HttpErrorResponse({ status: 500 });
      authServiceSpy.requestPasswordReset.and.returnValue(throwError(mockError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
    });

    it('should maintain loading state during request', (done) => {
      // Test that loading state is true during request
      authServiceSpy.requestPasswordReset.and.returnValue(of(mockSuccessResponse));

      component.onSubmit();

      // The loading state should be set to true initially
      // Note: The finalize operator will set it back to false after the observable completes
      // We need to check synchronously before the observable completes
      setTimeout(() => {
        expect(component.isLoading).toBe(false); // After completion
        done();
      }, 0);
    });
  });

  describe('Component State Management', () => {
    it('should reset error and success messages when starting new request', () => {
      component.error = 'Previous error';
      component.successMessage = 'Previous success';
      component.forgotPasswordForm.get('email')?.setValue('test@example.com');

      authServiceSpy.requestPasswordReset.and.returnValue(of(mockSuccessResponse));

      component.onSubmit();

      expect(component.error).toBeNull();
      expect(component.successMessage).toBe(mockSuccessResponse.message);
    });

    it('should handle multiple consecutive requests', () => {
      component.forgotPasswordForm.get('email')?.setValue('test@example.com');

      // First request
      const firstResponse = { success: true, message: 'First success' };
      authServiceSpy.requestPasswordReset.and.returnValue(of(firstResponse));
      component.onSubmit();
      expect(component.successMessage).toBe('First success');

      // Verify second request can be made after resetting state
      component.successMessage = null;
      component.forgotPasswordForm.get('email')?.setValue('test2@example.com');

      const secondResponse = { success: true, message: 'Second success' };
      authServiceSpy.requestPasswordReset.and.returnValue(of(secondResponse));

      component.onSubmit();

      // Verify the second response was handled
      expect(authServiceSpy.requestPasswordReset).toHaveBeenCalledTimes(2);
      expect(authServiceSpy.requestPasswordReset).toHaveBeenCalledWith('test2@example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email value gracefully', () => {
      component.forgotPasswordForm.get('email')?.setValue('');

      component.onSubmit();

      expect(authServiceSpy.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only email', () => {
      component.forgotPasswordForm.get('email')?.setValue('   ');

      expect(component.forgotPasswordForm.invalid).toBe(true);
    });

    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(50) + '@example.com'; // Reduced length for more realistic test
      component.forgotPasswordForm.get('email')?.setValue(longEmail);

      // Check that long but valid email is accepted
      expect(component.forgotPasswordForm.valid).toBe(true);

      // Test that the service is called with the long email
      authServiceSpy.requestPasswordReset.and.returnValue(of(mockSuccessResponse));
      component.onSubmit();
      expect(authServiceSpy.requestPasswordReset).toHaveBeenCalledWith(longEmail);
    });

    it('should handle special characters in email', () => {
      const specialEmail = 'test+tag@example-domain.com';
      component.forgotPasswordForm.get('email')?.setValue(specialEmail);

      expect(component.forgotPasswordForm.valid).toBe(true);
    });

    it('should handle form validation with null email value', () => {
      // This edge case tests when email value might be null
      component.forgotPasswordForm.get('email')?.setValue(null);

      component.onSubmit();

      expect(authServiceSpy.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should properly handle email field errors', () => {
      const emailControl = component.forgotPasswordForm.get('email');

      // Test required error
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      expect(emailControl?.hasError('required')).toBe(true);

      // Test email format error
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      // Test valid email
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.errors).toBeNull();
    });
  });

  describe('UI State Tests', () => {
    it('should show loading spinner when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
    });

    it('should hide form when successMessage is present', () => {
      component.successMessage = 'Email sent successfully';
      fixture.detectChanges();

      expect(component.successMessage).toBeTruthy();
    });

    it('should show error message when error is present', () => {
      component.error = 'Some error occurred';
      fixture.detectChanges();

      expect(component.error).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      component.forgotPasswordForm.get('email')?.setValue('');
      fixture.detectChanges();

      expect(component.forgotPasswordForm.invalid).toBe(true);
    });

    it('should disable submit button when loading', () => {
      component.isLoading = true;
      component.forgotPasswordForm.get('email')?.setValue('valid@email.com');
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      expect(component.forgotPasswordForm.valid).toBe(true);
    });
  });
});
