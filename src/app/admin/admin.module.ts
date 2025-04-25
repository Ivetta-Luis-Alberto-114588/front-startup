// src/app/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module'; // Importar SharedModule

import { CategoryListComponent } from './pages/category-list/category-list.component';
import { CategoryFormComponent } from './pages/category-form/category-form.component';
import { UnitListComponent } from './pages/unit-list/unit-list.component';
import { UnitFormComponent } from './pages/unit-form/unit-form.component';
// Importa aquí otros componentes de admin a medida que los crees

@NgModule({
  declarations: [
    CategoryListComponent,
    CategoryFormComponent,
    UnitListComponent,
    UnitFormComponent,
    // Declara aquí otros componentes de admin
  ],
  imports: [
    AdminRoutingModule,
    SharedModule // Importar para CommonModule, FormsModule, ReactiveFormsModule, NgbModule, etc.
  ]
  // No necesitas exportar componentes si solo se usan dentro de este módulo
})
export class AdminModule { }