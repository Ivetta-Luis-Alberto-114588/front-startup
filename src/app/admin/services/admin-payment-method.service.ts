// src/app/admin/services/admin-payment-method.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPaymentMethod, IPaymentMethodCreateDto, IPaymentMethodUpdateDto, PaymentMethodFormData, PaginatedPaymentMethodsResponse } from 'src/app/shared/models/ipayment-method';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { AuthService } from 'src/app/auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdminPaymentMethodService {

    private adminApiUrl = `${environment.apiUrl}/api/payment-methods`;

    constructor(private http: HttpClient, private authService: AuthService) { }    /**
     * Obtiene lista paginada de métodos de pago (admin)
     * GET /api/payment-methods
     */    getPaymentMethods(pagination: PaginationDto): Observable<PaginatedPaymentMethodsResponse> {
        let params = new HttpParams()
            .set('page', pagination.page.toString())
            .set('limit', pagination.limit.toString());
        
        return this.http.get<PaginatedPaymentMethodsResponse>(this.adminApiUrl, { params });
    }/**
     * Obtiene un método de pago por ID (admin)
     * GET /api/payment-methods/:id
     */
    getPaymentMethodById(id: string): Observable<IPaymentMethod> {
        return this.http.get<IPaymentMethod>(`${this.adminApiUrl}/${id}`);
    }

    /**
     * Crea un nuevo método de pago (admin)
     * POST /api/payment-methods
     */    createPaymentMethod(paymentMethodData: PaymentMethodFormData): Observable<IPaymentMethod> {
        const payload: IPaymentMethodCreateDto = {
            name: paymentMethodData.name,
            code: paymentMethodData.code,
            description: paymentMethodData.description,
            isActive: paymentMethodData.isActive
        };
        return this.http.post<IPaymentMethod>(this.adminApiUrl, payload);
    }/**
     * Actualiza un método de pago existente (admin)
     * PUT /api/payment-methods/:id
     */    updatePaymentMethod(id: string, paymentMethodData: Partial<PaymentMethodFormData>): Observable<IPaymentMethod> {
        const payload: IPaymentMethodUpdateDto = {};
        
        if (paymentMethodData.name !== undefined) payload.name = paymentMethodData.name;
        if (paymentMethodData.code !== undefined) payload.code = paymentMethodData.code;
        if (paymentMethodData.description !== undefined) payload.description = paymentMethodData.description;
        if (paymentMethodData.isActive !== undefined) payload.isActive = paymentMethodData.isActive;

        return this.http.put<IPaymentMethod>(`${this.adminApiUrl}/${id}`, payload);
    }

    /**
     * Elimina un método de pago (admin)
     * DELETE /api/payment-methods/:id
     */
    deletePaymentMethod(id: string): Observable<IPaymentMethod> {
        return this.http.delete<IPaymentMethod>(`${this.adminApiUrl}/${id}`);
    }
}
