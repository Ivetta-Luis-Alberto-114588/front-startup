// src/app/features/orders/orders-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyOrdersPageComponent } from './pages/my-orders-page/my-orders-page.component'; // Importa el componente

// Define la ruta DENTRO de este módulo lazy-loaded
// Cuando se navega a /my-orders (definido en app-routing), se carga este módulo
// y la ruta '' (vacía) dentro de este módulo coincide, cargando MyOrdersPageComponent.
const routes: Routes = [
  { path: '', component: MyOrdersPageComponent }
  // Aquí podrías añadir rutas hijas en el futuro, como /my-orders/:id para detalles
  // { path: ':id', component: OrderDetailPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)], // Usa forChild para módulos lazy-loaded
  exports: [RouterModule]
})
export class OrdersRoutingModule { }