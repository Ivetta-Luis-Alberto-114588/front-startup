// src/app/app.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { SidebarService } from './shared/sidebar/sidebar.service';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'angular-bootstrap-app';
  isMobile: boolean = window.innerWidth < 768;
  
  constructor(
    public sidebarService: SidebarService,
    private authService: AuthService
  ) {
    // console.log('AppComponent constructor');
  }
  
  ngOnInit(): void {
    // console.log('AppComponent ngOnInit - Checking auth status');
    
    // Verificar estado de autenticación al iniciar la aplicación
    const isAuthenticated = this.authService.isAuthenticated();
    // console.log('Initial app auth state:', isAuthenticated);
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = window.innerWidth < 768;
    
    // Auto-colapsa en móviles al cambiar el tamaño de la ventana
    if (this.isMobile && !this.sidebarService.isSidebarCollapsed) {
      this.sidebarService.isSidebarCollapsed = true;
    }
  }
}