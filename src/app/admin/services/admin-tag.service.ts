// src/app/admin/services/admin-tag.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ITag } from 'src/app/features/products/model/itag'; // Ajusta la ruta si es necesario
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

// Interfaz para la respuesta paginada (si aplica)
export interface PaginatedTagsResponse {
  total: number;
  tags: ITag[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminTagService {

  // Apuntar al endpoint de admin para tags
  private adminApiUrl = `${environment.apiUrl}/api/admin/tags`;

  constructor(private http: HttpClient) { }

  // GET /api/admin/tags
  getTags(pagination: PaginationDto): Observable<ITag[]> {
    // Asumiendo que devuelve un array. Ajusta si devuelve PaginatedTagsResponse
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<ITag[]>(this.adminApiUrl, { params });
  }

  // GET /api/admin/tags/:id
  getTagById(id: string): Observable<ITag> {
    return this.http.get<ITag>(`${this.adminApiUrl}/${id}`);
  }

  // POST /api/admin/tags
  createTag(tagData: { name: string, description?: string, isActive?: boolean }): Observable<ITag> {
    return this.http.post<ITag>(this.adminApiUrl, tagData);
  }

  // PUT /api/admin/tags/:id
  updateTag(id: string, tagData: { name?: string, description?: string | null, isActive?: boolean }): Observable<ITag> {
    // Permitir null para description si se quiere borrar
    const payload = { ...tagData };
    if (payload.description === null) {
      // Si tu backend espera un string vacío para borrar, ajusta aquí.
      // Si espera que no se envíe la clave, necesitarías filtrar el objeto.
    }
    return this.http.put<ITag>(`${this.adminApiUrl}/${id}`, payload);
  }

  // DELETE /api/admin/tags/:id
  deleteTag(id: string): Observable<ITag> { // Asumiendo que el backend devuelve el tag eliminado/desactivado
    return this.http.delete<ITag>(`${this.adminApiUrl}/${id}`);
  }
}