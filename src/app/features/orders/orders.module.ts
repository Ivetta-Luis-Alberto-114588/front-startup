// src/app/features/orders/orders.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngIf, *ngFor, etc.

import { OrdersRoutingModule } from './orders-routing.module';
import { MyOrdersPageComponent } from './pages/my-orders-page/my-orders-page.component';
import { SharedModule } from 'src/app/shared/shared.module'; // Importa SharedModule para pipes, etc.
// No necesitas importar RouterModule aquí si ya lo hace SharedModule,
// pero si SharedModule NO exporta RouterModule, entonces sí lo necesitas aquí.
// import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    MyOrdersPageComponent
    // Aquí declararías OrderDetailPageComponent en el futuro
  ],
  imports: [
    CommonModule,
    OrdersRoutingModule,
    SharedModule // Importa SharedModule para acceder a CommonModule, FormsModule, NgbModule, Pipes, etc.
    // RouterModule // Descomenta si SharedModule no exporta RouterModule
  ]
})
export class OrdersModule { }