// src/app/admin/pages/user-list/user-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { IUser } from 'src/app/shared/models/iuser';
// Importar la interfaz paginada del servicio
import { AdminUserService, PaginatedAdminUsersResponse } from '../../services/admin-user.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { AuthService } from 'src/app/auth/services/auth.service';
import { RoleService } from 'src/app/shared/services/role.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  userToDelete: IUser | null = null;

  users: IUser[] = [];
  isLoading = false;
  error: string | null = null;
  private userSub: Subscription | null = null;
  private currentUserSub: Subscription | null = null;
  currentUserId: string | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private adminUserService: AdminUserService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal,
    private authService: AuthService,
    public roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.currentUserSub = this.authService.user$.subscribe(user => {
      this.currentUserId = user?.id || null;
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.currentUserSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    // El servicio ahora devuelve Observable<PaginatedAdminUsersResponse>
    this.userSub = this.adminUserService.getUsers(pagination)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe(
        (response: any) => {
          if (response && Array.isArray(response.users)) {
            this.users = response.users;
            this.totalItems = response.total ?? response.users.length;
          } else {
            console.error("Respuesta inválida de la API:", response);
            this.users = [];
            this.totalItems = 0;
            this.error = 'Formato de datos inesperado del servidor.';
            this.notificationService.showError(this.error, 'Error');
          }
        },
        err => {
          this.error = 'No se pudieron cargar los usuarios.';
          if (err.error && err.error.error) {
            this.error = err.error.error;
          }
          this.notificationService.showError(this.error ?? "Unknown error", 'Error');
          this.users = [];
          this.totalItems = 0;
        }
      );
  }

  // --- Métodos restantes sin cambios ---
  goToEditUser(userId: string): void {
    // Verificar permisos antes de navegar
    this.roleService.canEdit().subscribe(canEdit => {
      if (!canEdit) {
        this.notificationService.showError('No tienes permisos para editar usuarios. Solo los Super Administradores pueden realizar esta acción.', 'Acceso Denegado');
        return;
      }

      this.router.navigate(['/admin/users/edit', userId]);
    });
  }

  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) return;
    this.currentPage = page;
    this.loadUsers();
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId;
  }

  openDeleteConfirmation(user: IUser): void {
    if (this.isCurrentUser(user.id)) {
      this.notificationService.showWarning('No puedes eliminar tu propia cuenta de usuario.', 'Acción No Permitida');
      return;
    }
    this.userToDelete = user;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.userToDelete) {
          this.confirmDelete(this.userToDelete.id);
        }
        this.userToDelete = null;
      },
      (reason) => {
        this.userToDelete = null;
      }
    );
  }

  confirmDelete(userId: string): void {
    this.isLoading = true;
    this.adminUserService.deleteUser(userId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedUser) => {
          this.notificationService.showSuccess(`Usuario "${deletedUser.name}" eliminado.`, 'Éxito');
          this.loadUsers();
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar el usuario.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }
}