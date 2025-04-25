// src/app/admin/pages/coupon-form/coupon-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { formatDate } from '@angular/common'; // Para formatear fechas

import { AdminCouponService, CouponFormData } from '../../services/admin-coupon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ICoupon, DiscountType } from 'src/app/shared/models/icoupon'; // Ajusta la ruta

// Validador personalizado para fechas
export const dateOrderValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const formGroup = control as FormGroup; // Castear a FormGroup
  const validFrom = formGroup.get('validFrom')?.value;
  const validUntil = formGroup.get('validUntil')?.value;

  if (validFrom && validUntil && new Date(validFrom) > new Date(validUntil)) {
    return { dateOrder: true }; // Error si 'from' es posterior a 'until'
  }
  return null;
};

// Validador personalizado para porcentaje máximo
export const percentageMaxValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const formGroup = control as FormGroup;
  const discountType = formGroup.get('discountType')?.value;
  const discountValue = formGroup.get('discountValue')?.value;

  if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
    return { percentageMax: true };
  }
  return null;
};


@Component({
  selector: 'app-coupon-form',
  templateUrl: './coupon-form.component.html',
  styleUrls: ['./coupon-form.component.scss']
})
export class CouponFormComponent implements OnInit, OnDestroy {

  couponForm: FormGroup;
  isEditMode = false;
  couponId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminCouponService: AdminCouponService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      discountType: [null, [Validators.required]],
      discountValue: [null, [Validators.required, Validators.min(0.01)]],
      description: [''],
      isActive: [true],
      validFrom: [null],
      validUntil: [null],
      minPurchaseAmount: [null, [Validators.min(0)]],
      // Validar que sea entero no negativo si se ingresa algo
      usageLimit: [null, [Validators.min(0), Validators.pattern("^[0-9]*$")]]
    }, {
      validators: [dateOrderValidator, percentageMaxValidator] // Añadir validadores a nivel de grupo
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.couponId = params.get('id');
      this.isEditMode = !!this.couponId;

      if (this.isEditMode && this.couponId) {
        this.loadCouponData(this.couponId);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadCouponData(id: string): void {
    this.adminCouponService.getCouponById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (coupon) => {
          // Formatear fechas para los inputs type="date" (YYYY-MM-DD)
          const formattedCoupon = {
            ...coupon,
            validFrom: coupon.validFrom ? formatDate(coupon.validFrom, 'yyyy-MM-dd', 'en-US') : null,
            validUntil: coupon.validUntil ? formatDate(coupon.validUntil, 'yyyy-MM-dd', 'en-US') : null,
            // Convertir null a string vacío para los inputs numéricos opcionales si es necesario
            minPurchaseAmount: coupon.minPurchaseAmount ?? '',
            usageLimit: coupon.usageLimit ?? ''
          };
          this.couponForm.patchValue(formattedCoupon);
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar el cupón (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? "Unknown error", 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/coupons']);
          }
        }
      });
  }

  onSubmit(): void {
    if (this.couponForm.invalid || this.isSubmitting) {
      this.couponForm.markAllAsTouched();
      // Mostrar errores específicos si es necesario
      if (this.couponForm.hasError('dateOrder')) {
        this.notificationService.showWarning('La fecha "Válido Hasta" debe ser posterior o igual a "Válido Desde".', 'Fechas Inválidas');
      }
      if (this.couponForm.hasError('percentageMax')) {
        this.notificationService.showWarning('El descuento porcentual no puede exceder 100%.', 'Valor Inválido');
      }
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    // Preparar datos para enviar (convertir strings vacíos a null para opcionales)
    const formData: CouponFormData = {
      ...this.couponForm.value,
      code: this.couponForm.value.code.toUpperCase().trim(),
      minPurchaseAmount: this.couponForm.value.minPurchaseAmount === '' ? null : Number(this.couponForm.value.minPurchaseAmount),
      usageLimit: this.couponForm.value.usageLimit === '' ? null : Number(this.couponForm.value.usageLimit),
      validFrom: this.couponForm.value.validFrom || null, // Enviar null si está vacío
      validUntil: this.couponForm.value.validUntil || null // Enviar null si está vacío
    };


    let action$: Observable<ICoupon>;

    if (this.isEditMode && this.couponId) {
      action$ = this.adminCouponService.updateCoupon(this.couponId, formData);
    } else {
      action$ = this.adminCouponService.createCoupon(formData);
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedCoupon) => {
          const message = this.isEditMode
            ? `Cupón "${savedCoupon.code}" actualizado.`
            : `Cupón "${savedCoupon.code}" creado.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/coupons']);
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} el cupón. Intente de nuevo.`;
          }
          this.notificationService.showError(this.error ?? "Unknown error", 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/coupons']);
  }

  // Getters
  get code() { return this.couponForm.get('code'); }
  get discountType() { return this.couponForm.get('discountType'); }
  get discountValue() { return this.couponForm.get('discountValue'); }
  get description() { return this.couponForm.get('description'); }
  get isActive() { return this.couponForm.get('isActive'); }
  get validFrom() { return this.couponForm.get('validFrom'); }
  get validUntil() { return this.couponForm.get('validUntil'); }
  get minPurchaseAmount() { return this.couponForm.get('minPurchaseAmount'); }
  get usageLimit() { return this.couponForm.get('usageLimit'); }
}