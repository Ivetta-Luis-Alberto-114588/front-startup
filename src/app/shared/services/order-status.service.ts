// src/app/shared/services/order-status.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
     * Get all order statuses
     * Requires Bearer token authentication
     */
    getOrderStatuses(): Observable<IOrderStatusesResponse> {
        return this.http.get<IOrderStatusesResponse>(this.apiUrl);
    }

    /**
     * Get order status by ID
     */
    getOrderStatusById(id: string): Observable<IOrderStatus> {
        return this.http.get<IOrderStatus>(`${this.apiUrl}/${id}`);
    }

    /**
     * Get order status by code
     */
    getOrderStatusByCode(code: string): Observable<IOrderStatus> {
        return this.http.get<IOrderStatus>(`${this.apiUrl}/by-code/${code}`);
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
