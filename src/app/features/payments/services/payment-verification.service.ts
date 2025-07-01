// src/app/features/payments/services/payment-verification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PaymentVerificationResponse {
    paymentId: string;
    status: 'approved' | 'pending' | 'rejected' | 'cancelled';
    transactionAmount: number;
    externalReference: string;
    paymentMethodId: string;
    dateApproved?: string;
    payer: {
        email: string;
    };
}

export interface OrderStatusResponse {
    saleId: string; // Cambiado de orderId a saleId para ser más preciso
    status: string;
    total: number;
    customerEmail?: string;
    paymentMethod?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentVerificationService {
    private apiUrl = `${environment.apiUrl}/api/payments`;
    private ordersApiUrl = `${environment.apiUrl}/api/sales`;

    constructor(private http: HttpClient) { }

    /**
     * Verifica el estado de un pago en MercadoPago
     */
    verifyPaymentStatus(paymentId: string): Observable<PaymentVerificationResponse> {
        return this.http.get<PaymentVerificationResponse>(`${this.apiUrl}/${paymentId}`);
    }

    /**
     * Verifica el estado de un pago por orden
     */
    verifyPaymentByOrder(orderId: string): Observable<PaymentVerificationResponse> {
        return this.http.get<PaymentVerificationResponse>(`${this.apiUrl}/by-order/${orderId}`);
    }

    /**
     * Verifica el estado de una venta por su ID
     */
    verifyOrderStatus(orderId: string): Observable<OrderStatusResponse> {
        return this.http.get<OrderStatusResponse>(`${this.ordersApiUrl}/${orderId}`);
    }
}
