import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminPaymentMethodService } from '../../services/admin-payment-method.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { IPaymentMethod } from 'src/app/shared/models/ipayment-method';

@Component({
  selector: 'app-payment-method-form',
  templateUrl: './payment-method-form.component.html',
  styleUrls: ['./payment-method-form.component.scss']
})
export class PaymentMethodFormComponent implements OnInit, OnDestroy {

  paymentMethodForm: FormGroup;
  isEditMode = false;
  paymentMethodId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminPaymentMethodService: AdminPaymentMethodService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.paymentMethodForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      description: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.paymentMethodId = params.get('id');
      this.isEditMode = !!this.paymentMethodId;

      if (this.isEditMode && this.paymentMethodId) {
        this.loadPaymentMethodData(this.paymentMethodId);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadPaymentMethodData(id: string): void {
    this.adminPaymentMethodService.getPaymentMethodById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (paymentMethod) => {
          this.paymentMethodForm.patchValue(paymentMethod);
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar el método de pago (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/payment-methods']);
          }
        }
      });
  }

  onSubmit(): void {
    if (this.paymentMethodForm.invalid || this.isSubmitting) {
      this.paymentMethodForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const formData = this.paymentMethodForm.value;

    let action$: Observable<IPaymentMethod>;

    if (this.isEditMode && this.paymentMethodId) {
      action$ = this.adminPaymentMethodService.updatePaymentMethod(this.paymentMethodId, formData);
    } else {
      action$ = this.adminPaymentMethodService.createPaymentMethod(formData);
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedPaymentMethod) => {
          const message = this.isEditMode
            ? `Método de pago "${savedPaymentMethod.name}" actualizado.`
            : `Método de pago "${savedPaymentMethod.name}" creado.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/payment-methods']);
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} el método de pago. Intente de nuevo.`;
          }
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/payment-methods']);
  }

  // Getters para acceso fácil en la plantilla
  get name() { return this.paymentMethodForm.get('name'); }
  get code() { return this.paymentMethodForm.get('code'); }
  get description() { return this.paymentMethodForm.get('description'); }
  get isActive() { return this.paymentMethodForm.get('isActive'); }
}
