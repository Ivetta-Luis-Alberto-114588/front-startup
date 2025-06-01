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

    console.log('DEBUG - AuthInterceptor intercepting request to:', request.url);
    console.log('DEBUG - Token available?', token ? 'YES' : 'NO');
    if (token) {
      console.log('DEBUG - Token value (first 20 chars):', token.substring(0, 20) + '...');
    }

    // Si hay un token, adjuntarlo al header de la solicitud
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('DEBUG - Authorization header added to request');
    } else {
      console.log('DEBUG - No token found, request sent without Authorization header');
    }

    // Continuar con la solicitud modificada
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('DEBUG - AuthInterceptor caught error:', error.status, error.message);
        if (error.status === 401) {
          console.log('DEBUG - 401 error detected, logging out user');
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}