import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';

const routes: Routes = [
  {
    // Ruta para mostrar la lista de productos de una categoría específica
    // Ej: /products/67dc9f28e260c0eef5279182, /products/67dc9f28e260c0eef5279182
    path: ':idCategory', // El parámetro de ruta se llamará 'idCategory'
    component: ProductListComponent
  },
  {
    // Ruta para mostrar el detalle de un producto específico
    // Ej: /products/67dc9f28e260c0eef5279182/60b8d295f1d2a5001c8e4abc
    path: ':idCategory/:idProduct', // El parámetro de ruta se llamará 'idCategory' y 'idProduct'
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
