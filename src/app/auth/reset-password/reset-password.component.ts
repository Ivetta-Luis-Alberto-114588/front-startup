// src/app/auth/reset-password/reset-password.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
      validators: passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.isTokenValid = false;
        this.error = 'El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita uno nuevo.';
        this.notificationService.showError(this.error, 'Token Inválido');
        // Considera redirigir a forgot-password
        // this.router.navigate(['/auth/forgot-password']);
      } else {
        this.isTokenValid = true;
        // Opcional: Podrías hacer una llamada al backend para validar el token aquí mismo
        // antes de mostrar el formulario, pero la validación principal se hará al enviar.
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get password() { return this.resetPasswordForm.get('password'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }

  onSubmit(): void {
    this.resetPasswordForm.markAllAsTouched(); // Marcar para mostrar errores de coincidencia

    if (this.resetPasswordForm.invalid || !this.token) {
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
        // Opcional: Redirigir a login después de un breve momento
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000); // Redirige después de 3 segundos
      },
      error: (err: HttpErrorResponse) => {
        if (err.error && err.error.error) {
          this.error = err.error.error;
        } else if (err.status === 401 || err.status === 400) {
          this.error = 'El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.';
          this.isTokenValid = false; // Marcar como inválido si falla
        } else {
          this.error = 'Ocurrió un error al restablecer la contraseña. Inténtalo más tarde.';
        }
        this.notificationService.showError(this.error ?? "Unknown error", 'Error');
      }
    });
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }
}