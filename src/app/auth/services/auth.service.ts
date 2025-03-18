import { Injectable } from '@angular/core';
import { Router } from "@angular/router"
import { HttpClient } from '@angular/common/http'
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/auth';
  private token: string | null = null;


  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            this.storeToken(response.token);
          }
        })
      );
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token;
  }

  private storeToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }
}
