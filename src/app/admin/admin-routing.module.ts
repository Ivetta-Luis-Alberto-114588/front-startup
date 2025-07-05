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
import { PaymentMethodListComponent } from './pages/payment-method-list/payment-method-list.component';
import { PaymentMethodFormComponent } from './pages/payment-method-form/payment-method-form.component';
import { TelegramTestComponent } from './pages/telegram-test/telegram-test.component';
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


  // --- RUTAS PARA CIUDADES ---
  {
    path: 'cities', // -> /admin/cities
    component: CityListComponent
  },
  {
    path: 'cities/new', // -> /admin/cities/new
    component: CityFormComponent
  },
  {
    path: 'cities/edit/:id', // -> /admin/cities/edit/abc
    component: CityFormComponent
  },
  // --- FIN RUTAS CIUDADES ---


  // --- RUTAS PARA BARRIOS ---
  {
    path: 'neighborhoods', // -> /admin/neighborhoods
    component: NeighborhoodListComponent
  },
  {
    path: 'neighborhoods/new', // -> /admin/neighborhoods/new
    component: NeighborhoodFormComponent
  },
  {
    path: 'neighborhoods/edit/:id', // -> /admin/neighborhoods/edit/xyz
    component: NeighborhoodFormComponent
  },
  // --- FIN RUTAS BARRIOS ---



  // --- RUTAS PARA PRODUCTOS ---
  {
    path: 'products', // -> /admin/products
    component: ProductListComponent
  },
  {
    path: 'products/new', // -> /admin/products/new
    component: ProductFormComponent
  },
  {
    path: 'products/edit/:id', // -> /admin/products/edit/prod123
    component: ProductFormComponent
  },
  // --- FIN RUTAS PRODUCTOS ---


  // --- RUTAS PARA CUPONES ---
  {
    path: 'coupons', // -> /admin/coupons
    component: CouponListComponent
  },
  {
    path: 'coupons/new', // -> /admin/coupons/new
    component: CouponFormComponent
  },
  {
    path: 'coupons/edit/:id', // -> /admin/coupons/edit/coupon123
    component: CouponFormComponent
  },
  // --- FIN RUTAS CUPONES ---


  // --- RUTAS PARA PEDIDOS (ADMIN) ---
  {
    path: 'orders', // -> /admin/orders
    component: OrderListComponent
  },
  {
    path: 'orders/:id', // -> /admin/orders/order123 (Ruta para ver detalle)
    component: OrderDetailComponent // Usar el componente de detalle
  },  {
    path: 'order-status-dashboard', // -> /admin/order-status-dashboard
    component: OrderStatusDashboardComponent
  },
  {
    path: 'order-statuses', // -> /admin/order-statuses
    component: OrderStatusListComponent
  },
  {
    path: 'order-statuses/new', // -> /admin/order-statuses/new
    component: OrderStatusFormComponent
  },
  {
    path: 'order-statuses/edit/:id', // -> /admin/order-statuses/edit/123
    component: OrderStatusFormComponent
  },
  // --- FIN RUTAS PEDIDOS ---



  // --- RUTAS PARA CLIENTES (ADMIN) ---
  {
    path: 'customers', // -> /admin/customers
    component: CustomerListComponent
  },
  {
    path: 'customers/edit/:id', // -> /admin/customers/edit/cust123 (Usamos 'edit' como convención)
    component: CustomerFormComponent // Usaremos el mismo form para ver/editar
  },
  // Si necesitas una ruta solo para ver (sin edición), puedes añadir:
  // { path: 'customers/view/:id', component: CustomerDetailComponent }, // Necesitarías crear CustomerDetailComponent
  // --- FIN RUTAS CLIENTES ---




  // --- RUTAS PARA USUARIOS (ADMIN) ---
  {
    path: 'users', // -> /admin/users
    component: UserListComponent
  },  {
    path: 'users/edit/:id', // -> /admin/users/edit/user123
    component: UserFormComponent // Formulario para editar (principalmente roles)
  },
  // --- FIN RUTAS USUARIOS ---

  // --- RUTAS PARA MÉTODOS DE PAGO ---
  {
    path: 'payment-methods', // -> /admin/payment-methods
    component: PaymentMethodListComponent
  },
  {
    path: 'payment-methods/new', // -> /admin/payment-methods/new
    component: PaymentMethodFormComponent
  },
  {
    path: 'payment-methods/edit/:id', // -> /admin/payment-methods/edit/123
    component: PaymentMethodFormComponent
  },
  // --- FIN RUTAS MÉTODOS DE PAGO ---

  // --- RUTAS PARA DIAGNÓSTICO DE TELEGRAM ---
  {
    path: 'telegram-test', // -> /admin/telegram-test
    component: TelegramTestComponent
  },
  // --- FIN RUTAS TELEGRAM ---

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