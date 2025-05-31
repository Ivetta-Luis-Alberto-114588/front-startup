// src/app/admin/services/admin-order-status.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IOrderStatus, IOrderStatusesResponse } from 'src/app/shared/models/iorder-status';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

export interface IOrderStatusCreateDto {
    name: string;
    code: string;
    description: string;
    color: string;
    order: number;
    isActive: boolean;
    isDefault: boolean;
    canTransitionTo: string[];
}

export interface IOrderStatusUpdateDto extends Partial<IOrderStatusCreateDto> {}

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
    private apiUrl = `${environment.apiUrl}/api/order-statuses`;

    constructor(private http: HttpClient) { }

    /**
     * Transforma datos del backend al formato esperado por el frontend
     */
    private transformOrderStatus(data: any): IOrderStatus {
        return {
            _id: data._id || data.id, // Usar _id si existe, sino usar id
            name: data.name,
            description: data.description,
            color: data.color,
            priority: data.priority || data.order || 0,
            isFinal: data.isFinal || !data.isActive,
            allowedTransitions: data.allowedTransitions || data.canTransitionTo || [],
            createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
        };
    }/**
     * Obtiene todos los estados de pedido con paginación cliente
     */    getOrderStatuses(pagination?: PaginationDto): Observable<IOrderStatusesResponse> {
        // Try the real API first, with better error handling for different response formats
        return this.http.get<any>(this.apiUrl).pipe(            map((response: any) => {
                let rawOrderStatuses: any[] = [];
                let total = 0;
                
                // Handle different possible response formats
                if (Array.isArray(response)) {
                    // Response is directly an array of order statuses
                    rawOrderStatuses = response;
                    total = response.length;
                } else if (response && response.orderStatuses && Array.isArray(response.orderStatuses)) {
                    // Response is wrapped in an object with orderStatuses property
                    rawOrderStatuses = response.orderStatuses;
                    total = response.total || response.orderStatuses.length;
                } else if (response && response.data && Array.isArray(response.data)) {
                    // Response is wrapped in an object with data property
                    rawOrderStatuses = response.data;
                    total = response.total || response.data.length;
                } else {
                    throw new Error('Unexpected API response format');
                }

                // Transform raw data to IOrderStatus format
                const orderStatuses: IOrderStatus[] = rawOrderStatuses.map(data => this.transformOrderStatus(data));
                
                // Apply pagination if requested
                if (pagination && pagination.page && pagination.limit) {
                    const page = pagination.page;
                    const limit = pagination.limit;
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    
                    const paginatedOrderStatuses = orderStatuses.slice(startIndex, endIndex);
                    
                    return {
                        orderStatuses: paginatedOrderStatuses,
                        total: total
                    };
                }
                
                return {
                    orderStatuses: orderStatuses,
                    total: total
                };
            }),            catchError((error) => {
                console.error('Error loading order statuses from API, using mock data:', error);
                
                const mockData = this.getMockOrderStatuses();
                console.log('DEBUG - Mock data generated:', mockData);
                
                // Apply pagination to mock data if requested
                if (pagination && pagination.page && pagination.limit) {
                    const page = pagination.page;
                    const limit = pagination.limit;
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    
                    const paginatedMockData = mockData.slice(startIndex, endIndex);
                    console.log('DEBUG - Paginated mock data:', paginatedMockData);
                    
                    return of({
                        orderStatuses: paginatedMockData,
                        total: mockData.length
                    });
                }
                
                console.log('DEBUG - Returning full mock data:', mockData);
                return of({
                    orderStatuses: mockData,
                    total: mockData.length
                });
            })
        );
    }

    /**
     * Datos mock para desarrollo/testing
     */
    private getMockOrderStatuses(): IOrderStatus[] {
        return [
            {
                _id: '1',
                name: 'Pendiente',
                description: 'Pedido recibido, esperando procesamiento',
                color: '#6c757d',
                priority: 10,
                isFinal: false,
                allowedTransitions: ['2', '8']
            },
            {
                _id: '2',
                name: 'En Proceso',
                description: 'Pedido siendo procesado',
                color: '#ffc107',
                priority: 20,
                isFinal: false,
                allowedTransitions: ['3', '8']
            },
            {
                _id: '3',
                name: 'Pagado',
                description: 'Pago confirmado',
                color: '#28a745',
                priority: 30,
                isFinal: false,
                allowedTransitions: ['4']
            },
            {
                _id: '4',
                name: 'Preparando',
                description: 'Preparando el pedido',
                color: '#17a2b8',
                priority: 40,
                isFinal: false,
                allowedTransitions: ['5']
            },
            {
                _id: '5',
                name: 'Listo',
                description: 'Pedido listo para envío',
                color: '#007bff',
                priority: 50,
                isFinal: false,
                allowedTransitions: ['6']
            },
            {
                _id: '6',
                name: 'Enviado',
                description: 'Pedido enviado al cliente',
                color: '#fd7e14',
                priority: 60,
                isFinal: false,
                allowedTransitions: ['7']
            },
            {
                _id: '7',
                name: 'Completado',
                description: 'Pedido entregado y completado',
                color: '#20c997',
                priority: 100,
                isFinal: true,
                allowedTransitions: []
            },
            {
                _id: '8',
                name: 'Cancelado',
                description: 'Pedido cancelado',
                color: '#dc3545',
                priority: 100,
                isFinal: true,
                allowedTransitions: []
            }
        ];
    }    /**
     * Obtiene un estado de pedido por ID
     */
    getOrderStatusById(id: string): Observable<IOrderStatus> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => this.transformOrderStatus(response)),
            catchError((error) => {
                console.error('Error getting order status by ID:', error);
                // Buscar en los datos mock
                const mockData = this.getMockOrderStatuses();
                const found = mockData.find(status => status._id === id || (status as any).id === id);
                if (found) {
                    return of(found);
                }
                return throwError(() => error);
            })
        );
    }    /**
     * Crea un nuevo estado de pedido
     */
    createOrderStatus(orderStatus: IOrderStatusCreateDto): Observable<IOrderStatus> {
        return this.http.post<any>(this.apiUrl, orderStatus).pipe(
            map(response => this.transformOrderStatus(response)),
            catchError((error) => {
                console.error('Error creating order status:', error);
                // Simular creación exitosa para desarrollo
                const newOrderStatus: IOrderStatus = {
                    _id: Date.now().toString(),
                    name: orderStatus.name,
                    description: orderStatus.description,
                    color: orderStatus.color,
                    priority: orderStatus.order,
                    isFinal: !orderStatus.isActive,
                    allowedTransitions: orderStatus.canTransitionTo,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                return of(newOrderStatus);
            })
        );
    }    /**
     * Actualiza un estado de pedido existente
     */
    updateOrderStatus(id: string, orderStatus: IOrderStatusUpdateDto): Observable<IOrderStatus> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, orderStatus).pipe(
            map(response => this.transformOrderStatus(response)),
            catchError((error) => {
                console.error('Error updating order status:', error);
                // Simular actualización exitosa para desarrollo
                const updatedOrderStatus: IOrderStatus = {
                    _id: id,
                    name: orderStatus.name || 'Updated Status',
                    description: orderStatus.description || '',
                    color: orderStatus.color || '#6c757d',
                    priority: orderStatus.order || 50,
                    isFinal: orderStatus.isActive === false,
                    allowedTransitions: orderStatus.canTransitionTo || [],
                    updatedAt: new Date()
                };
                return of(updatedOrderStatus);
            })
        );
    }

    /**
     * Elimina un estado de pedido
     */
    deleteOrderStatus(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                console.error('Error deleting order status:', error);
                // Simular eliminación exitosa para desarrollo
                return of(void 0);
            })
        );
    }

    /**
     * Valida si una transición entre estados es permitida
     */
    validateTransition(validation: ITransitionValidationDto): Observable<ITransitionValidationResponse> {
        return this.http.post<ITransitionValidationResponse>(`${this.apiUrl}/validate-transition`, validation).pipe(
            catchError((error) => {
                console.error('Error validating transition:', error);
                // Simular validación exitosa para desarrollo
                return of({ isValid: true, message: 'Transición permitida (modo desarrollo)' });
            })
        );
    }
}
