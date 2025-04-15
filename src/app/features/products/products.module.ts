import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common'; // Ya no es necesario importar directamente
// import { FormsModule } from '@angular/forms'; // Ya no es necesario importar directamente

import { ProductsRoutingModule } from './products-routing.module';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { RouterModule } from '@angular/router'; // Necesario para directivas como routerLink
import { SharedModule } from 'src/app/shared/shared.module'; // <-- Importar SharedModule

@NgModule({
  declarations: [
    ProductListComponent,
    ProductDetailComponent
  ],
  imports: [
    // CommonModule, // <-- Quitar si importas SharedModule
    // FormsModule, // <-- Quitar si importas SharedModule
    ProductsRoutingModule,
    RouterModule, // <-- Mantener para directivas de enrutador en plantillas
    SharedModule  // <-- Añadir para obtener CommonModule, FormsModule, etc.
  ]
})
export class ProductsModule { }