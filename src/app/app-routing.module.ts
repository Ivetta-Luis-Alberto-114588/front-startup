import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { NotpagefoundComponent } from './auth/notpagefound/notpagefound.component';

const routes: Routes = [
  { path: 'dashboard', component: HomeComponent },
  { path: '', redirectTo: 'dashboard',pathMatch: 'full' },

  //ruta de autenticacion
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)},

  // Redirecciones directas para conveniencia
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'registro', redirectTo: 'auth/registro', pathMatch: 'full' },

  // Ruta para páginas no encontradas
  { path: '**', component: NotpagefoundComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }