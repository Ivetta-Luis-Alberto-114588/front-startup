// src/app/admin/admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryListComponent } from './pages/category-list/category-list.component';
import { CategoryFormComponent } from './pages/category-form/category-form.component';
// --- IMPORTAR COMPONENTES DE UNIDAD ---
import { UnitListComponent } from './pages/unit-list/unit-list.component';
import { UnitFormComponent } from './pages/unit-form/unit-form.component';
import { TagListComponent } from './pages/tag-list/tag-list.component';
import { TagFormComponent } from './pages/tag-form/tag-form.component';
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

  // --- RUTAS PARA UNIDADES ---
  {
    path: 'units', // -> /admin/units
    component: UnitListComponent
  },
  {
    path: 'units/new', // -> /admin/units/new
    component: UnitFormComponent
  },
  {
    path: 'units/edit/:id', // -> /admin/units/edit/456
    component: UnitFormComponent
  },
  // --- FIN RUTAS UNIDADES ---

  // --- RUTAS PARA TAGS ---
  {
    path: 'tags', // -> /admin/tags
    component: TagListComponent
  },
  {
    path: 'tags/new', // -> /admin/tags/new
    component: TagFormComponent
  },
  {
    path: 'tags/edit/:id', // -> /admin/tags/edit/789
    component: TagFormComponent
  },
  // --- FIN RUTAS TAGS ---

  // Ruta por defecto si se entra a /admin sin subruta específica
  // Cambiar a un dashboard si lo creas, o mantener categorías
  { path: '', redirectTo: 'categories', pathMatch: 'full' },

  // Aquí añadirás las rutas para Productos, Tags, Usuarios, etc.
  // { path: 'products', component: ProductListComponent },
  // { path: 'products/new', component: ProductFormComponent },
  // { path: 'products/edit/:id', component: ProductFormComponent },
  // { path: 'tags', component: TagListComponent },
  // ...
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }