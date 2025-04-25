// src/app/admin/pages/neighborhood-form/neighborhood-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminNeighborhoodService } from '../../services/admin-neighborhood.service';
import { AdminCityService } from '../../services/admin-city.service'; // Necesario para cargar ciudades
import { NotificationService } from 'src/app/shared/services/notification.service';
import { INeighborhood } from 'src/app/features/customers/models/ineighborhood';
import { ICity } from 'src/app/features/customers/models/icity';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto'; // Para cargar todas las ciudades

@Component({
  selector: 'app-neighborhood-form',
  templateUrl: './neighborhood-form.component.html',
  styleUrls: ['./neighborhood-form.component.scss']
})
export class NeighborhoodFormComponent implements OnInit, OnDestroy {

  neighborhoodForm: FormGroup;
  isEditMode = false;
  neighborhoodId: string | null = null;
  isLoading = false; // Para cargar datos del barrio en edición
  isLoadingCities = false; // Para cargar el selector de ciudades
  isSubmitting = false;
  error: string | null = null;
  cities: ICity[] = []; // Array para almacenar las ciudades
  private routeSub: Subscription | null = null;
  private citySub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminNeighborhoodService: AdminNeighborhoodService,
    private adminCityService: AdminCityService, // Inyectar servicio de ciudades
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.neighborhoodForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      cityId: [null, Validators.required], // ID de la ciudad seleccionada
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCities(); // Cargar ciudades al iniciar
    this.isLoading = true;
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.neighborhoodId = params.get('id');
      this.isEditMode = !!this.neighborhoodId;

      if (this.isEditMode && this.neighborhoodId) {
        this.loadNeighborhoodData(this.neighborhoodId);
      } else {
        this.isLoading = false; // No hay datos de barrio que cargar
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.citySub?.unsubscribe();
  }

  loadCities(): void {
    this.isLoadingCities = true;
    // Pedir muchas ciudades para simular "todas"
    const pagination: PaginationDto = { page: 1, limit: 1000 };
    this.citySub = this.adminCityService.getCities(pagination)
      .pipe(finalize(() => this.isLoadingCities = false))
      .subscribe({
        next: (data) => {
          this.cities = data.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente
        },
        error: (err) => {
          this.notificationService.showError('No se pudieron cargar las ciudades para seleccionar.', 'Error');
        }
      });
  }

  loadNeighborhoodData(id: string): void {
    this.adminNeighborhoodService.getNeighborhoodById(id)
      .pipe(finalize(() => this.isLoading = false)) // Finalizar carga de barrio
      .subscribe({
        next: (neighborhood) => {
          // Asegurarse de que city.id sea string
          const cityIdValue = neighborhood.city?.id?.toString() ?? null;
          this.neighborhoodForm.patchValue({
            ...neighborhood,
            cityId: cityIdValue // Asignar el ID de la ciudad al control cityId
          });
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar el barrio (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/neighborhoods']);
          }
        }
      });
  }

  onSubmit(): void {
    if (this.neighborhoodForm.invalid || this.isSubmitting) {
      this.neighborhoodForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const formData = this.neighborhoodForm.value;

    let action$: Observable<INeighborhood>;

    if (this.isEditMode && this.neighborhoodId) {
      action$ = this.adminNeighborhoodService.updateNeighborhood(this.neighborhoodId, formData);
    } else {
      action$ = this.adminNeighborhoodService.createNeighborhood(formData);
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedNeighborhood) => {
          const message = this.isEditMode
            ? `Barrio "${savedNeighborhood.name}" actualizado.`
            : `Barrio "${savedNeighborhood.name}" creado.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/neighborhoods']);
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} el barrio. Intente de nuevo.`;
          }
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/neighborhoods']);
  }

  // Getters
  get name() { return this.neighborhoodForm.get('name'); }
  get description() { return this.neighborhoodForm.get('description'); }
  get cityId() { return this.neighborhoodForm.get('cityId'); }
  get isActive() { return this.neighborhoodForm.get('isActive'); }
}