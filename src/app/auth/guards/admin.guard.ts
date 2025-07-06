// src/app/auth/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { RoleService } from 'src/app/shared/services/role.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private roleService: RoleService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Usamos el RoleService para verificar permisos de administración
    return this.roleService.hasAdminPermissions().pipe(
      take(1), // Tomamos solo el primer valor emitido para evitar suscripciones persistentes
      map(hasPermissions => {
        if (hasPermissions) {
          return true; // Permitir acceso si tiene permisos de administración
        } else {
          // Si no tiene permisos de administración, mostrar notificación y redirigir
          this.notificationService.showError('No tienes permisos para acceder a esta sección.', 'Acceso Denegado');
          // Redirigir al dashboard o a donde consideres apropiado
          return this.router.createUrlTree(['/dashboard']);
        }
      })
    );
  }
}