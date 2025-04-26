// src/app/auth/forgot-password/forgot-password.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    const emailValue = this.email?.value;

    this.authService.requestPasswordReset(emailValue).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.successMessage = response.message; // Mensaje genérico del backend
        this.notificationService.showInfo(this.successMessage, 'Solicitud Enviada');
        this.forgotPasswordForm.reset(); // Limpiar formulario
      },
      error: (err: HttpErrorResponse) => {
        if (err.error && err.error.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Ocurrió un error al enviar la solicitud. Inténtalo más tarde.';
        }
        this.notificationService.showError(this.error ?? "Unknown error", 'Error');
      }
    });
  }
}