import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CheckoutStateService } from 'src/app/features/checkout/services/checkout-state.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { IGuestCustomer } from '../../models';

@Component({
  selector: 'app-guest-info',
  templateUrl: './guest-info.component.html',
  styleUrls: ['./guest-info.component.scss']
})
export class GuestInfoComponent implements OnInit, OnDestroy {

  guestForm: FormGroup;
  private formSubscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private checkoutStateService: CheckoutStateService,
    private authService: AuthService
  ) {
    this.guestForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      customerEmail: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Marcar como guest checkout
    this.checkoutStateService.setIsGuestCheckout(true);

    // Suscribirse a cambios del formulario
    this.formSubscription.add(
      this.guestForm.valueChanges.subscribe(value => {
        if (this.guestForm.valid) {
          const guestInfo: IGuestCustomer = {
            customerName: value.customerName,
            customerEmail: value.customerEmail
          };
          this.checkoutStateService.setGuestCustomerInfo(guestInfo);
        } else {
          this.checkoutStateService.setGuestCustomerInfo(null);
        }
      })
    );

    // Cargar datos existentes si los hay
    const existingInfo = this.checkoutStateService.getGuestCustomerInfo();
    if (existingInfo) {
      this.guestForm.patchValue(existingInfo);
    }
  }

  ngOnDestroy(): void {
    this.formSubscription.unsubscribe();
  }

  // Getters para validación en template
  get customerName() { return this.guestForm.get('customerName'); }
  get customerEmail() { return this.guestForm.get('customerEmail'); }

  // Verificar si hay errores en un campo
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.guestForm.get(fieldName);
    return !!(field && field.errors && field.errors[errorType] && (field.dirty || field.touched));
  }

  // Obtener mensaje de error
  getErrorMessage(fieldName: string): string {
    const field = this.guestForm.get(fieldName);
    if (!field || !field.errors || (!field.dirty && !field.touched)) {
      return '';
    }

    if (field.errors['required']) {
      return fieldName === 'customerName' ? 'El nombre es requerido' : 'El email es requerido';
    }
    if (field.errors['email']) {
      return 'Ingrese un email válido';
    }
    if (field.errors['minlength']) {
      return 'El nombre debe tener al menos 2 caracteres';
    }

    return '';
  }
}
