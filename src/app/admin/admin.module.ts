// src/app/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop'; // <--- IMPORTAR

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
import { OrderStatusListComponent } from './pages/order-status-list/order-status-list.component';
import { OrderStatusFormComponent } from './pages/order-status-form/order-status-form.component';

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
    CustomerListComponent,
    CustomerFormComponent,
    UserListComponent,
    UserFormComponent,
    OrderStatusDashboardComponent, // <--- ASEGURADO
    OrderStatusListComponent,
    OrderStatusFormComponent,
  ],
  imports: [
    AdminRoutingModule,
    SharedModule,
    DragDropModule // <--- AÑADIDO
  ]
})
export class AdminModule { }