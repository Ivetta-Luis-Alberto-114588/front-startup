// src/app/auth/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

// Interfaz para la información del usuario
export interface User {
  id?: string;
  name?: string;
  email: string;
  role?: string[];
  token?: string;
  // otros campos que puedan venir del API
}

// Interfaz opcional para el payload de registro
export interface RegisterPayload {
  name: string;
  email: string;
  password?: string; // Password puede ser opcional si se envía en otro campo o se maneja diferente
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`; // URL base de la API
  private token: string | null = null;
  private user: User | null = null;

  // BehaviorSubject para mantener el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // BehaviorSubject para mantener la información del usuario
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // ... (código existente del constructor) ...
    this.loadUserAndToken(); // Mover lógica a método privado
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
        console.error('Error parsing user from localStorage:', e);
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
          // Estructura específica donde el token está dentro del objeto user
          if (response && typeof response === 'object' && response.user && typeof response.user === 'object' && typeof response.user.token === 'string') {
            const token = response.user.token;
            const userData = response.user;
            this.storeToken(token);
            const { token: _, ...userWithoutToken } = userData;
            this.storeUser(userWithoutToken);
            this.isAuthenticatedSubject.next(true);
          } else {
            console.warn('Login response structure is not as expected:', response);
            // Considerar lanzar un error o manejarlo de otra forma
            // throw new Error('Respuesta de login inválida'); // Podría ser una opción
          }
        })
      );
  }

  // --- NUEVO MÉTODO REGISTER ---
  register(userData: RegisterPayload): Observable<any> {
    // Asegúrate que el endpoint '/register' es el correcto en tu API
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
    // Nota: Este método solo envía la petición. No actualiza el estado
    // de autenticación ni guarda token/usuario automáticamente aquí,
    // asumiendo que el usuario debe hacer login después del registro.
    // Si tu API devuelve token/usuario al registrar, puedes añadir un .pipe(tap(...))
    // similar al de login para autologuear.
  }
  // --- FIN NUEVO MÉTODO REGISTER ---


  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private storeToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  private storeUser(user: User): void {
    this.user = user;
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }
}