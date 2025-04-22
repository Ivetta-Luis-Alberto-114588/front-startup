// src/app/auth/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Usamos el observable user$ para obtener la información del usuario actual
    return this.authService.user$.pipe(
      take(1), // Tomamos solo el primer valor emitido para evitar suscripciones persistentes
      map(user => {
        // Verificar si el usuario existe y si tiene el rol ADMIN_ROLE
        const isAdmin = !!user && user.role?.includes('ADMIN_ROLE');

        if (isAdmin) {
          console.log('AdminGuard: Acceso permitido.');
          return true; // Permitir acceso si es admin
        } else {
          // Si no es admin, mostrar notificación y redirigir
          console.warn('AdminGuard: Acceso denegado. Rol ADMIN requerido.');
          this.notificationService.showError('No tienes permisos para acceder a esta sección.', 'Acceso Denegado');
          // Redirigir al dashboard o a donde consideres apropiado
          return this.router.createUrlTree(['/dashboard']);
        }
      })
    );
  }
}