// src/app/admin/services/admin-neighborhood.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { INeighborhood } from 'src/app/features/customers/models/ineighborhood'; // Reutilizar interfaz
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

// Interfaz para respuesta paginada (si aplica)
export interface PaginatedNeighborhoodsResponse {
  total: number;
  neighborhoods: INeighborhood[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminNeighborhoodService {

  private adminApiUrl = `${environment.apiUrl}/api/admin/neighborhoods`;

  constructor(private http: HttpClient) { }

  // GET /api/admin/neighborhoods
  getNeighborhoods(pagination: PaginationDto): Observable<INeighborhood[]> {
    // Asumiendo array directo. Ajustar si es paginado.
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<INeighborhood[]>(this.adminApiUrl, { params });
  }

  // GET /api/admin/neighborhoods/:id
  getNeighborhoodById(id: string): Observable<INeighborhood> {
    return this.http.get<INeighborhood>(`${this.adminApiUrl}/${id}`);
  }

  // POST /api/admin/neighborhoods
  createNeighborhood(neighborhoodData: { name: string, description: string, cityId: string, isActive?: boolean }): Observable<INeighborhood> {
    // Renombrar cityId a city para que coincida con el backend DTO
    const payload = {
      name: neighborhoodData.name,
      description: neighborhoodData.description,
      city: neighborhoodData.cityId, // <-- Cambio de nombre
      isActive: neighborhoodData.isActive
    };
    return this.http.post<INeighborhood>(this.adminApiUrl, payload);
  }

  // PUT /api/admin/neighborhoods/:id
  updateNeighborhood(id: string, neighborhoodData: { name?: string, description?: string, cityId?: string, isActive?: boolean }): Observable<INeighborhood> {
    // Renombrar cityId a city si se envía
    const payload: any = { ...neighborhoodData };
    if (payload.cityId) {
      payload.city = payload.cityId;
      delete payload.cityId;
    }
    return this.http.put<INeighborhood>(`${this.adminApiUrl}/${id}`, payload);
  }

  // DELETE /api/admin/neighborhoods/:id
  deleteNeighborhood(id: string): Observable<INeighborhood> { // Backend devuelve el barrio eliminado
    return this.http.delete<INeighborhood>(`${this.adminApiUrl}/${id}`);
  }

  // GET /api/admin/neighborhoods/by-city/:cityId (Opcional)
  getNeighborhoodsByCity(cityId: string, pagination: PaginationDto): Observable<INeighborhood[]> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<INeighborhood[]>(`${this.adminApiUrl}/by-city/${cityId}`, { params });
  }
}