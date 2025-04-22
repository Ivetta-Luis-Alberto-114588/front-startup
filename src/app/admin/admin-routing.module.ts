// src/app/admin/admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryListComponent } from './pages/category-list/category-list.component';
import { CategoryFormComponent } from './pages/category-form/category-form.component';
// Importa aquí otros componentes de admin a medida que los crees

const routes: Routes = [
  // Ruta principal del módulo admin (podría ser un dashboard de admin)
  // { path: '', component: AdminDashboardComponent }, // Descomenta si creas un dashboard

  // Rutas para Categorías
  {
    path: 'categories', // -> /admin/categories
    component: CategoryListComponent
  },
  {
    path: 'categories/new', // -> /admin/categories/new
    component: CategoryFormComponent
  },
  {
    path: 'categories/edit/:id', // -> /admin/categories/edit/123
    component: CategoryFormComponent
  },

  // Ruta por defecto si se entra a /admin sin subruta específica
  { path: '', redirectTo: 'categories', pathMatch: 'full' }, // Redirige a la lista de categorías por defecto

  // Aquí añadirás las rutas para Productos, Unidades, Usuarios, etc.
  // { path: 'products', component: ProductListComponent },
  // { path: 'products/new', component: ProductFormComponent },
  // { path: 'products/edit/:id', component: ProductFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }