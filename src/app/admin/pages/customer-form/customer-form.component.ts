// src/app/admin/pages/customer-form/customer-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminCustomerService, UpdateAdminCustomerData } from '../../services/admin-customer.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ICustomer } from 'src/app/features/customers/models/icustomer';
import { INeighborhood } from 'src/app/features/customers/models/ineighborhood';
import { AdminNeighborhoodService } from '../../services/admin-neighborhood.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.scss']
})
export class CustomerFormComponent implements OnInit, OnDestroy {

  customerForm: FormGroup;
  isEditMode = true; // En admin, este form siempre será para editar (o ver)
  customerId: string | null = null;
  isLoading = false; // Carga del cliente
  isSubmitting = false; // Envío del formulario
  isLoadingNeighborhoods = false; // Carga de barrios
  error: string | null = null;
  neighborhoods: INeighborhood[] = [];
  private routeSub: Subscription | null = null;
  private dataSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminCustomerService: AdminCustomerService,
    private adminNeighborhoodService: AdminNeighborhoodService, // Para el selector
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.customerForm = this.fb.group({
      // Campos editables por el admin
      name: ['', Validators.required],
      phone: ['', [Validators.pattern(/^\+?[\d\s-]{8,15}$/)]], // Opcional pero con patrón
      address: [''], // Dirección principal, campo simple
      neighborhoodId: [null, Validators.required], // ID del barrio seleccionado
      isActive: [true],
      // Campos solo lectura (se llenan desde loadCustomerData)
      email: [{ value: '', disabled: true }],
      userId: [{ value: null, disabled: true }] // Mostrar el ID del usuario si existe
    });
  }

  ngOnInit(): void {
    this.isLoading = true; // Inicia carga general
    this.loadNeighborhoods(); // Carga los barrios para el selector

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.customerId = params.get('id');
      if (this.customerId) {
        this.loadCustomerData(this.customerId); // Carga los datos del cliente
      } else {
        this.error = "No se especificó un ID de cliente.";
        this.notificationService.showError(this.error, 'Error');
        this.router.navigate(['/admin/customers']); // Volver si no hay ID
        this.isLoading = false; // Detener carga si no hay ID
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  loadNeighborhoods(): void {
    this.isLoadingNeighborhoods = true;
    const pagination: PaginationDto = { page: 1, limit: 1000 }; // Asume pocos barrios o implementa búsqueda
    this.dataSub = this.adminNeighborhoodService.getNeighborhoods(pagination).pipe(
      finalize(() => this.isLoadingNeighborhoods = false),
      catchError(err => {
        this.notificationService.showError('No se pudieron cargar los barrios.', 'Error');
        return of([]); // Devuelve array vacío en caso de error
      })
    ).subscribe(data => {
      this.neighborhoods = data.sort((a, b) => // Ordenar por ciudad y luego barrio
        a.city.name.localeCompare(b.city.name) || a.name.localeCompare(b.name)
      );
    });
  }

  loadCustomerData(id: string): void {
    this.adminCustomerService.getCustomerById(id)
      .pipe(finalize(() => this.isLoading = false)) // Termina carga general
      .subscribe({
        next: (customer) => {
          this.customerForm.patchValue({
            name: customer.name,
            email: customer.email, // Se mostrará deshabilitado
            phone: customer.phone,
            address: customer.address,
            // Asegurar que el ID del barrio sea string para el select
            neighborhoodId: customer.neighborhood?.id?.toString() || null,
            isActive: customer.isActive,
            userId: customer.userId || null // Mostrar ID de usuario vinculado
          });
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar el cliente (ID: ${id}).`;
          this.notificationService.showError(this.error ?? 'Error desconocido', 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/customers']);
          }
        }
      });
  }

  onSubmit(): void {
    if (this.customerForm.invalid || this.isSubmitting || !this.customerId) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    // Construir el payload solo con los campos editables
    const updatePayload: UpdateAdminCustomerData = {
      name: this.customerForm.get('name')?.value,
      phone: this.customerForm.get('phone')?.value,
      address: this.customerForm.get('address')?.value,
      neighborhoodId: this.customerForm.get('neighborhoodId')?.value,
      isActive: this.customerForm.get('isActive')?.value,
    };

    this.adminCustomerService.updateCustomer(this.customerId, updatePayload)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (updatedCustomer) => {
          this.notificationService.showSuccess(`Cliente "${updatedCustomer.name}" actualizado.`, 'Éxito');
          this.router.navigate(['/admin/customers']); // Volver a la lista
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = 'No se pudo actualizar el cliente. Intente de nuevo.';
          }
          this.notificationService.showError(this.error ?? 'Error desconocido', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }

  // Getters para facilitar el acceso en la plantilla
  get name() { return this.customerForm.get('name'); }
  get phone() { return this.customerForm.get('phone'); }
  get address() { return this.customerForm.get('address'); }
  get neighborhoodId() { return this.customerForm.get('neighborhoodId'); }
  get isActive() { return this.customerForm.get('isActive'); }
}