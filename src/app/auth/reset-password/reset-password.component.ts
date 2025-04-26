// src/app/auth/reset-password/reset-password.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms'; // Importar AbstractControl
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AuthService, ResetPasswordPayload } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { passwordMatchValidator } from '../register/password-match.validator'; // Reutilizar validador
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  token: string | null = null;
  isLoading = false;
  isTokenValid = true; // Asume que es válido hasta que se compruebe
  error: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: passwordMatchValidator // Aplicar validador de coincidencia
    });
  }

  ngOnInit(): void {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.isTokenValid = false;
        this.error = 'El enlace de restablecimiento no es válido o ha expirado (falta token). Por favor, solicita uno nuevo.';
        this.notificationService.showError(this.error, 'Token Inválido');
        // Considera redirigir a forgot-password
        // this.router.navigate(['/auth/forgot-password']);
      } else {
        this.isTokenValid = true;
        // Opcional: Validar token con backend aquí si quieres feedback inmediato
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get password() { return this.resetPasswordForm.get('password'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }

  onSubmit(): void {
    this.resetPasswordForm.markAllAsTouched(); // Marcar para mostrar errores

    if (this.resetPasswordForm.invalid || !this.token) {
      // Si el formulario es inválido (incluyendo la no coincidencia) o no hay token, no continuar
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const payload: ResetPasswordPayload = {
      token: this.token,
      newPassword: this.password?.value,
      passwordConfirmation: this.confirmPassword?.value
    };

    this.authService.resetPassword(payload).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.notificationService.showSuccess(this.successMessage, 'Contraseña Actualizada');
        this.resetPasswordForm.reset();
        // Redirigir a login después de un breve momento
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3500); // Aumentar un poco el tiempo
      },
      error: (err: HttpErrorResponse) => {
        if (err.error && err.error.error) {
          this.error = err.error.error;
          // Si el error específico indica token inválido/expirado
          if (err.status === 401 || err.status === 400) { // Asumiendo que el backend usa estos códigos
            this.isTokenValid = false; // Marcar token como inválido
            this.error = 'El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.'; // Mensaje claro
          }
        } else {
          this.error = 'Ocurrió un error al restablecer la contraseña. Inténtalo más tarde.';
        }
        this.notificationService.showError(this.error ?? 'Error desconocido', 'Error');
      }
    });
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }
}