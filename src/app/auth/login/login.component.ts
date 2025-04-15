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

    // console.log('LoginComponent constructor');
  }

  ngOnInit(): void {
    // console.log('LoginComponent ngOnInit');
    /* COMENTADO o ELIMINADO: Ya no redirigimos automáticamente si hay token
    if (this.authService.getToken()) {
      // console.log('User already has token, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    } else {
      // console.log('No token found, showing login form');
    }
    */
  }

  onSubmit(): void {
    // console.log('Login form submitted');

    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;

      const { email, password } = this.loginForm.value;
      // console.log('Attempting login with email:', email);

      this.authService.login(email, password).subscribe({
        next: (response) => {
          // console.log('Login successful:', response);
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
      // console.log('Form validation failed');
      // Marcar todos los campos como tocados para mostrar errores de validación
      this.loginForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}