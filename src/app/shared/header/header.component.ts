// src/app/shared/header/header.component.ts
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription, tap } from 'rxjs'; // Sigue siendo necesario para la carga inicial del carrito

import { SidebarService } from '../sidebar/sidebar.service';
import { AuthService, User } from '../../auth/services/auth.service';
import { CartService } from '../../features/cart/services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isScrolled = false;
  lastScrollTop = 0;
  headerVisible = true;

  // Ya no necesitamos las propiedades locales isAuthenticated y currentUser
  // porque usaremos los observables directamente en la plantilla con async pipe.

  // Mantenemos la suscripción para la carga inicial del carrito
  private cartLoadSubscription: Subscription | null = null;
  private authSub: Subscription | null = null; // Para desuscribir

  constructor(
    public sidebarService: SidebarService, // Público para acceso en plantilla
    public authService: AuthService,     // Público para acceso en plantilla
    public cartService: CartService      // Público para acceso en plantilla
  ) { }

  ngOnInit(): void {
    // Intentar cargar el carrito inicial si el usuario está autenticado al cargar el header
    // Nos suscribimos aquí solo para disparar la petición, no necesitamos guardar el resultado localmente.
    // El CartService actualizará su propio BehaviorSubject, y el async pipe en la plantilla reaccionará.
    if (this.authService.isAuthenticated()) {
      this.cartLoadSubscription = this.cartService.getCart().subscribe({
        error: (err) => console.warn('HeaderComponent: Error al cargar carrito inicial:', err.message) // El servicio ya notifica
      });
    }

    // *** AÑADIR ESTA SUSCRIPCIÓN PARA DEBUG ***
    console.log('HeaderComponent OnInit: Verificando estado inicial...');
    this.authSub = this.authService.isAuthenticated$.pipe(
      tap(isAuth => console.log('>>> HeaderComponent - isAuthenticated$ emitió:', isAuth))
    ).subscribe();
    // Loguear también el valor síncrono inicial (puede ser diferente si aún no se carga de localStorage)
    console.log('>>> HeaderComponent - Valor síncrono inicial authService.isAuthenticated():', this.authService.isAuthenticated());
    // *** FIN DEBUG ***
  }

  ngOnDestroy(): void {
    // Cancelar la suscripción de carga inicial si aún está activa
    this.cartLoadSubscription?.unsubscribe();
    this.authSub?.unsubscribe()
  }

  toggleSidebar(): void {
    // La llamada al servicio es suficiente, el estado se maneja allí
    this.sidebarService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();
    // El CartService podría (o debería) escuchar el logout de AuthService
    // para limpiar su propio estado si es necesario, en lugar de hacerlo aquí.
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // ... (sin cambios)
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrolled = scrollTop > 50;
    if (scrollTop > this.lastScrollTop && scrollTop > 100) {
      this.headerVisible = false;
    } else {
      this.headerVisible = true;
    }
    this.lastScrollTop = scrollTop;
  }

  // Ya no necesitamos checkAuth()
}