import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';

const routes: Routes = [
  {
    // Ruta para mostrar la lista de productos de una categoría específica
    // Ej: /products/pizzas, /products/empanadas
    path: ':idCategory', // El parámetro de ruta se llamará 'category'
    component: ProductListComponent
  },
  {
    // Ruta para mostrar el detalle de un producto específico
    // Ej: /products/detail/60b8d295f1d2a5001c8e4abc
    path: 'detail/:id', // El parámetro de ruta se llamará 'id'
    component: ProductDetailComponent
  },
  {
    // Opcional: Redirección por defecto si alguien va a /productos sin categoría
    path: '',
    redirectTo: '/dashboard', // O a la primera categoría, ej: 'pizzas'
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
