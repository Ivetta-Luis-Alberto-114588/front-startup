import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotpagefoundComponent } from './shared/components/notpagefound/notpagefound.component';
import { TermsConditionsComponent } from './shared/pages/terms-conditions/terms-conditions.component';
import { PrivacyPolicyComponent } from './shared/pages/privacy-policy/privacy-policy.component';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  //ruta de autenticacion
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },

  //  Ruta para el módulo de productos (lazy loaded)
  {
    path: 'products', // La ruta base para todas las subrutas de productos
    loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
  },


  // Redirecciones directas para conveniencia
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'registro', redirectTo: 'auth/registro', pathMatch: 'full' },

  { path: 'terms', component: TermsConditionsComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },

  // Ruta para páginas no encontradas
  { path: '**', component: NotpagefoundComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }