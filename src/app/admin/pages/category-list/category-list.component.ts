// src/app/admin/pages/category-list/category-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ICategory } from 'src/app/features/products/model/icategory';
import { AdminCategoryService } from '../../services/admin-category.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  categoryToDelete: ICategory | null = null;

  categories: ICategory[] = [];
  isLoading = false;
  error: string | null = null;
  private categorySub: Subscription | null = null;

  // Paginación (ajusta según necesites)
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0; // Necesitarás que la API devuelva el total si quieres paginación real

  constructor(
    private adminCategoryService: AdminCategoryService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.categorySub?.unsubscribe();
    if (this.modalRef) { // Asegurarse de cerrar el modal si el componente se destruye
      this.modalRef.close();
    }
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.categorySub = this.adminCategoryService.getCategories(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          // Si tu API devuelve PaginatedCategoriesResponse:
          // this.categories = data.categories;
          // this.totalItems = data.total;
          // Si devuelve ICategory[] directamente:
          this.categories = data;
          // En este caso, la paginación del frontend será limitada o necesitarás otro endpoint para el total
          this.totalItems = data.length; // Asumiendo que no hay paginación real en API aún
        },
        error: (err) => {
          this.error = 'No se pudieron cargar las categorías.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreateCategory(): void {
    this.router.navigate(['/admin/categories/new']);
  }

  goToEditCategory(categoryId: string): void {
    this.router.navigate(['/admin/categories/edit', categoryId]);
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(category: ICategory): void {
    this.categoryToDelete = category;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.categoryToDelete) {
          this.confirmDelete(this.categoryToDelete.id);
        }
        this.categoryToDelete = null; // Limpiar después de cerrar
      },
      (reason) => {
        this.categoryToDelete = null; // Limpiar si se descarta
      }
    );
  }

  confirmDelete(categoryId: string): void {
    this.isLoading = true; // Podrías usar otro flag específico para 'deleting'
    this.adminCategoryService.deleteCategory(categoryId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedCategory) => {
          this.notificationService.showSuccess(`Categoría "${deletedCategory.name}" eliminada.`, 'Éxito');
          this.loadCategories(); // Recargar la lista
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar la categoría.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }

  // --- Paginación (si aplica) ---
  // loadPage(page: number): void {
  //   if (page === this.currentPage || this.isLoading) return;
  //   this.currentPage = page;
  //   this.loadCategories();
  // }
}