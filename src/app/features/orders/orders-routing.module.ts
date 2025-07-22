// src/app/features/orders/orders-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyOrdersPageComponent } from './pages/my-orders-page/my-orders-page.component'; // Importa el componente
import { OrderDetailPageComponent } from './pages/order-detail-page/order-detail-page.component';
import { OrderConfirmationComponent } from './components/order-confirmation/order-confirmation.component';

// Define la ruta DENTRO de este módulo lazy-loaded
// Cuando se navega a /my-orders (definido en app-routing), se carga este módulo
// y la ruta '' (vacía) dentro de este módulo coincide, cargando MyOrdersPageComponent.
const routes: Routes = [
  {
    path: '',
    component: MyOrdersPageComponent
  },
  {
    path: 'confirmation', // Para /order-confirmation/confirmation
    component: OrderConfirmationComponent
  },
  {
    path: ':orderId', // Ruta para el detalle, ej: /my-orders/680396faafcf6a19585c8e80
    component: OrderDetailPageComponent // 
    // Nota: No necesitas AuthGuard aquí si la ruta padre (/my-orders) ya lo tiene.
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)], // Usa forChild para módulos lazy-loaded
  exports: [RouterModule]
})
export class OrdersRoutingModule { }