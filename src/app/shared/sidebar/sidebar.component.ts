// src/app/shared/sidebar/sidebar.component.ts
import { Component } from '@angular/core';
import { SidebarService } from './sidebar.service';
import { AuthService } from 'src/app/auth/services/auth.service'; // <<<--- IMPORTAR AuthService

@Component({
  selector: 'app-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  // Inyectar AuthService y hacerlo público para usarlo en la plantilla
  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService // <<<--- INYECTAR y hacer PÚBLICO
  ) { }

  // Helper para verificar si el usuario es admin (opcional, se puede hacer directo en HTML)
  // get isAdmin(): Observable<boolean> {
  //   return this.authService.user$.pipe(
  //     map(user => !!user && user.role?.includes('ADMIN_ROLE'))
  //   );
  // }
}