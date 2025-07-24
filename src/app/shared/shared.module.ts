// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotpagefoundComponent } from './components/notpagefound/notpagefound.component';
import { TermsConditionsComponent } from './pages/terms-conditions/terms-conditions.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { CameraModalComponent } from './components/camera-modal/camera-modal.component';
import { McpChatComponent } from './components/mcp-chat/mcp-chat.component';

@NgModule({  declarations: [
    HeaderComponent,
    SidebarComponent,
    NotpagefoundComponent,
    TermsConditionsComponent,
    PrivacyPolicyComponent,
    MainLayoutComponent,
    CameraModalComponent,
    McpChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    NgbModule
  ],  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    HeaderComponent,
    SidebarComponent,
    NotpagefoundComponent,
    TermsConditionsComponent,
    PrivacyPolicyComponent,
    CameraModalComponent,
    McpChatComponent
  ]
})
export class SharedModule { }