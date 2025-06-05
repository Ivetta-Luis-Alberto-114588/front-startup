// src/app/shared/services/order-status.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IOrderStatus } from '../models/iorder-status';
import { IOrderStatusesResponse } from '../models/iorder-status';

@Injectable({
    providedIn: 'root'
})
export class OrderStatusService {
    private apiUrl = `${environment.apiUrl}/api/order-statuses`;

    constructor(private http: HttpClient) { }

    /**
     * Transform backend data to frontend format
     * Maps 'id' field from backend to '_id' field expected by frontend
     */
    private transformBackendToFrontend(data: any): IOrderStatus {
        return {
            _id: data._id || data.id, // Map backend 'id' to frontend '_id'
            name: data.name,
            code: data.code,
            description: data.description,
            color: data.color,
            priority: data.order || data.priority,
            isActive: data.isActive,
            isDefault: data.isDefault,
            isFinal: data.canTransitionTo ? data.canTransitionTo.length === 0 : true,
            allowedTransitions: data.canTransitionTo || [],
            createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
        };
    }

    /**
     * Get all order statuses
     * Requires Bearer token authentication
     */
    getOrderStatuses(): Observable<IOrderStatusesResponse> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                // Transform the response to ensure proper field mapping
                const orderStatuses = response.orderStatuses.map((item: any) => this.transformBackendToFrontend(item));
                return {
                    total: response.total,
                    orderStatuses
                };
            })
        );
    }

    /**
     * Get order status by ID
     */
    getOrderStatusById(id: string): Observable<IOrderStatus> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => this.transformBackendToFrontend(response))
        );
    }

    /**
     * Get order status by code
     */
    getOrderStatusByCode(code: string): Observable<IOrderStatus> {
        return this.http.get<any>(`${this.apiUrl}/by-code/${code}`).pipe(
            map(response => this.transformBackendToFrontend(response))
        );
    }

    /**
     * Get icon for status code
     */
    getStatusIcon(statusCode: string): string {
        const iconMap: { [key: string]: string } = {
            'PENDING': 'bi bi-clock text-warning',
            'PROCESSING': 'bi bi-gear text-info',
            'PAID': 'bi bi-check-circle text-success',
            'PREPARING': 'bi bi-tools text-primary',
            'READY': 'bi bi-box text-primary',
            'SHIPPED': 'bi bi-truck text-info',
            'COMPLETED': 'bi bi-check-circle-fill text-success',
            'CANCELLED': 'bi bi-x-circle text-danger'
        };
        return iconMap[statusCode] || 'bi bi-question-circle text-muted';
    }
}
