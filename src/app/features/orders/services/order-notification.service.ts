// src/app/features/orders/services/order-notification.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
    // URL completa del endpoint de notificaciones para bypass del proxy
    private apiUrl = 'https://sistema-mongo.onrender.com/api/notifications/manual';

    constructor(private http: HttpClient) { }

    /**
     * Envía una notificación manual por email y/o Telegram usando el nuevo endpoint
     */
    sendManualNotification(payload: ManualNotificationPayload): Observable<NotificationResponse> {
        console.log('🔔 Enviando notificación manual con payload:', payload);
        console.log('🔔 URL de destino:', this.apiUrl);

        return this.http.post<NotificationResponse>(this.apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).pipe(
            tap((response: NotificationResponse) => {
                console.log('🔔 Respuesta del servidor de notificaciones:', response);
            }),
            catchError((error: any) => {
                console.error('🔔 Error al enviar notificación:', error);
                console.error('🔔 Status:', error.status);
                console.error('🔔 Message:', error.message);
                console.error('🔔 Error body:', error.error);
                return throwError(() => error);
            })
        );
    }
}
