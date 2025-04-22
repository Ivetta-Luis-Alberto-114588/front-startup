// src/app/admin/pages/category-form/category-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http'; // <-- Importar HttpErrorResponse

import { AdminCategoryService } from '../../services/admin-category.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ICategory } from 'src/app/features/products/model/icategory';
// Eliminar la importación incorrecta:
// import { CustomError } from 'src/app/domain/errors/custom.error';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit, OnDestroy {

  categoryForm: FormGroup;
  isEditMode = false;
  categoryId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminCategoryService: AdminCategoryService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      isActive: [true] // Valor por defecto al crear
    });
  }

  ngOnInit(): void {
    this.isLoading = true; // Empezar cargando
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.categoryId = params.get('id');
      this.isEditMode = !!this.categoryId;

      if (this.isEditMode && this.categoryId) {
        this.loadCategoryData(this.categoryId);
      } else {
        this.isLoading = false; // No hay nada que cargar si es nuevo
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadCategoryData(id: string): void {
    this.adminCategoryService.getCategoryById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (category) => {
          this.categoryForm.patchValue(category); // Rellenar formulario con datos existentes
        },
        error: (err: HttpErrorResponse) => { // Tipar el error
          console.error(`Error loading category ${id}:`, err);
          // Intentar obtener el mensaje del backend
          this.error = err.error?.error || `No se pudo cargar la categoría (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
          // Opcional: Redirigir si no se encuentra (404)
          if (err.status === 404) {
            this.router.navigate(['/admin/categories']);
          }
        }
      });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid || this.isSubmitting) {
      this.categoryForm.markAllAsTouched(); // Mostrar errores si los hay
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const formData = this.categoryForm.value;

    let action$: Observable<ICategory>;

    if (this.isEditMode && this.categoryId) {
      action$ = this.adminCategoryService.updateCategory(this.categoryId, formData);
    } else {
      action$ = this.adminCategoryService.createCategory(formData);
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedCategory) => {
          const message = this.isEditMode
            ? `Categoría "${savedCategory.name}" actualizada.`
            : `Categoría "${savedCategory.name}" creada.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/categories']); // Volver a la lista
        },
        error: (err: HttpErrorResponse) => { // Tipar el error
          console.error("Error saving category:", err);
          // --- CORRECCIÓN AQUÍ ---
          // Ya no usamos 'instanceof CustomError'
          // Intentamos obtener el mensaje específico del backend desde err.error.error
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            // Fallback a un mensaje genérico
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} la categoría. Intente de nuevo.`;
          }
          // --- FIN CORRECCIÓN ---
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/categories']);
  }

  // Getters para acceso fácil en la plantilla
  get name() { return this.categoryForm.get('name'); }
  get description() { return this.categoryForm.get('description'); }
  // Getter para isActive (opcional, pero útil si necesitas validación específica)
  get isActive() { return this.categoryForm.get('isActive'); }
}