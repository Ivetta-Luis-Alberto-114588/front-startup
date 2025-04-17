// src/app/auth/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
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
    // Obtener el token de autenticación
    const token = this.authService.getToken();
    console.log('AuthInterceptor: Token obtenido ->', token ? 'Sí' : 'No'); // <-- DEBUG

    // Si hay un token, adjuntarlo al header de la solicitud
    if (token) {
      console.log('AuthInterceptor: Añadiendo token a la cabecera para:', request.url); // <-- DEBUG
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Continuar con la solicitud modificada
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('AuthInterceptor: Error en petición ->', error.status, error.url)
        // Si recibimos un error 401 (No autorizado), podría significar que el token ha expirado
        if (error.status === 401) {
          console.log('AuthInterceptor: Recibido 401, ejecutando logout...');
          this.authService.logout(); // Limpia el token y redirige a login
        }
        return throwError(() => error);
      })
    );
  }
}