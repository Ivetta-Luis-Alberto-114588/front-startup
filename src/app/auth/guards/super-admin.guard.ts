// src/app/auth/guards/super-admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { RoleService } from 'src/app/shared/services/role.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Injectable({
    providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {

    constructor(
        private roleService: RoleService,
        private router: Router,
        private notificationService: NotificationService
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        // Verificar si el usuario tiene permisos de Super Admin
        return this.roleService.isSuperAdmin().pipe(
            take(1), // Tomamos solo el primer valor emitido para evitar suscripciones persistentes
            map(isSuperAdmin => {
                if (isSuperAdmin) {
                    return true; // Permitir acceso si es super admin
                } else {
                    // Si no es super admin, mostrar notificación y redirigir
                    this.notificationService.showError('Solo los Super Administradores pueden realizar esta acción.', 'Acceso Denegado');
                    // Redirigir a la lista de métodos de entrega
                    return this.router.createUrlTree(['/admin/delivery-methods']);
                }
            })
        );
    }
}
