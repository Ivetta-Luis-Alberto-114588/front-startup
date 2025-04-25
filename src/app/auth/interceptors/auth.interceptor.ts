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

    console.log('[AuthInterceptor] Intercepting:', request.url); // <-- LOG URL
    console.log('[AuthInterceptor] Token found:', token ? 'Yes' : 'No'); // <-- LOG TOKEN EXISTENCE

    // Si hay un token, adjuntarlo al header de la solicitud
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('[AuthInterceptor] Authorization header added.'); // <-- LOG HEADER ADDED
    } else {
      console.warn('[AuthInterceptor] No token found, header not added.'); // <-- LOG NO TOKEN
    }

    // Continuar con la solicitud modificada
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('[AuthInterceptor] HTTP Error:', error.status, error.url); // <-- LOG ERROR STATUS
        if (error.status === 401) {
          console.warn('[AuthInterceptor] Received 401, logging out...'); // <-- LOG LOGOUT
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}