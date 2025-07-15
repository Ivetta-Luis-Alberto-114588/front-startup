import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PublicOrderResponse } from '../models/order-public.interface';

@Injectable({
    providedIn: 'root'
})
export class OrderInquiryService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /**
     * Consulta una orden específica por su ID
     * Este endpoint NO requiere autenticación para permitir consultas de invitados
     * @param orderId ID de la orden a consultar
     * @returns Observable con los datos de la orden
     */
    getOrderById(orderId: string): Observable<PublicOrderResponse> {
        const url = `${this.apiUrl}/api/orders/${orderId}`;

        return this.http.get<PublicOrderResponse>(url).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Manejo centralizado de errores
     * @param error Error HTTP
     * @returns Observable con error
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Ha ocurrido un error inesperado';

        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Error del lado del servidor
            switch (error.status) {
                case 404:
                    errorMessage = 'Orden no encontrada';
                    break;
                case 403:
                    errorMessage = 'No tienes permisos para ver esta orden';
                    break;
                case 500:
                    errorMessage = 'Error interno del servidor';
                    break;
                default:
                    errorMessage = `Error ${error.status}: ${error.message}`;
            }
        }

        return throwError(() => new Error(errorMessage));
    }
}
