// src/app/features/orders/services/order-notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface OrderNotificationPayload {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: number;
    paymentMethod: string;
    paymentId?: string;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
}

export interface NotificationResponse {
    success: boolean;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrderNotificationService {
    private apiUrl = `${environment.apiUrl}/api/notifications`;

    constructor(private http: HttpClient) { }

    /**
     * Envía notificación de Telegram cuando un pago es exitoso
     */
    sendOrderPaidNotification(payload: OrderNotificationPayload): Observable<NotificationResponse> {
        return this.http.post<NotificationResponse>(`${this.apiUrl}/order-paid`, payload);
    }

    /**
     * Envía notificación de Telegram para órdenes pagadas en efectivo
     */
    sendCashOrderNotification(payload: OrderNotificationPayload): Observable<NotificationResponse> {
        return this.http.post<NotificationResponse>(`${this.apiUrl}/cash-order`, payload);
    }
}
