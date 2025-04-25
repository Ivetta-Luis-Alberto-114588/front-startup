// src/app/admin/pages/neighborhood-list/neighborhood-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { INeighborhood } from 'src/app/features/customers/models/ineighborhood'; // Reutilizar interfaz
import { AdminNeighborhoodService } from '../../services/admin-neighborhood.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-neighborhood-list',
  templateUrl: './neighborhood-list.component.html',
  styleUrls: ['./neighborhood-list.component.scss']
})
export class NeighborhoodListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  neighborhoodToDelete: INeighborhood | null = null;

  neighborhoods: INeighborhood[] = [];
  isLoading = false;
  error: string | null = null;
  private neighborhoodSub: Subscription | null = null;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private adminNeighborhoodService: AdminNeighborhoodService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadNeighborhoods();
  }

  ngOnDestroy(): void {
    this.neighborhoodSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadNeighborhoods(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.neighborhoodSub = this.adminNeighborhoodService.getNeighborhoods(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.neighborhoods = data;
          this.totalItems = data.length; // Ajustar si la API devuelve paginación real
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los barrios.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreateNeighborhood(): void {
    this.router.navigate(['/admin/neighborhoods/new']);
  }

  goToEditNeighborhood(neighborhoodId: string): void {
    this.router.navigate(['/admin/neighborhoods/edit', neighborhoodId]);
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(neighborhood: INeighborhood): void {
    this.neighborhoodToDelete = neighborhood;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.neighborhoodToDelete) {
          this.confirmDelete(this.neighborhoodToDelete.id);
        }
        this.neighborhoodToDelete = null;
      },
      (reason) => {
        this.neighborhoodToDelete = null;
      }
    );
  }

  confirmDelete(neighborhoodId: string): void {
    this.isLoading = true;
    this.adminNeighborhoodService.deleteNeighborhood(neighborhoodId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedNeighborhood) => {
          this.notificationService.showSuccess(`Barrio "${deletedNeighborhood.name}" eliminado.`, 'Éxito');
          this.loadNeighborhoods(); // Recargar la lista
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar el barrio.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }

  // --- Paginación (si aplica) ---
  // loadPage(page: number): void { ... }
}