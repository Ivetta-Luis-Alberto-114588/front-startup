// src/app/admin/services/admin-coupon.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ICoupon } from 'src/app/shared/models/icoupon'; // Ajusta la ruta si es necesario
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

// Interfaz para la respuesta paginada (si aplica)
export interface PaginatedCouponsResponse {
  total: number;
  coupons: ICoupon[];
}

// Interfaz para los datos del formulario (puede ser parcial para update)
export interface CouponFormData {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description?: string;
  isActive?: boolean;
  validFrom?: string | null; // Usar string para el input date
  validUntil?: string | null; // Usar string para el input date
  minPurchaseAmount?: number | null;
  usageLimit?: number | null;
}


@Injectable({
  providedIn: 'root'
})
export class AdminCouponService {

  private adminApiUrl = `${environment.apiUrl}/api/admin/coupons`;

  constructor(private http: HttpClient) { }

  // GET /api/admin/coupons
  getCoupons(pagination: PaginationDto): Observable<ICoupon[]> {
    // Asumiendo array directo. Ajustar si es paginado.
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<ICoupon[]>(this.adminApiUrl, { params });
  }

  // GET /api/admin/coupons/:id
  getCouponById(id: string): Observable<ICoupon> {
    return this.http.get<ICoupon>(`${this.adminApiUrl}/${id}`);
  }

  // POST /api/admin/coupons
  createCoupon(couponData: CouponFormData): Observable<ICoupon> {
    // Asegurarse de que los campos opcionales null/undefined se manejen bien
    const payload = { ...couponData };
    if (payload.minPurchaseAmount === null) delete payload.minPurchaseAmount; // O enviar null si el backend lo prefiere
    if (payload.usageLimit === null) delete payload.usageLimit;
    if (!payload.validFrom) delete payload.validFrom; // No enviar si está vacío
    if (!payload.validUntil) delete payload.validUntil;
    return this.http.post<ICoupon>(this.adminApiUrl, payload);
  }

  // PUT /api/admin/coupons/:id
  updateCoupon(id: string, couponData: Partial<CouponFormData>): Observable<ICoupon> {
    // Asegurarse de que los campos opcionales null/undefined se manejen bien
    const payload = { ...couponData };
    if (payload.minPurchaseAmount === null) payload.minPurchaseAmount = null; // Enviar null explícitamente si se borra
    if (payload.usageLimit === null) payload.usageLimit = null;
    if (payload.validFrom === '') payload.validFrom = null; // Convertir string vacío a null
    if (payload.validUntil === '') payload.validUntil = null;
    return this.http.put<ICoupon>(`${this.adminApiUrl}/${id}`, payload);
  }

  // DELETE /api/admin/coupons/:id
  deleteCoupon(id: string): Observable<ICoupon> { // Backend devuelve el cupón eliminado
    return this.http.delete<ICoupon>(`${this.adminApiUrl}/${id}`);
  }
}