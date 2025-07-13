// src/app/features/orders/services/order-notification.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ManualNotificationPayload {
    subject: string;
    message: string;
    emailTo?: string;
    telegramChatId?: string;
}

export interface NotificationResponse {
    success: boolean;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrderNotificationService {
    // Ruta relativa para pruebas y proxy
    private apiUrl = '/api/notifications/manual';

    constructor(private http: HttpClient) { }

    /**
     * Envía una notificación manual por email y/o Telegram usando el nuevo endpoint
     */
    sendManualNotification(payload: ManualNotificationPayload): Observable<NotificationResponse> {
        return this.http.post<NotificationResponse>(this.apiUrl, payload);
    }
}
