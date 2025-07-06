// src/app/shared/sidebar/sidebar.component.ts
import { Component } from '@angular/core';
import { SidebarService } from './sidebar.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { RoleService } from '../services/role.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService,
    public roleService: RoleService
  ) { }
}