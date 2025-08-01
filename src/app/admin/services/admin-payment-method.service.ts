// src/app/admin/services/admin-payment-method.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPaymentMethod, IPaymentMethodCreateDto, IPaymentMethodUpdateDto, PaymentMethodFormData, PaginatedPaymentMethodsResponse } from 'src/app/shared/models/ipayment-method';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { AuthService } from 'src/app/auth/services/auth.service';
import { RoleService } from 'src/app/shared/services/role.service';

@Injectable({
    providedIn: 'root'
})
export class AdminPaymentMethodService {

    private adminApiUrl = `${environment.apiUrl}/api/payment-methods`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private roleService: RoleService
    ) { }

    /**
     * Obtiene lista paginada de métodos de pago (admin)
     * GET /api/payment-methods
     */
    getPaymentMethods(pagination: PaginationDto): Observable<PaginatedPaymentMethodsResponse> {
        let params = new HttpParams()
            .set('page', pagination.page.toString())
            .set('limit', pagination.limit.toString());

        return this.http.get<PaginatedPaymentMethodsResponse>(this.adminApiUrl, { params });
    }

    /**
     * Obtiene un método de pago por ID (admin)
     * GET /api/payment-methods/:id
     */
    getPaymentMethodById(id: string): Observable<IPaymentMethod> {
        return this.http.get<IPaymentMethod>(`${this.adminApiUrl}/${id}`);
    }

    /**
     * Crea un nuevo método de pago (admin)
     * POST /api/payment-methods
     */
    createPaymentMethod(paymentMethodData: PaymentMethodFormData): Observable<IPaymentMethod> {
        const payload: IPaymentMethodCreateDto = {
            name: paymentMethodData.name.trim(),
            code: paymentMethodData.code.trim().toUpperCase(),
            description: paymentMethodData.description.trim(),
            isActive: Boolean(paymentMethodData.isActive ?? true),
            defaultOrderStatusId: paymentMethodData.defaultOrderStatusId,
            requiresOnlinePayment: Boolean(paymentMethodData.requiresOnlinePayment)
        };

        return this.http.post<IPaymentMethod>(this.adminApiUrl, payload).pipe(
            catchError(error => {
                console.error('❌ Error creating payment method:');
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                console.error('Error response:', error.error);
                console.error('Full error object:', error);
                throw error;
            })
        );
    }

    /**
     * Actualiza un método de pago existente (admin)
     * PUT /api/payment-methods/:id
     */
    updatePaymentMethod(id: string, paymentMethodData: Partial<PaymentMethodFormData>): Observable<IPaymentMethod> {
        return this.roleService.canUpdate().pipe(
            switchMap((canUpdate: boolean) => {
                if (!canUpdate) {
                    return throwError(() => new Error('No tienes permisos para actualizar métodos de pago'));
                }
                const payload: IPaymentMethodUpdateDto = {};

                if (paymentMethodData.name !== undefined) payload.name = paymentMethodData.name.trim();
                if (paymentMethodData.code !== undefined) payload.code = paymentMethodData.code.trim().toUpperCase();
                if (paymentMethodData.description !== undefined) payload.description = paymentMethodData.description.trim();
                if (paymentMethodData.isActive !== undefined) payload.isActive = paymentMethodData.isActive;
                if (paymentMethodData.defaultOrderStatusId !== undefined) payload.defaultOrderStatusId = paymentMethodData.defaultOrderStatusId;
                if (paymentMethodData.requiresOnlinePayment !== undefined) payload.requiresOnlinePayment = paymentMethodData.requiresOnlinePayment;

                console.log('Updating payment method with payload:', payload);

                return this.http.put<IPaymentMethod>(`${this.adminApiUrl}/${id}`, payload).pipe(
                    tap(response => console.log('Payment method updated successfully:', response))
                );
            })
        );
    }

    /**
     * Elimina un método de pago (admin)
     * DELETE /api/payment-methods/:id
     */
    deletePaymentMethod(id: string): Observable<IPaymentMethod> {
        return this.roleService.canDelete().pipe(
            switchMap(canDelete => {
                if (!canDelete) {
                    return throwError(() => new Error('No tienes permisos para eliminar métodos de pago. Solo los Super Administradores pueden realizar esta acción.'));
                }

                return this.http.delete<IPaymentMethod>(`${this.adminApiUrl}/${id}`);
            })
        );
    }
}
