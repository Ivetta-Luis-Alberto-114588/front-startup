// src/app/auth/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';

// Interfaz para la información del usuario
export interface User {
  id?: string;
  name?: string;
  email: string;
  role?: string[];
  token?: string;
  // otros campos que puedan venir del API
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
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
    // console.log('AuthService constructor - Checking localStorage');
    
    // Intenta recuperar el token y la información del usuario del localStorage al iniciar el servicio
    this.token = localStorage.getItem('token');
    // console.log('Token from localStorage:', this.token ? 'exists' : 'none');
    
    const storedUser = localStorage.getItem('user');
    // console.log('User from localStorage:', storedUser ? 'exists' : 'none');
    
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
        this.userSubject.next(this.user);
        // console.log('User parsed and set:', this.user);
      } catch (e) {
        // console.error('Error al parsear la información del usuario:', e);
        localStorage.removeItem('user');
      }
    }
    
    // Si hay un token, actualiza el estado de autenticación
    if (this.token) {
      this.isAuthenticatedSubject.next(true);
      // console.log('Authentication state set to true');
    } else {
      // console.log('Authentication state remains false');
    }
  }

  login(email: string, password: string): Observable<any> {
    // console.log('Login attempt for:', email);
    
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          // console.log('Login response received:', response);
          // console.log('Full response structure:', JSON.stringify(response));
          
          // IMPORTANTE: Estructura específica donde el token está dentro del objeto user
          if (response && response.user && response.user.token) {
            const token = response.user.token;
            const userData = response.user;
            
            // Guardar el token
            this.storeToken(token);
            // console.log('Token stored from user object');
            
            // Guardar datos del usuario (excluyendo el token del objeto para evitar duplicación)
            const { token: _, ...userWithoutToken } = userData;
            this.storeUser(userWithoutToken);
            // console.log('User info stored');
            
            this.isAuthenticatedSubject.next(true);
            // console.log('Authentication state updated to true');
          } else {
            console.warn('Response received but no token found in user object');
          }
        })
      );
  }

  logout(): void {
    // console.log('Logout called');
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    
    // console.log('Authentication state updated to false');
    // console.log('Navigating to login page');
    
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.token;
  }
  
  getUser(): User | null {
    return this.user;
  }
  
  isAuthenticated(): boolean {
    const hasToken = !!this.token;
    // console.log('isAuthenticated method called, returning:', hasToken);
    return hasToken;
  }

  private storeToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
    // console.log('Token stored in memory and localStorage');
  }
  
  private storeUser(user: User): void {
    this.user = user;
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
    // console.log('User stored in memory and localStorage:', user);
  }
}