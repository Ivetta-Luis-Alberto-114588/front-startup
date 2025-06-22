import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with invalid form', () => {
      expect(component.registerForm.valid).toBeFalsy();
    });

    it('should require name field', () => {
      const nameControl = component.registerForm.get('name');
      expect(nameControl?.valid).toBeFalsy();
      expect(nameControl?.errors?.['required']).toBeTruthy();

      nameControl?.setValue('John Doe');
      expect(nameControl?.errors?.['required']).toBeFalsy();
    });

    it('should require valid email format', () => {
      const emailControl = component.registerForm.get('email');

      // Empty email
      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.errors?.['required']).toBeTruthy();

      // Invalid email format
      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.errors?.['email']).toBeTruthy();

      // Valid email
      emailControl?.setValue('test@example.com');
      expect(emailControl?.errors?.['email']).toBeFalsy();
    });

    it('should require password with minimum length', () => {
      const passwordControl = component.registerForm.get('password');

      // Empty password
      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.errors?.['required']).toBeTruthy();

      // Password too short
      passwordControl?.setValue('123');
      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.errors?.['minlength']).toBeTruthy();

      // Valid password
      passwordControl?.setValue('password123');
      expect(passwordControl?.errors?.['minlength']).toBeFalsy();
    });

    it('should require password confirmation', () => {
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      expect(confirmPasswordControl?.valid).toBeFalsy();
      expect(confirmPasswordControl?.errors?.['required']).toBeTruthy();
    });

    it('should validate password match', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'different123'
      });

      expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();

      component.registerForm.patchValue({
        confirmPassword: 'password123'
      });

      expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
    });

    it('should require privacy policy acceptance', () => {
      const privacyControl = component.registerForm.get('acceptPrivacyPolicy');
      expect(privacyControl?.valid).toBeFalsy();
      expect(privacyControl?.errors?.['required']).toBeTruthy();

      privacyControl?.setValue(true);
      expect(privacyControl?.errors?.['required']).toBeFalsy();
    });

    it('should be valid when all fields are properly filled', () => {
      component.registerForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptPrivacyPolicy: true
      });

      expect(component.registerForm.valid).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Set up valid form data
      component.registerForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptPrivacyPolicy: true
      });
    });

    it('should not submit if form is invalid', () => {
      component.registerForm.patchValue({ name: '' }); // Make form invalid
      component.onSubmit();

      expect(authServiceSpy.register).not.toHaveBeenCalled();
      expect(component.registerForm.touched).toBeTruthy();
    });

    it('should submit valid form and handle success', () => {
      // Set up valid form data
      component.registerForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptPrivacyPolicy: true
      });

      const mockResponse = {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          roles: ['USER_ROLE'], // Campo 'roles' como en MongoDB
          createdAt: '2025-05-30T21:12:12.591Z',
          updatedAt: '2025-05-30T21:12:12.591Z',
          __v: 0
        }
      };

      authServiceSpy.register.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('¡Registro exitoso! Ahora puedes iniciar sesión.', 'Completado');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should handle registration error', () => {
      // Set up valid form data
      component.registerForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptPrivacyPolicy: true
      });

      const mockError = new HttpErrorResponse({
        error: { message: 'Email already exists' },
        status: 400,
        statusText: 'Bad Request'
      });

      authServiceSpy.register.and.returnValue(throwError(() => mockError));

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(component.isLoading).toBeFalsy();
      expect(component.error).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Ocurrió un error inesperado. Inténtalo de nuevo.', 'Error de Registro');
    });

    it('should handle unknown error', () => {
      const mockError = new HttpErrorResponse({
        error: {},
        status: 500,
        statusText: 'Internal Server Error'
      });

      authServiceSpy.register.and.returnValue(throwError(() => mockError));

      component.onSubmit();

      fixture.detectChanges();

      expect(component.error).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Ocurrió un error inesperado. Inténtalo de nuevo.', 'Error de Registro');
    });
  });

  describe('User Roles', () => {
    it('should register user with USER_ROLE by default', () => {
      component.registerForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptPrivacyPolicy: true
      });

      const mockResponse = {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          roles: ['USER_ROLE'],
          createdAt: '2025-05-30T21:12:12.591Z',
          updatedAt: '2025-05-30T21:12:12.591Z',
          __v: 0
        }
      };

      authServiceSpy.register.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      // Verificar que se envían solo los datos básicos sin rol
      const expectedPayload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      expect(authServiceSpy.register).toHaveBeenCalledWith(expectedPayload);
    });

    it('should not allow users to register as admin through the form', () => {
      // El formulario de registro no debe tener opciones para seleccionar rol ADMIN_ROLE
      expect(component.registerForm.get('role')).toBeNull();
    });
  });

  describe('UI Interactions', () => {
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

    it('should clear error on form value change', () => {
      component.error = 'Some error';
      component.registerForm.get('name')?.setValue('John');
      expect(component.error).toBe('Some error'); // Error persists until manually cleared
    });
  });

  describe('Form Getters', () => {
    it('should return form controls through getters', () => {
      expect(component.name).toBe(component.registerForm.get('name'));
      expect(component.email).toBe(component.registerForm.get('email'));
      expect(component.password).toBe(component.registerForm.get('password'));
      expect(component.confirmPassword).toBe(component.registerForm.get('confirmPassword'));
      expect(component.acceptPrivacyPolicy).toBe(component.registerForm.get('acceptPrivacyPolicy'));
    });

    it('should validate form controls through getters', () => {
      const nameControl = component.name;
      expect(nameControl?.valid).toBeFalsy();

      nameControl?.setValue('John Doe');
      expect(nameControl?.valid).toBeTruthy();
    });
  });
});
