// src/app/admin/pages/unit-form/unit-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminUnitService } from '../../services/admin-unit.service'; // Usar servicio admin
import { NotificationService } from 'src/app/shared/services/notification.service';
import { IUnit } from 'src/app/features/products/model/iunit'; // Reutilizar interfaz

@Component({
  selector: 'app-unit-form',
  templateUrl: './unit-form.component.html',
  styleUrls: ['./unit-form.component.scss']
})
export class UnitFormComponent implements OnInit, OnDestroy {

  unitForm: FormGroup;
  isEditMode = false;
  unitId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminUnitService: AdminUnitService, // Usar servicio admin
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.unitForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      isActive: [true] // Valor por defecto al crear
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.unitId = params.get('id');
      this.isEditMode = !!this.unitId;

      if (this.isEditMode && this.unitId) {
        this.loadUnitData(this.unitId);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadUnitData(id: string): void {
    this.adminUnitService.getUnitById(id) // Usar servicio admin
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (unit) => {
          this.unitForm.patchValue(unit);
        },
        error: (err: HttpErrorResponse) => {
          console.error(`Error loading unit ${id}:`, err);
          this.error = err.error?.error || `No se pudo cargar la unidad (Status: ${err.status}).`;
          this.notificationService.showError(this.error || 'Unknown error', 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/units']); // Volver a la lista si no se encuentra
          }
        }
      });
  }

  onSubmit(): void {
    if (this.unitForm.invalid || this.isSubmitting) {
      this.unitForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const formData = this.unitForm.value;

    let action$: Observable<IUnit>;

    if (this.isEditMode && this.unitId) {
      action$ = this.adminUnitService.updateUnit(this.unitId, formData); // Usar servicio admin
    } else {
      action$ = this.adminUnitService.createUnit(formData); // Usar servicio admin
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedUnit) => {
          const message = this.isEditMode
            ? `Unidad "${savedUnit.name}" actualizada.`
            : `Unidad "${savedUnit.name}" creada.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/units']); // Volver a la lista
        },
        error: (err: HttpErrorResponse) => {
          console.error("Error saving unit:", err);
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} la unidad. Intente de nuevo.`;
          }
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/units']); // Volver a la lista de unidades
  }

  // Getters para acceso fácil en la plantilla
  get name() { return this.unitForm.get('name'); }
  get description() { return this.unitForm.get('description'); }
  get isActive() { return this.unitForm.get('isActive'); }
}