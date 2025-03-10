import { Component, HostListener } from '@angular/core';
import { SidebarService } from './shared/sidebar/sidebar.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angular-bootstrap-app';
  isMobile: boolean = window.innerWidth < 768;
  
  constructor(public sidebarService: SidebarService) {}
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = window.innerWidth < 768;
    
    // Auto-colapsa en móviles al cambiar el tamaño de la ventana
    if (this.isMobile && !this.sidebarService.isSidebarCollapsed) {
      this.sidebarService.isSidebarCollapsed = true;
    }
  }
}