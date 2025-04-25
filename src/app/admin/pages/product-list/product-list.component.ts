// src/app/admin/pages/product-list/product-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Location } from '@angular/common';

import { IProduct } from 'src/app/features/products/model/iproduct';
import { AdminProductService, PaginatedAdminProductsResponse } from '../../services/admin-product.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  productToDelete: IProduct | null = null;

  products: IProduct[] = [];
  isLoading = false;
  error: string | null = null;
  private productSub: Subscription | null = null;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10; // O el límite que prefieras
  totalItems = 0;

  constructor(
    private adminProductService: AdminProductService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.productSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.productSub = this.adminProductService.getProducts(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: PaginatedAdminProductsResponse) => {
          this.products = response.products;
          console.log('Productos cargados:', response);
          this.totalItems = response.total;
          // Calcular totalPages si es necesario para la UI
        },
        error: (err) => {
          console.error("Error loading products:", err);
          this.error = 'No se pudieron cargar los productos.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreateProduct(): void {
    this.router.navigate(['/admin/products/new']);
  }

  goToEditProduct(productId: string): void {
    this.router.navigate(['/admin/products/edit', productId]);
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(product: IProduct): void {
    this.productToDelete = product;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.productToDelete) {
          this.confirmDelete(this.productToDelete.id);
        }
        this.productToDelete = null;
      },
      (reason) => {
        this.productToDelete = null;
      }
    );
  }

  confirmDelete(productId: string): void {
    this.isLoading = true; // O usar un flag 'isDeleting'
    this.adminProductService.deleteProduct(productId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedProduct) => {
          this.notificationService.showSuccess(`Producto "${deletedProduct.name}" eliminado.`, 'Éxito');
          // Optimización: eliminar de la lista local en lugar de recargar todo
          this.products = this.products.filter(p => p.id !== productId);
          this.totalItems--; // Ajustar total si se usa paginación
          // Opcional: this.loadProducts(); // Si prefieres recargar
        },
        error: (err) => {
          console.error(`Error deleting product ${productId}:`, err);
          const errorMsg = err.error?.error || 'No se pudo eliminar el producto.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }

  // --- Paginación ---
  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) return;
    this.currentPage = page;
    this.loadProducts();
  }

  goBack(): void {
    this.location.back();
  }
}