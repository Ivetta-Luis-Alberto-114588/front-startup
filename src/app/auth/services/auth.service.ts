// src/app/auth/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Importar HttpErrorResponse
import { Observable, tap, BehaviorSubject, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

// Interfaz para la información del usuario
export interface User {
  id?: string;
  name?: string;
  email: string;
  role?: string[];
  token?: string;
}

// Interfaz opcional para el payload de registro
export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
}

// --- NUEVAS INTERFACES ---
// Payload para solicitar reseteo
export interface ForgotPasswordPayload {
  email: string;
}

// Payload para resetear contraseña
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  passwordConfirmation: string;
}

// Interfaz genérica para respuestas de éxito simple
export interface SimpleSuccessResponse {
  success: boolean;
  message: string;
}
// --- FIN NUEVAS INTERFACES ---


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private token: string | null = null;
  private user: User | null = null;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.loadUserAndToken();
  }

  private loadUserAndToken(): void {
    this.token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (typeof parsedUser === 'object' && parsedUser !== null) {
          this.user = parsedUser;
          this.userSubject.next(this.user);
        } else {
          localStorage.removeItem('user');
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem('user');
      }
    }

    if (this.token) {
      this.isAuthenticatedSubject.next(true);
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }


  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response && typeof response === 'object' && response.user && typeof response.user === 'object' && typeof response.user.token === 'string') {
            const token = response.user.token;
            const userData = response.user;
            this.storeToken(token);
            const { token: _, ...userWithoutToken } = userData;
            this.storeUser(userWithoutToken);
            this.isAuthenticatedSubject.next(true);
          } else {
            console.error("Invalid login response structure:", response);
            throw new Error('Respuesta de login inválida del servidor.'); // Lanza error si la estructura no es la esperada
          }
        }),
        catchError(err => {
          // El componente manejará el error de UI
          return throwError(() => err);
        })
      );
  }

  register(userData: RegisterPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  // --- NUEVO MÉTODO: Solicitar Reseteo ---
  requestPasswordReset(email: string): Observable<SimpleSuccessResponse> {
    const payload: ForgotPasswordPayload = { email };
    // Asume que el backend devuelve { success: boolean, message: string }
    return this.http.post<SimpleSuccessResponse>(`${this.apiUrl}/forgot-password`, payload);
  }
  // --- FIN NUEVO MÉTODO ---

  // --- NUEVO MÉTODO: Resetear Contraseña ---
  resetPassword(payload: ResetPasswordPayload): Observable<SimpleSuccessResponse> {
    // Asume que el backend devuelve { success: boolean, message: string }
    return this.http.post<SimpleSuccessResponse>(`${this.apiUrl}/reset-password`, payload);
  }
  // --- FIN NUEVO MÉTODO ---

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/dashboard']);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  getUser(): User | null {
    if (!this.user) { // Intentar cargar si no está en memoria
      this.loadUserAndToken();
    }
    return this.user;
  }

  isAuthenticated(): boolean {
    // Verifica también si hay token en localStorage por si acaso
    return !!this.getToken();
  }

  private storeToken(token: string): void {
    this.token = token;
    try {
      localStorage.setItem('token', token);
    } catch (e) {
      console.error("Error storing token in localStorage", e);
    }
  }

  private storeUser(user: User): void {
    this.user = user;
    this.userSubject.next(user);
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.error("Error storing user in localStorage", e);
    }
  }
}