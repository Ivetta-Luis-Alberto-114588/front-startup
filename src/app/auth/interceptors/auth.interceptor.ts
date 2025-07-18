// src/app/auth/interceptors/auth.interceptor.ts
import { Injectable, isDevMode } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token de autenticación de forma segura
    let token: string | null = null;
    
    try {
      token = this.authService.getToken();
    } catch (error) {
      // Si hay error obteniendo el token, continúa sin él
      // Solo loguear en modo desarrollo
      if (isDevMode()) {
        console.warn('Error getting auth token:', error);
      }
    }

    // Si hay un token, adjuntarlo al header de la solicitud
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }    // Continuar con la solicitud modificada
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          try {
            this.authService.logout();
          } catch (logoutError) {
            // Solo loguear en modo desarrollo
            if (isDevMode()) {
              console.warn('Error during logout:', logoutError);
            }
          }
        }
        return throwError(() => error);
      })
    );
  }
}