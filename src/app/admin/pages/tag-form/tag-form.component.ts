// src/app/admin/pages/tag-form/tag-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminTagService } from '../../services/admin-tag.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ITag } from 'src/app/features/products/model/itag'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-tag-form',
  templateUrl: './tag-form.component.html',
  styleUrls: ['./tag-form.component.scss']
})
export class TagFormComponent implements OnInit, OnDestroy {

  tagForm: FormGroup;
  isEditMode = false;
  tagId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminTagService: AdminTagService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.tagForm = this.fb.group({
      // El nombre se guardará en minúsculas en el backend
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''], // Opcional
      isActive: [true] // Valor por defecto al crear
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.tagId = params.get('id');
      this.isEditMode = !!this.tagId;

      if (this.isEditMode && this.tagId) {
        this.loadTagData(this.tagId);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadTagData(id: string): void {
    this.adminTagService.getTagById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (tag) => {
          // Rellenar formulario, incluyendo description si es null/undefined
          this.tagForm.patchValue({
            name: tag.name,
            description: tag.description ?? '', // Asegurar que sea string vacío si es null/undefined
            isActive: tag.isActive
          });
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar la etiqueta (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/tags']);
          }
        }
      });
  }

  onSubmit(): void {
    if (this.tagForm.invalid || this.isSubmitting) {
      this.tagForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    // Obtener datos y asegurar que el nombre va en minúsculas
    const formData = {
      ...this.tagForm.value,
      name: this.tagForm.value.name.toLowerCase().trim() // Convertir a minúsculas y quitar espacios
    };

    // Si la descripción está vacía, enviarla como null o undefined según prefiera tu backend
    // Aquí la enviamos como string vacío si está vacía, o null si es null explícitamente
    // Si tu backend prefiere que no se envíe la clave si está vacía, necesitarías filtrar el objeto.
    if (formData.description === '') {
      // formData.description = null; // Opcional: enviar null si está vacío
    }


    let action$: Observable<ITag>;

    if (this.isEditMode && this.tagId) {
      action$ = this.adminTagService.updateTag(this.tagId, formData);
    } else {
      action$ = this.adminTagService.createTag(formData);
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedTag) => {
          const message = this.isEditMode
            ? `Etiqueta "${savedTag.name}" actualizada.`
            : `Etiqueta "${savedTag.name}" creada.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/tags']); // Volver a la lista
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} la etiqueta. Intente de nuevo.`;
          }
          this.notificationService.showError(this.error ?? 'Unknown error occurred', 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/tags']); // Volver a la lista de tags
  }

  // Getters para acceso fácil en la plantilla
  get name() { return this.tagForm.get('name'); }
  get description() { return this.tagForm.get('description'); }
  get isActive() { return this.tagForm.get('isActive'); }
}