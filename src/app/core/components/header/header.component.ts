import { Component, HostListener  } from '@angular/core';
import { SidebarService } from '../../../core/components/sidebar/sidebar.service';

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss']
})

export class HeaderComponent {
  isScrolled = false;
  lastScrollTop = 0;
  headerVisible = true;

  constructor(public sidebarService: SidebarService) {}

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
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
}