// src/app/admin/services/admin-unit.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IUnit } from 'src/app/features/products/model/iunit'; // Reutilizar interfaz
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

// Interfaz para la respuesta paginada (si tu API la devuelve así)
// Si tu API devuelve directamente IUnit[], puedes omitir esto.
export interface PaginatedUnitsResponse {
  total: number;
  units: IUnit[];
}

@Injectable({
  // Proveer en 'root' es generalmente preferible para servicios singleton
  // Si lo generaste con --module admin, puedes dejarlo así o cambiarlo a 'root'
  providedIn: 'root'
})
export class AdminUnitService {

  // Apuntar al endpoint de admin para unidades
  private adminApiUrl = `${environment.apiUrl}/api/admin/units`;

  constructor(private http: HttpClient) { }

  // GET /api/admin/units
  getUnits(pagination: PaginationDto): Observable<IUnit[]> {
    // Asumiendo que el endpoint de admin devuelve directamente un array
    // Si devuelve un objeto paginado, ajusta el tipo de retorno y usa map()
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    // Ajusta la URL si tu endpoint de admin para listar es diferente (ej: /api/admin/units/all)
    return this.http.get<IUnit[]>(this.adminApiUrl, { params });
  }

  // GET /api/admin/units/:id
  getUnitById(id: string): Observable<IUnit> {
    return this.http.get<IUnit>(`${this.adminApiUrl}/${id}`);
  }

  // POST /api/admin/units
  createUnit(unitData: { name: string, description: string, isActive?: boolean }): Observable<IUnit> {
    return this.http.post<IUnit>(this.adminApiUrl, unitData);
  }

  // PUT /api/admin/units/:id
  updateUnit(id: string, unitData: { name?: string, description?: string, isActive?: boolean }): Observable<IUnit> {
    return this.http.put<IUnit>(`${this.adminApiUrl}/${id}`, unitData);
  }

  // DELETE /api/admin/units/:id
  deleteUnit(id: string): Observable<IUnit> { // El backend devuelve la unidad eliminada
    return this.http.delete<IUnit>(`${this.adminApiUrl}/${id}`);
  }
}