// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotpagefoundComponent } from './shared/components/notpagefound/notpagefound.component';
import { MainLayoutComponent } from './shared/layouts/main-layout.component';
// --- Importa los componentes directamente ---
import { TermsConditionsComponent } from './shared/pages/terms-conditions/terms-conditions.component';
import { PrivacyPolicyComponent } from './shared/pages/privacy-policy/privacy-policy.component';

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
      // --- Cambia loadComponent por component ---
      {
        path: 'terms',
        component: TermsConditionsComponent // Carga directa
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent // Carga directa
      },
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