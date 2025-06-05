import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminPaymentMethodService } from '../../services/admin-payment-method.service';
import { OrderStatusService } from 'src/app/shared/services/order-status.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { IPaymentMethod } from 'src/app/shared/models/ipayment-method';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';

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
  orderStatuses: IOrderStatus[] = [];
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminPaymentMethodService: AdminPaymentMethodService,
    private orderStatusService: OrderStatusService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.paymentMethodForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9_]+$/)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      isActive: [true],
      defaultOrderStatusId: ['', [Validators.required]],
      requiresOnlinePayment: [false]
    });
  }  ngOnInit(): void {
    this.isLoading = true;
    
    // Cargar order statuses primero
    this.orderStatusService.getOrderStatuses().subscribe({
      next: (response) => {
        this.orderStatuses = response.orderStatuses.filter(status => status.isActive);
        
        // Luego verificar si es modo edición
        this.routeSub = this.route.paramMap.subscribe(params => {
          this.paymentMethodId = params.get('id');
          this.isEditMode = !!this.paymentMethodId;

          if (this.isEditMode && this.paymentMethodId) {
            this.loadPaymentMethodData(this.paymentMethodId);
          } else {
            // Si no es modo edición y hay order statuses, seleccionar el default
            const defaultStatus = this.orderStatuses.find(s => s.isDefault);
            
            if (defaultStatus) {
              this.paymentMethodForm.patchValue({ defaultOrderStatusId: defaultStatus._id });
            } else if (this.orderStatuses.length > 0) {
              // Si no hay default, seleccionar el primero disponible
              const firstStatus = this.orderStatuses[0];
              this.paymentMethodForm.patchValue({ defaultOrderStatusId: firstStatus._id });
            }
            this.isLoading = false;
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'No se pudieron cargar los estados de orden';
        this.notificationService.showError(this.error, 'Error');
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
          } else if (err.error && typeof err.error.message === 'string') {
            this.error = err.error.message;
          } else if (err.error && typeof err.error === 'string') {
            this.error = err.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} el método de pago. Status: ${err.status}`;
          }
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
        }
      });
  }

  getFormValidationErrors(): any {
    const result: any = {};
    Object.keys(this.paymentMethodForm.controls).forEach(key => {
      const controlErrors = this.paymentMethodForm.get(key)?.errors;
      if (controlErrors) {
        result[key] = controlErrors;
      }
    });
    return result;
  }

  onCodeInput(event: any): void {
    const value = event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    this.paymentMethodForm.patchValue({ code: value });
  }

  goBack(): void {
    this.router.navigate(['/admin/payment-methods']);
  }

  // Getters para acceso fácil en la plantilla
  get name() { return this.paymentMethodForm.get('name'); }
  get code() { return this.paymentMethodForm.get('code'); }
  get description() { return this.paymentMethodForm.get('description'); }
  get isActive() { return this.paymentMethodForm.get('isActive'); }
  get defaultOrderStatusId() { return this.paymentMethodForm.get('defaultOrderStatusId'); }
  get requiresOnlinePayment() { return this.paymentMethodForm.get('requiresOnlinePayment'); }
}
