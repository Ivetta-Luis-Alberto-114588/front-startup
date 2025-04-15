// src/app/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http'; // Importar HttpErrorResponse
import { passwordMatchValidator } from './password-match.validator';
import { NotificationService } from 'src/app/shared/services/notification.service';

// ... (Validador passwordMatchValidator) ...

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  isLoading = false;
  error: string | null = null; // Esta propiedad se mostrará en el HTML
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService // Asegúrate de importar el servicio
  ) {
    // ... (inicialización del form) ...
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, {
      validators: passwordMatchValidator
    });
  }

  ngOnInit(): void {
    /* COMENTADO o ELIMINADO: Ya no redirigimos automáticamente si el usuario está autenticado
  if (this.authService.isAuthenticated()) {
    this.router.navigate(['/dashboard']);
  }
  */
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      console.log('Formulario inválido');
      // Buscar el primer error para dar feedback más específico si se desea
      // Ejemplo: if (this.registerForm.errors?.['passwordMismatch']) { this.error = "Las contraseñas no coinciden"; }
      return;
    }

    this.isLoading = true;
    this.error = null; // Limpiar error anterior al reintentar

    const { confirmPassword, acceptTerms, ...userData } = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registro exitoso:', response);
        // --- USAR TOAST EN LUGAR DE ALERT ---
        this.notificationService.showSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.', 'Completado');
        this.router.navigate(['/auth/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error en el registro (Full Response):', err);
        // ... (lógica para extraer el mensaje de error como antes) ...
        let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.'; // Default
        if (err.error && typeof err.error === 'object' && err.error.error) {
          errorMessage = err.error.error;
        } else if (err.error && typeof err.error === 'object' && err.error.message) {
          if (Array.isArray(err.error.message)) {
            errorMessage = err.error.message.join('. ');
          } else {
            errorMessage = err.error.message;
          }
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.status === 400) {
          errorMessage = 'Datos inválidos. Por favor, revisa el formulario.';
        } else if (err.status === 0 || err.status === 503) {
          errorMessage = 'No se pudo conectar con el servidor. Inténtalo más tarde.';
        } else {
          errorMessage = `Ocurrió un error inesperado (Código: ${err.status}). Inténtalo de nuevo.`;
        }
        this.error = errorMessage; // Mantener el error en el div si quieres
        // --- MOSTRAR TOAST DE ERROR ---
        this.notificationService.showError(errorMessage, 'Error de Registro');
      }
    });
  }

  // ... (togglePasswordVisibility, toggleConfirmPasswordVisibility, getters) ...
  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get acceptTerms() { return this.registerForm.get('acceptTerms'); }
}