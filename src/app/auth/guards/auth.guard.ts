// src/app/auth/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Llama a getToken() que ahora debería leer de localStorage si es necesario
    const tokenExists = !!this.authService.getToken();

    if (tokenExists) {
      // Si hay token (en memoria o leído de localStorage), permite el acceso
      return true;
    } else {
      // Si no hay token, redirige a login
      console.warn('AuthGuard: Acceso denegado, no hay token. Redirigiendo a login.');
      this.notificationService.showWarning('Debes iniciar sesión para acceder a esta página.', 'Acceso Requerido');
      // Guarda la URL a la que intentaba ir para redirigir después del login
      return this.router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }
  }
}