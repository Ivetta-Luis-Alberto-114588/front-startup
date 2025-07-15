// src/app/auth/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Importar OnDestroy
import { Router, ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CartService } from 'src/app/features/cart/services/cart.service'; // <<<--- IMPORTAR CartService
import { NotificationService } from 'src/app/shared/services/notification.service'; // <<<--- IMPORTAR NotificationService
import { finalize, Subscription } from 'rxjs'; // <<<--- IMPORTAR finalize y Subscription

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy { // Implementar OnDestroy
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  showPassword = false;
  returnUrl: string = '/dashboard'; // URL por defecto a la que redirigir
  private queryParamsSubscription: Subscription | null = null; // Para desuscribir

  constructor(
    private router: Router,
    private route: ActivatedRoute, // Inyectar ActivatedRoute
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private cartService: CartService, // <<<--- Inyectar CartService
    private notificationService: NotificationService // <<<--- Inyectar NotificationService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [true] // Marcado por defecto
    });
  }

  ngOnInit(): void {
    // Obtener la URL de retorno de los query params
    this.queryParamsSubscription = this.route.queryParamMap.subscribe(params => {
      this.returnUrl = params.get('returnUrl') || '/dashboard';
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe(); // Desuscribir
  }


  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          // --- PROCESAR ACCIÓN PENDIENTE DEL CARRITO ---
          this.processPendingCartAction();
          // --- FIN PROCESAR ACCIÓN PENDIENTE ---
        },
        error: (err) => {
          this.isLoading = false;
          if (err.error && err.error.message) {
            this.error = err.error.message;
          } else if (err.status === 0 || err.status === 503) { // Service Unavailable
            this.error = 'No se pudo conectar con el servidor. Inténtalo más tarde.';
          } else if (err.status === 401) { // Unauthorized (credenciales inválidas)
            this.error = 'Correo electrónico o contraseña incorrectos.';
          } else {
            this.error = 'Ocurrió un error durante el inicio de sesión.';
          }
        }
        // complete: () => { // El complete se llama después de next o error
        // No necesitas isLoading = false aquí si usas processPendingCartAction
        // }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  private processPendingCartAction(): void {
    const pendingActionString = localStorage.getItem('pendingCartAction');
    // Limpiar inmediatamente para evitar intentos múltiples
    localStorage.removeItem('pendingCartAction');

    if (pendingActionString) {
      try {
        const pendingAction = JSON.parse(pendingActionString);
        if (pendingAction && pendingAction.productId && pendingAction.quantity) {
          this.notificationService.showInfo('Añadiendo producto al carrito...');

          this.cartService.addItem(pendingAction.productId, pendingAction.quantity).pipe(
            // finalize se ejecuta sí o sí, pero la redirección debe ir en next/error
          ).subscribe({
            next: () => {
              this.notificationService.showSuccess('Producto añadido al carrito.');
              this.isLoading = false; // Detener loading general
              this.router.navigateByUrl(this.returnUrl);
            },
            error: (cartErr) => {
              // El CartService ya debería haber mostrado un error
              // this.notificationService.showError('No se pudo añadir el producto pendiente al carrito.');
              this.isLoading = false; // Detener loading general
              this.router.navigateByUrl(this.returnUrl); // Redirigir igualmente
            }
          });
          // NO redirigir aquí, esperar a que addItem termine
          return; // Salir para no ejecutar la redirección de abajo
        } else {
        }
      } catch (e) {
      }
    }

    // Si no había acción pendiente o hubo error al procesarla, redirigir
    this.isLoading = false; // Detener loading general
    this.router.navigateByUrl(this.returnUrl);
  }


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}