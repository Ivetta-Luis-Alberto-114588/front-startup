import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { INeighborhood } from '../models/ineighborhood'; // <-- Define esta interfaz

@Injectable({ providedIn: 'root' })
export class NeighborhoodService {
  private apiUrl = `${environment.apiUrl}/api/neighborhoods`;

  constructor(private http: HttpClient) { }

  getNeighborhoodsByCity(cityId: string): Observable<INeighborhood[]> {
    // Considera paginación si hay muchos barrios por ciudad
    return this.http.get<INeighborhood[]>(`${this.apiUrl}/by-city/${cityId}?limit=1000`);
  }
}