// src/app/admin/services/admin-category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ICategory } from 'src/app/features/products/model/icategory'; // Reutilizar interfaz
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { RoleService } from 'src/app/shared/services/role.service';

// Interfaz para la respuesta paginada (si tu API la devuelve así)
// Si tu API devuelve directamente ICategory[], puedes omitir esto.
export interface PaginatedCategoriesResponse {
    total: number;
    categories: ICategory[];
}

@Injectable({
    providedIn: 'root' // Proveer en root o en AdminModule si prefieres
})
export class AdminCategoryService {

    // Apuntar al endpoint de admin
    private adminApiUrl = `${environment.apiUrl}/api/admin/categories`;

    constructor(
        private http: HttpClient,
        private roleService: RoleService
    ) { }

    // GET /api/admin/categories
    getCategories(pagination: PaginationDto): Observable<ICategory[]> {
        // Asumiendo que el endpoint de admin devuelve directamente un array
        // Si devuelve un objeto paginado, ajusta el tipo de retorno y usa map()
        let params = new HttpParams()
            .set('page', pagination.page.toString())
            .set('limit', pagination.limit.toString());
        return this.http.get<ICategory[]>(this.adminApiUrl, { params });
    }

    // GET /api/admin/categories/:id
    getCategoryById(id: string): Observable<ICategory> {
        return this.http.get<ICategory>(`${this.adminApiUrl}/${id}`);
    }

    // POST /api/admin/categories
    createCategory(categoryData: { name: string, description: string, isActive?: boolean }): Observable<ICategory> {
        return this.http.post<ICategory>(this.adminApiUrl, categoryData);
    }

    // PUT /api/admin/categories/:id
    updateCategory(id: string, categoryData: { name?: string, description?: string, isActive?: boolean }): Observable<ICategory> {
        return this.roleService.canUpdate().pipe(
            switchMap((canUpdate: boolean) => {
                if (!canUpdate) {
                    return throwError(() => new Error('No tienes permisos para actualizar categorías'));
                }
                return this.http.put<ICategory>(`${this.adminApiUrl}/${id}`, categoryData);
            })
        );
    }

    // DELETE /api/admin/categories/:id
    deleteCategory(id: string): Observable<ICategory> { // El backend devuelve la categoría eliminada
        return this.roleService.canDelete().pipe(
            switchMap(canDelete => {
                if (!canDelete) {
                    return throwError(() => new Error('No tienes permisos para eliminar categorías. Solo los Super Administradores pueden realizar esta acción.'));
                }

                return this.http.delete<ICategory>(`${this.adminApiUrl}/${id}`);
            })
        );
    }
}