// src/app/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module'; // Importar SharedModule

import { CategoryListComponent } from './pages/category-list/category-list.component';
import { CategoryFormComponent } from './pages/category-form/category-form.component';
import { UnitListComponent } from './pages/unit-list/unit-list.component';
import { UnitFormComponent } from './pages/unit-form/unit-form.component';
import { TagListComponent } from './pages/tag-list/tag-list.component';
import { TagFormComponent } from './pages/tag-form/tag-form.component';
import { CityListComponent } from './pages/city-list/city-list.component';
import { CityFormComponent } from './pages/city-form/city-form.component';
import { NeighborhoodListComponent } from './pages/neighborhood-list/neighborhood-list.component';
import { NeighborhoodFormComponent } from './pages/neighborhood-form/neighborhood-form.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductFormComponent } from './pages/product-form/product-form.component';
import { CouponListComponent } from './pages/coupon-list/coupon-list.component';
import { CouponFormComponent } from './pages/coupon-form/coupon-form.component';
import { OrderListComponent } from './pages/order-list/order-list.component';
import { OrderDetailComponent } from './pages/order-detail/order-detail.component';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { CustomerFormComponent } from './pages/customer-form/customer-form.component';
import { UserListComponent } from './pages/user-list/user-list.component';
import { UserFormComponent } from './pages/user-form/user-form.component';
import { OrderStatusDashboardComponent } from './pages/order-status-dashboard/order-status-dashboard.component';
// Importa aquí otros componentes de admin a medida que los crees

@NgModule({
  declarations: [
    CategoryListComponent,
    CategoryFormComponent,
    UnitListComponent,
    UnitFormComponent,
    TagListComponent,
    TagFormComponent,
    CityListComponent,
    CityFormComponent,
    NeighborhoodListComponent,
    NeighborhoodFormComponent,
    ProductListComponent,
    ProductFormComponent,
    CouponListComponent,
    CouponFormComponent,
    OrderListComponent,
    OrderDetailComponent,
    CustomerListComponent, CustomerFormComponent,
    UserListComponent,
    UserFormComponent,
    OrderStatusDashboardComponent,
    // Declara aquí otros componentes de admin
  ],
  imports: [
    AdminRoutingModule,
    SharedModule // Importar para CommonModule, FormsModule, ReactiveFormsModule, NgbModule, etc.
  ]
  // No necesitas exportar componentes si solo se usan dentro de este módulo
})
export class AdminModule { }