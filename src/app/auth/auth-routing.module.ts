// src/app/auth/auth-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component'; // <-- ASEGÚRATE DE IMPORTAR
import { ResetPasswordComponent } from './reset-password/reset-password.component';   // <-- ASEGÚRATE DE IMPORTAR

const routes: Routes = [
  // Rutas existentes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // --- AÑADIR NUEVAS RUTAS ---
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent }, // <-- ESTA ES LA RUTA QUE FALTABA
  // --- FIN NUEVAS RUTAS ---

  // Redirección por defecto dentro de /auth (si no se especifica sub-ruta)
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)], // Usar forChild para módulos lazy-loaded
  exports: [RouterModule]
})
export class AuthRoutingModule { }