// src/app/admin/services/admin-city.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ICity } from 'src/app/features/customers/models/icity'; // Reutilizar interfaz
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

// Interfaz para respuesta paginada (si aplica)
export interface PaginatedCitiesResponse {
  total: number;
  cities: ICity[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminCityService {

  private adminApiUrl = `${environment.apiUrl}/api/admin/cities`;

  constructor(private http: HttpClient) { }

  // GET /api/admin/cities
  getCities(pagination: PaginationDto): Observable<ICity[]> {
    // Asumiendo array directo. Ajustar si es paginado.
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<ICity[]>(this.adminApiUrl, { params });
  }

  // GET /api/admin/cities/:id
  getCityById(id: string): Observable<ICity> {
    return this.http.get<ICity>(`${this.adminApiUrl}/${id}`);
  }

  // POST /api/admin/cities
  createCity(cityData: { name: string, description: string, isActive?: boolean }): Observable<ICity> {
    return this.http.post<ICity>(this.adminApiUrl, cityData);
  }

  // PUT /api/admin/cities/:id
  updateCity(id: string, cityData: { name?: string, description?: string, isActive?: boolean }): Observable<ICity> {
    return this.http.put<ICity>(`${this.adminApiUrl}/${id}`, cityData);
  }

  // DELETE /api/admin/cities/:id
  deleteCity(id: string): Observable<ICity> { // Backend devuelve la ciudad eliminada
    return this.http.delete<ICity>(`${this.adminApiUrl}/${id}`);
  }

  // GET /api/admin/cities/by-name/:name (Opcional, si lo necesitas en admin)
  findCityByName(name: string): Observable<ICity> {
    // Asume que devuelve una sola ciudad o error 404
    return this.http.get<ICity>(`${this.adminApiUrl}/by-name/${encodeURIComponent(name)}`);
  }
}