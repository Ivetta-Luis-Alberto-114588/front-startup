import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ICity } from '../models/icity'; // <-- Define esta interfaz

@Injectable({ providedIn: 'root' })
export class CityService {
  private apiUrl = `${environment.apiUrl}/api/cities`;

  constructor(private http: HttpClient) { }

  getCities(): Observable<ICity[]> {
    // Considera añadir paginación si hay muchas ciudades
    return this.http.get<ICity[]>(`${this.apiUrl}?limit=1000`); // Pide muchas para simular "todas"
  }
}