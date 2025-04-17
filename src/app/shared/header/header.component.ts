// src/app/shared/header/header.component.ts
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { SidebarService } from '../sidebar/sidebar.service';
import { AuthService, User } from '../../auth/services/auth.service';
import { CartService } from '../../features/cart/services/cart.service'; // <--- IMPORTAR CartService

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isScrolled = false;
  lastScrollTop = 0;
  headerVisible = true;
  isAuthenticated = false;
  currentUser: User | null = null;

  private authSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    public sidebarService: SidebarService, // Público para acceso fácil en plantilla
    public authService: AuthService,     // Público para acceso fácil en plantilla
    public cartService: CartService      // <--- INYECTAR y hacerlo PÚBLICO
  ) {
    // El constructor ahora está más limpio, la lógica principal va a ngOnInit
  }

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        // Opcional: Si el usuario se desloguea, podríamos querer limpiar el carrito visualmente
        // if (!isAuth) {
        //   this.cartService.clearLocalCartState(); // Necesitarías añadir este método a CartService si lo quieres
        // }
      }
    );

    // Suscribirse a la información del usuario
    this.userSubscription = this.authService.user$.subscribe(
      user => {
        this.currentUser = user;
      }
    );

    // Cargar el carrito inicial si el usuario está autenticado
    // (Descomenta la llamada en CartService si quieres esta funcionalidad)
    // this.cartService.loadInitialCartIfAuthenticated(); // O llama a getCart() aquí si prefieres
    if (this.authService.isAuthenticated()) {
      this.cartService.getCart().subscribe(); // Llama para cargar, el servicio actualiza el BehaviorSubject
    }

  }

  ngOnDestroy(): void {
    // Cancelar suscripciones al destruir el componente
    this.authSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();
    // Opcional: Limpiar el estado local del carrito al hacer logout
    // this.cartService.clearLocalCartState(); // Necesitarías añadir este método a CartService
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

  // Método para comprobar estado de autenticación (para debug en la plantilla)
  checkAuth(): boolean {
    return this.isAuthenticated;
  }
}