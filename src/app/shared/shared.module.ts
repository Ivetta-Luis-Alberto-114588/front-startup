// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotpagefoundComponent } from './components/notpagefound/notpagefound.component';
import { TermsConditionsComponent } from './pages/terms-conditions/terms-conditions.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { MainLayoutComponent } from './layouts/main-layout.component';

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    NotpagefoundComponent,
    TermsConditionsComponent,
    PrivacyPolicyComponent,
    MainLayoutComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    HeaderComponent,
    SidebarComponent,
    NotpagefoundComponent
  ]
})
export class SharedModule { }