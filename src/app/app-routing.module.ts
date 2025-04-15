import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotpagefoundComponent } from './shared/components/notpagefound/notpagefound.component';
// Importar el componente de Layout
import { MainLayoutComponent } from './shared/layouts/main-layout.component';
// Ya no necesitamos importar Terms/Privacy aquí si se mueven a rutas hijas
// import { TermsConditionsComponent } from './shared/pages/terms-conditions/terms-conditions.component';
// import { PrivacyPolicyComponent } from './shared/pages/privacy-policy/privacy-policy.component';

const routes: Routes = [
  // --- Rutas sin Layout Principal (Header/Sidebar) ---
  {
    path: 'auth', // Rutas de autenticación
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  // Redirecciones convenientes a auth (siguen sin layout)
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'registro', redirectTo: 'auth/registro', pathMatch: 'full' },

  // --- Rutas CON Layout Principal (Header/Sidebar) ---
  {
    path: '', // La ruta raíz ahora apunta al Layout Principal
    component: MainLayoutComponent, // Usa el componente de layout
    children: [ // Las rutas dentro de este layout van aquí
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
      },
      // Mueve Terms y Privacy dentro del layout si quieres que tengan Header/Sidebar
      // Si NO quieres que tengan layout, déjalas fuera como estaban
      {
        path: 'terms',
        // Carga diferida también es posible para páginas simples:
        loadComponent: () => import('./shared/pages/terms-conditions/terms-conditions.component').then(c => c.TermsConditionsComponent)
      },
      {
        path: 'privacy-policy',
        loadComponent: () => import('./shared/pages/privacy-policy/privacy-policy.component').then(c => c.PrivacyPolicyComponent)
      },
      // Redirección por defecto DENTRO del layout principal
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  // --- Ruta Catch-All (404) ---
  // Se renderizará en el outlet raíz (AppComponent), por lo tanto SIN layout principal.
  // Si prefieres que el 404 aparezca DENTRO del layout cuando ya estás navegando
  // en la parte principal, muévelo como la ÚLTIMA ruta hija dentro de MainLayoutComponent.
  // Dejarlo fuera lo hace más genérico.
  { path: '**', component: NotpagefoundComponent }
];

@NgModule({
  // Considera habilitar el scroll position restoration si no lo has hecho
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }