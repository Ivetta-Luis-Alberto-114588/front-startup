import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { GuestCheckoutRoutingModule } from './guest-checkout-routing.module';
import { GuestCheckoutPageComponent } from './components/guest-checkout-page/guest-checkout-page.component';
import { GuestInfoComponent } from './components/guest-info/guest-info.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    GuestCheckoutPageComponent,
    GuestInfoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    GuestCheckoutRoutingModule,
    SharedModule
  ],
  exports: [
    GuestInfoComponent // Exportar para usar en otros módulos
  ]
})
export class GuestCheckoutModule { }
