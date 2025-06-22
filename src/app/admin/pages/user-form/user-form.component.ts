// src/app/admin/pages/user-form/user-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminUserService, UpdateAdminUserData } from '../../services/admin-user.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { IUser } from 'src/app/shared/models/iuser';

// Función validadora para asegurar al menos un rol
function minRolesValidator(min = 1) {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const rolesSelected = control.value as string[];
    return rolesSelected?.length >= min ? null : { 'minRoles': { requiredLength: min, actualLength: rolesSelected?.length || 0 } };
  };
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {

  userForm: FormGroup;
  userId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  availableRoles = [ // Define los roles disponibles
    { label: 'Usuario', value: 'USER_ROLE' },
    { label: 'Administrador', value: 'ADMIN_ROLE' }
  ];
  userRoles: string[] = []; // Para manejar los checkboxes
  originalUserData: UpdateAdminUserData | null = null; // Para detectar cambios
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminUserService: AdminUserService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required], // Hacerlo editable si se quiere
      email: [{ value: '', disabled: true }],
      roles: this.fb.control([], minRolesValidator(1)), // Usa control simple y validador
      // isActive: [true] // Opcional
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
      if (this.userId) {
        this.loadUserData(this.userId);
      } else {
        this.error = "No se especificó un ID de usuario.";
        this.notificationService.showError(this.error, 'Error');
        this.router.navigate(['/admin/users']);
        this.isLoading = false;
      }
    });

    // Escuchar cambios para habilitar/deshabilitar botón guardar
    this.userForm.valueChanges.subscribe(() => { });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadUserData(id: string): void {
    this.adminUserService.getUserById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (user) => {
          this.userRoles = user.roles || []; // Guardar roles actuales
          this.originalUserData = { // Guardar datos originales
            name: user.name,
            roles: [...this.userRoles],
            // isActive: user.isActive // Si lo implementas
          };
          this.userForm.patchValue({
            name: user.name,
            email: user.email,
            roles: [...this.userRoles], // Establecer valor inicial para validación
            // isActive: user.isActive // Si lo implementas
          });
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar el usuario (ID: ${id}).`;
          this.notificationService.showError(this.error ?? 'Error desconocido', 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/users']);
          }
        }
      });
  }

  // Manejar cambio en checkboxes de roles
  onRoleChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const roleValue = checkbox.value;
    let currentRoles: string[] = this.userForm.get('roles')?.value || [];

    if (checkbox.checked) {
      if (!currentRoles.includes(roleValue)) {
        currentRoles.push(roleValue);
      }
    } else {
      currentRoles = currentRoles.filter(role => role !== roleValue);
    }
    // Actualizar el valor del control y marcar como tocado para validación
    this.userForm.get('roles')?.setValue(currentRoles);
    this.userForm.get('roles')?.markAsTouched();
  }

  // Getter para verificar si hubo cambios
  get hasChanges(): boolean {
    if (!this.originalUserData) return false;
    const currentData = this.userForm.value;
    return currentData.name !== this.originalUserData.name ||
      JSON.stringify(currentData.roles.sort()) !== JSON.stringify(this.originalUserData.roles?.sort());
    // || currentData.isActive !== this.originalUserData.isActive; // Si implementas isActive
  }

  onSubmit(): void {
    // Marcar roles como tocado para mostrar error si es necesario
    this.userForm.get('roles')?.markAsTouched();

    if (this.userForm.invalid || this.isSubmitting || !this.userId || !this.hasChanges) {
      if (!this.hasChanges && !this.isSubmitting) {
        this.notificationService.showInfo('No se han realizado cambios.', 'Información');
      }
      this.userForm.markAllAsTouched(); // Asegura mostrar todos los errores
      return;
    }


    this.isSubmitting = true;
    this.error = null;

    // Solo enviar los campos que se pueden modificar
    const updatePayload: UpdateAdminUserData = {
      name: this.userForm.get('name')?.value,
      roles: this.userForm.get('roles')?.value,
      // isActive: this.userForm.get('isActive')?.value // Si lo implementas
    };

    this.adminUserService.updateUser(this.userId, updatePayload)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (updatedUser) => {
          this.notificationService.showSuccess(`Usuario "${updatedUser.name}" actualizado.`, 'Éxito');
          this.router.navigate(['/admin/users']); // Volver a la lista
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = 'No se pudo actualizar el usuario. Intente de nuevo.';
          }
          this.notificationService.showError(this.error ?? 'Error desconocido', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  // Getters
  get name() { return this.userForm.get('name'); }
  get email() { return this.userForm.get('email'); }
  // get isActive() { return this.userForm.get('isActive'); } // Si lo implementas
}