import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from "@angular/router"
import { ProductsModule } from './products/products.module';
import { PaymentSuccessComponent } from './payments/components/payment-success/payment-success.component';
import { PaymentFailureComponent } from './payments/components/payment-failure/payment-failure.component';
import { PaymentPendingComponent } from './payments/components/payment-pending/payment-pending.component';

@NgModule({
  declarations: [
    // HomeComponent  
    PaymentSuccessComponent,
    PaymentFailureComponent,
    PaymentPendingComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule
    // ProductsModule
  ]
})
export class FeaturesModule { }