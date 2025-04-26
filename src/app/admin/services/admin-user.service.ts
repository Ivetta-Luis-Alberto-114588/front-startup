// src/app/admin/services/admin-user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IUser } from 'src/app/shared/models/iuser'; // Reutiliza la interfaz IUser
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto'; // Si necesitas paginación

// Interfaz para la respuesta paginada (si la API la usa)
export interface PaginatedAdminUsersResponse {
  total: number;
  users: IUser[];
}

// Interfaz para actualizar usuario (principalmente roles)
export interface UpdateAdminUserData {
  name?: string; // Quizás permitir editar nombre
  // NO incluir email ni password aquí
  roles?: string[]; // Array de roles ('USER_ROLE', 'ADMIN_ROLE')
  isActive?: boolean; // ¿Permitir desactivar cuenta de usuario? (Considerar implicaciones)
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {

  private adminApiUrl = `${environment.apiUrl}/api/admin/users`; // Endpoint de admin para usuarios

  constructor(private http: HttpClient) { }

  /**
   * Obtiene una lista paginada de todos los usuarios registrados (admin).
   * GET /api/admin/users
   */
  getUsers(pagination: PaginationDto): Observable<PaginatedAdminUsersResponse[]> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<PaginatedAdminUsersResponse[]>(this.adminApiUrl, { params });
  }

  /**
   * Obtiene los detalles de un usuario específico por su ID (admin).
   * GET /api/admin/users/:id  <-- VERIFICA SI ESTE ENDPOINT EXISTE EN TU BACKEND
   * Si no existe, quizás no necesites este método o debas obtener todos y filtrar.
   */
  getUserById(id: string): Observable<IUser> {
    // Asegúrate que este endpoint exista y devuelva un solo usuario
    return this.http.get<IUser>(`${this.adminApiUrl}/${id}`);
  }

  /**
   * Actualiza datos de un usuario, principalmente roles (admin).
   * PUT /api/admin/users/:id
   * @param id ID del usuario a actualizar.
   * @param userData Objeto con los campos a modificar (roles, name, isActive?).
   */
  updateUser(id: string, userData: UpdateAdminUserData): Observable<IUser> {
    return this.http.put<IUser>(`${this.adminApiUrl}/${id}`, userData);
  }

  /**
   * Elimina una cuenta de usuario (admin). ¡OPERACIÓN PELIGROSA!
   * DELETE /api/admin/users/:id
   * Considera si realmente quieres permitir esto o solo desactivar.
   * @returns Observable con el usuario eliminado (o void).
   */
  deleteUser(id: string): Observable<IUser> { // O Observable<void>
    return this.http.delete<IUser>(`${this.adminApiUrl}/${id}`);
  }
}