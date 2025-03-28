import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotpagefoundComponent } from './auth/notpagefound/notpagefound.component';

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

  // Ruta para páginas no encontradas
  { path: '**', component: NotpagefoundComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }