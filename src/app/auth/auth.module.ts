import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from "@angular/router"
import {FormsModule} from "@angular/forms"

import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { NotpagefoundComponent } from './notpagefound/notpagefound.component';
import { AuthRoutingModule } from './auth-routing.module';



@NgModule({
  declarations: [
    RegisterComponent,
    LoginComponent,
    NotpagefoundComponent
  ],
  imports: [ CommonModule, RouterModule, AuthRoutingModule, FormsModule],
  exports: [
    RegisterComponent,
    LoginComponent,
    NotpagefoundComponent
  ]
})
export class AuthModule { }
