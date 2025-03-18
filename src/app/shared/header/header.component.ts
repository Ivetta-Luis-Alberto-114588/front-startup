// src/app/shared/header/header.component.ts
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from '../sidebar/sidebar.service';
import { AuthService, User } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';

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
    public sidebarService: SidebarService,
    public authService: AuthService
  ) {
    // console.log('HeaderComponent constructor - Checking initial auth state');
    this.isAuthenticated = this.authService.isAuthenticated();
    // console.log('Initial auth state:', this.isAuthenticated);
  }
  
  ngOnInit(): void {
    // console.log('HeaderComponent ngOnInit');
    
    // Suscribirse al estado de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        // console.log('Auth state changed:', isAuth);
        this.isAuthenticated = isAuth;
      }
    );
    
    // Suscribirse a la información del usuario
    this.userSubscription = this.authService.user$.subscribe(
      user => {
        // console.log('User info received:', user);
        this.currentUser = user;
      }
    );
    
    // Verificar el estado actual
    const token = this.authService.getToken();
    // console.log('Current token:', token ? 'exists' : 'none');
    // console.log('Is authenticated method:', this.authService.isAuthenticated());
  }
  
  ngOnDestroy(): void {
    // Cancelar suscripciones al destruir el componente
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
  
  logout(): void {
    // console.log('Logout clicked');
    this.authService.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Determina si el usuario ha hecho scroll suficiente para activar el efecto
    this.isScrolled = scrollTop > 50;
    
    // Determina la dirección del scroll
    if (scrollTop > this.lastScrollTop && scrollTop > 100) {
      // Scroll hacia abajo
      this.headerVisible = false;
    } else {
      // Scroll hacia arriba
      this.headerVisible = true;
    }
    
    this.lastScrollTop = scrollTop;
  }
  
  // Método para comprobar estado de autenticación (para debug en la plantilla)
  checkAuth(): boolean {
    // console.log('Template checking auth:', this.isAuthenticated);
    return this.isAuthenticated;
  }
}