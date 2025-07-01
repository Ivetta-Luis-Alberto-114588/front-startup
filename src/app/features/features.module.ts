import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from "@angular/router"
import { ProductsModule } from './products/products.module';
import { PaymentSuccessComponent } from './payments/components/payment-success/payment-success.component';
import { PaymentFailureComponent } from './payments/components/payment-failure/payment-failure.component';
import { PaymentPendingComponent } from './payments/components/payment-pending/payment-pending.component';
import { PaymentStatusDisplayComponent } from './payments/components/payment-status-display/payment-status-display.component';
import { PaymentVerificationService } from './payments/services/payment-verification.service';
import { OrderNotificationService } from './orders/services/order-notification.service';

@NgModule({
  declarations: [
    // HomeComponent  
    PaymentSuccessComponent,
    PaymentFailureComponent,
    PaymentPendingComponent,
    PaymentStatusDisplayComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule
    // ProductsModule
  ],
  providers: [
    PaymentVerificationService,
    OrderNotificationService
  ]
})
export class FeaturesModule { }