// src/app/admin/services/admin-order-status.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IOrderStatus, IOrderStatusesResponse } from 'src/app/shared/models/iorder-status';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { RoleService } from 'src/app/shared/services/role.service';

export interface IOrderStatusCreateDto {
    name: string;
    code: string; // Asegúrate que el backend espera 'code'
    description?: string;
    color: string;
    order: number; // El backend espera 'order'
    isActive: boolean;
    isDefault: boolean;
    canTransitionTo: string[]; // Array de IDs
}

export interface IOrderStatusUpdateDto extends Partial<IOrderStatusCreateDto> {
    // No necesita cambios si IOrderStatusCreateDto es el superconjunto
}

export interface ITransitionValidationDto {
    fromStatusId: string;
    toStatusId: string;
}

export interface ITransitionValidationResponse {
    isValid: boolean;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminOrderStatusService {
    // CORREGIDO: Usar la misma ruta que funciona para otros servicios
    private adminApiUrl = `${environment.apiUrl}/api/order-statuses`;
    private publicApiUrl = `${environment.apiUrl}/api/order-statuses`; // Para GET públicos

    constructor(
        private http: HttpClient,
        private roleService: RoleService
    ) { }

    private transformBackendToFrontend(data: any): IOrderStatus {
        return {
            _id: data._id || data.id,
            name: data.name,
            code: data.code, // Asumir que el backend envía 'code'
            description: data.description,
            color: data.color,
            priority: data.order, // Mapear 'order' del backend a 'priority' del frontend
            isActive: data.isActive,
            isDefault: data.isDefault,
            // isFinal se calcula o viene del backend. Si no viene, podrías calcularlo:
            isFinal: data.canTransitionTo ? data.canTransitionTo.length === 0 : true,
            allowedTransitions: data.canTransitionTo || [],
            createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
        };
    }

    private transformFrontendToBackend(frontendData: Partial<IOrderStatusCreateDto> | Partial<IOrderStatusUpdateDto>): any {
        const backendData: any = { ...frontendData };
        if (frontendData.order !== undefined) { // 'order' es 'priority' en el frontend
            backendData.order = frontendData.order;
        }
        // Eliminar 'priority' si se envió desde el frontend y no es esperado por el backend
        delete backendData.priority;
        delete backendData.isFinal; // isFinal no se envía, se calcula o lo maneja el backend
        return backendData;
    }


    getOrderStatuses(pagination?: PaginationDto): Observable<IOrderStatusesResponse> {
        let params = new HttpParams();
        if (pagination) {
            params = params.set('page', pagination.page.toString());
            params = params.set('limit', pagination.limit.toString());
        }
        // Usar publicApiUrl para obtener todos los estados (usualmente una ruta pública)
        return this.http.get<any>(`${this.publicApiUrl}`, { params }).pipe(
            map(response => {
                // Asumimos que el backend devuelve { total: number, orderStatuses: any[] }
                const orderStatuses = response.orderStatuses.map((item: any) => this.transformBackendToFrontend(item));
                return {
                    total: response.total,
                    orderStatuses
                };
            }),
            catchError(this.handleError)
        );
    }

    getOrderStatusById(id: string): Observable<IOrderStatus> {
        // Puede ser público o admin dependiendo de tu lógica
        return this.http.get<any>(`${this.publicApiUrl}/${id}`).pipe(
            map(response => this.transformBackendToFrontend(response)),
            catchError(this.handleError)
        );
    }

    createOrderStatus(orderStatusData: IOrderStatusCreateDto): Observable<IOrderStatus> {
        const payload = this.transformFrontendToBackend(orderStatusData);
        return this.http.post<any>(this.adminApiUrl, payload).pipe( // Ruta de admin para crear
            map(response => this.transformBackendToFrontend(response)),
            catchError(this.handleError)
        );
    }

    updateOrderStatus(id: string, orderStatusData: IOrderStatusUpdateDto): Observable<IOrderStatus> {
        return this.roleService.canUpdate().pipe(
            switchMap((canUpdate: boolean) => {
                if (!canUpdate) {
                    return throwError(() => new Error('No tienes permisos para actualizar estados de orden'));
                }
                const payload = this.transformFrontendToBackend(orderStatusData);
                return this.http.put<any>(`${this.adminApiUrl}/${id}`, payload).pipe( // Ruta de admin para actualizar
                    map(response => this.transformBackendToFrontend(response)),
                    catchError(this.handleError)
                );
            })
        );
    }

    deleteOrderStatus(id: string): Observable<IOrderStatus> { // El backend devuelve el objeto eliminado
        return this.roleService.canDelete().pipe(
            switchMap(canDelete => {
                if (!canDelete) {
                    return throwError(() => new Error('No tienes permisos para eliminar estados de orden. Solo los Super Administradores pueden realizar esta acción.'));
                }

                return this.http.delete<any>(`${this.adminApiUrl}/${id}`).pipe( // Ruta de admin para eliminar
                    map(response => this.transformBackendToFrontend(response)), // Asumiendo que el backend lo devuelve
                    catchError(this.handleError)
                );
            })
        );
    }

    validateTransition(validation: ITransitionValidationDto): Observable<ITransitionValidationResponse> {
        // Esta ruta podría ser pública o de admin
        return this.http.post<ITransitionValidationResponse>(`${this.publicApiUrl}/validate-transition`, validation).pipe(
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        console.error('API Error:', error);
        return throwError(() => new Error(error.error?.error || error.message || 'Error desconocido del servidor'));
    }
}