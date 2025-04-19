// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotpagefoundComponent } from './shared/components/notpagefound/notpagefound.component';
import { MainLayoutComponent } from './shared/layouts/main-layout.component';
// --- Importa los componentes directamente ---
import { TermsConditionsComponent } from './shared/pages/terms-conditions/terms-conditions.component';
import { PrivacyPolicyComponent } from './shared/pages/privacy-policy/privacy-policy.component';
import { PaymentSuccessComponent } from './features/payments/components/payment-success/payment-success.component';
import { PaymentFailureComponent } from './features/payments/components/payment-failure/payment-failure.component';
import { PaymentPendingComponent } from './features/payments/components/payment-pending/payment-pending.component';
import { AuthGuard } from './auth/guards/auth.guard';

const routes: Routes = [
  // --- Rutas sin Layout ---
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'registro', redirectTo: 'auth/registro', pathMatch: 'full' },

  // --- Rutas CON Layout Principal ---
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
      },
      {
        path: 'cart',
        loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule)
      },
      {
        path: 'terms',
        component: TermsConditionsComponent // Carga directa
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent // Carga directa
      },
      {
        path: 'checkout',
        loadChildren: () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule),
        canActivate: [AuthGuard]
      },

      {
        path: 'my-orders',
        loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule)
      },

      // --- Rutas de Callback de Pago ---
      { path: 'payment/success', component: PaymentSuccessComponent },
      { path: 'payment/failure', component: PaymentFailureComponent },
      { path: 'payment/pending', component: PaymentPendingComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },


  // --- Ruta 404 ---
  { path: '**', component: NotpagefoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }