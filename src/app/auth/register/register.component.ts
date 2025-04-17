// src/app/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Quitamos AbstractControl si no se usa
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { passwordMatchValidator } from './password-match.validator';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      // acceptTerms: [false, Validators.requiredTrue], // Checkbox de Términos
      acceptPrivacyPolicy: [false, Validators.requiredTrue] // Checkbox de Política de Privacidad
    }, {
      validators: passwordMatchValidator
    });
  }

  ngOnInit(): void {

  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      // Opcional: verificar errores específicos
      // if (this.acceptTerms?.errors?.['required']) {
      // }
      if (this.acceptPrivacyPolicy?.errors?.['required']) {
      }
      return;
    }

    this.isLoading = true;
    this.error = null;

    // --- ACTUALIZAR PARA EXCLUIR AMBOS CHECKBOXES ---
    const { confirmPassword, acceptTerms, acceptPrivacyPolicy, ...userData } = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (response) => {
        // ... (código existente de éxito) ...
        this.isLoading = false;
        this.notificationService.showSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.', 'Completado');
        this.router.navigate(['/auth/login']);
      },
      error: (err: HttpErrorResponse) => {
        // ... (código existente de error) ...
        this.isLoading = false;
        console.error('Error en el registro (Full Response):', err);
        let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.'; // Default
        // ... (lógica para extraer mensaje de error) ...
        this.error = errorMessage;
        this.notificationService.showError(errorMessage, 'Error de Registro');
      }
    });
  }

  // --- Getters ---
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  // get acceptTerms() { return this.registerForm.get('acceptTerms'); }
  // --- AÑADIR ESTE GETTER ---
  get acceptPrivacyPolicy() { return this.registerForm.get('acceptPrivacyPolicy'); }

  // --- Métodos existentes ---
  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }

}