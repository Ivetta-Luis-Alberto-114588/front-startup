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
    private sidebarService: SidebarService, // Hacer private
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const isAuthenticated = this.authService.isAuthenticated();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const isMobileNow = window.innerWidth < 768;
    // Llama al método del servicio para actualizar el estado
    this.sidebarService.setSidebarCollapsed(isMobileNow);
  }
}