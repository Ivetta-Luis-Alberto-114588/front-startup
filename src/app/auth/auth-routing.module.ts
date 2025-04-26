// src/app/auth/auth-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component'; // <-- IMPORTAR
import { ResetPasswordComponent } from './reset-password/reset-password.component';   // <-- IMPORTAR

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent }, // <-- RUTA AÑADIDA
  { path: 'reset-password', component: ResetPasswordComponent },   // <-- RUTA AÑADIDA
  // Redirección por defecto dentro de /auth
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }