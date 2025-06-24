// src/app/admin/pages/tag-list/tag-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ITag } from 'src/app/features/products/model/itag'; // Ajusta la ruta si es necesario
import { AdminTagService } from '../../services/admin-tag.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.scss']
})
export class TagListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  tagToDelete: ITag | null = null;

  tags: ITag[] = [];
  isLoading = false;
  error: string | null = null;
  private tagSub: Subscription | null = null;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private adminTagService: AdminTagService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadTags();
  }

  ngOnDestroy(): void {
    this.tagSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadTags(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.tagSub = this.adminTagService.getTags(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          // Asumiendo que devuelve ITag[] directamente
          this.tags = data;
          this.totalItems = data.length; // Ajustar si la API devuelve paginación real
        },
        error: (err) => {
          this.error = 'No se pudieron cargar las etiquetas.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreateTag(): void {
    this.router.navigate(['/admin/tags/new']);
  }

  goToEditTag(tagId: string): void {
    this.router.navigate(['/admin/tags/edit', tagId]);
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(tag: ITag): void {
    this.tagToDelete = tag;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.tagToDelete) {
          this.confirmDelete(this.tagToDelete.id);
        }
        this.tagToDelete = null;
      },
      (reason) => {
        this.tagToDelete = null;
      }
    );
  }

  confirmDelete(tagId: string): void {
    this.isLoading = true; // O usar un flag 'isDeleting'
    this.adminTagService.deleteTag(tagId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedTag) => {
          this.notificationService.showSuccess(`Etiqueta "${deletedTag.name}" eliminada.`, 'Éxito');
          this.loadTags(); // Recargar la lista
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar la etiqueta.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }

  // --- Paginación ---
  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) return;
    this.currentPage = page;
    this.loadTags();
  }
}