// src/app/admin/pages/city-form/city-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminCityService } from '../../services/admin-city.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ICity } from 'src/app/features/customers/models/icity';

@Component({
  selector: 'app-city-form',
  templateUrl: './city-form.component.html',
  styleUrls: ['./city-form.component.scss']
})
export class CityFormComponent implements OnInit, OnDestroy {

  cityForm: FormGroup;
  isEditMode = false;
  cityId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminCityService: AdminCityService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.cityForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.cityId = params.get('id');
      this.isEditMode = !!this.cityId;

      if (this.isEditMode && this.cityId) {
        this.loadCityData(this.cityId);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadCityData(id: string): void {
    this.adminCityService.getCityById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (city) => {
          this.cityForm.patchValue(city);
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar la ciudad (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/cities']);
          }
        }
      });
  }

  onSubmit(): void {
    if (this.cityForm.invalid || this.isSubmitting) {
      this.cityForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const formData = this.cityForm.value;

    let action$: Observable<ICity>;

    if (this.isEditMode && this.cityId) {
      action$ = this.adminCityService.updateCity(this.cityId, formData);
    } else {
      action$ = this.adminCityService.createCity(formData);
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedCity) => {
          const message = this.isEditMode
            ? `Ciudad "${savedCity.name}" actualizada.`
            : `Ciudad "${savedCity.name}" creada.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/cities']);
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} la ciudad. Intente de nuevo.`;
          }
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/cities']);
  }

  // Getters
  get name() { return this.cityForm.get('name'); }
  get description() { return this.cityForm.get('description'); }
  get isActive() { return this.cityForm.get('isActive'); }
}