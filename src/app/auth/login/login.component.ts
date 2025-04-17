// src/app/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  showPassword = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

  }

  ngOnInit(): void {
    /* COMENTADO o ELIMINADO: Ya no redirigimos automáticamente si hay token
    if (this.authService.getToken()) {
      this.router.navigate(['/dashboard']);
    } else {
    }
    */
  }

  onSubmit(): void {

    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading = false;

          // Pequeña pausa para asegurar que todos los observables se han actualizado
          setTimeout(() => {
            // Redirigir al dashboard tras login exitoso
            this.router.navigate(['/dashboard']);
          }, 100);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.isLoading = false;

          // Mostrar el mensaje de error del servidor o un mensaje genérico
          if (err.error && err.error.message) {
            this.error = err.error.message;
          } else if (err.status === 0) {
            this.error = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
          } else {
            this.error = 'Ocurrió un error durante el inicio de sesión. Inténtalo de nuevo.';
          }
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores de validación
      this.loginForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}