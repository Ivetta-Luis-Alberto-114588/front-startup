import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isSidebarCollapsed = window.innerWidth < 768; // Colapsado por defecto en móviles
  
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    
    // En móviles, podemos añadir una clase al body para prevenir scroll
    if (window.innerWidth < 768) {
      if (!this.isSidebarCollapsed) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
  }
}