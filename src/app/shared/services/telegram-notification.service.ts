import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TelegramNotificationRequest {
    message: string;
}

export interface TelegramNotificationResponse {
    success: boolean;
    message?: string;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TelegramNotificationService {

    private readonly telegramApiUrl = `${environment.apiUrl}/api/admin/telegram/send-notification`;

    constructor(private http: HttpClient) { }

    /**
     * Envía cualquier mensaje a Telegram
     * @param message El mensaje que quieras enviar (con el formato que quieras)
     * @returns Promise con la respuesta del servidor
     */
    async sendMessage(message: string): Promise<TelegramNotificationResponse> {
        try {
            const payload: TelegramNotificationRequest = {
                message: message
            };

            // Obtener el token del localStorage
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Token de autenticación no encontrado. Se requiere rol ADMIN_ROLE.');
            }

            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            });

            const response = await this.http.post<TelegramNotificationResponse>(
                this.telegramApiUrl,
                payload,
                { headers }
            ).toPromise();

            return response || { success: false, error: 'No se recibió respuesta del servidor' };

        } catch (error: any) {
            console.error('Error enviando mensaje a Telegram:', error);
            return {
                success: false,
                error: error.message || 'Error desconocido al enviar mensaje'
            };
        }
    }

    /**
     * Método alternativo que devuelve Observable (para quien prefiera usarlo así)
     */
    sendMessageObservable(message: string): Observable<TelegramNotificationResponse> {
        const payload: TelegramNotificationRequest = {
            message: message
        };

        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Token de autenticación no encontrado. Se requiere rol ADMIN_ROLE.');
        }

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });

        return this.http.post<TelegramNotificationResponse>(
            this.telegramApiUrl,
            payload,
            { headers }
        );
    }
}
