import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
import { CheckoutTestingComponent } from './components/checkout-testing/checkout-testing.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { GuestCheckoutModule } from '../guest-checkout/guest-checkout.module';

@NgModule({
  declarations: [
    CheckoutPageComponent,
    CheckoutTestingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CheckoutRoutingModule,
    SharedModule,
    GuestCheckoutModule // Importar para usar GuestInfoComponent
  ]
})
export class CheckoutModule { }
