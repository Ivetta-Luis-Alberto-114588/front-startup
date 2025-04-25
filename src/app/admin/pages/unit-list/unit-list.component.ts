// src/app/admin/pages/unit-list/unit-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { IUnit } from 'src/app/features/products/model/iunit'; // Reutilizar interfaz
import { AdminUnitService } from '../../services/admin-unit.service'; // Usar el servicio de admin
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-unit-list',
  templateUrl: './unit-list.component.html',
  styleUrls: ['./unit-list.component.scss']
})
export class UnitListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  unitToDelete: IUnit | null = null;

  units: IUnit[] = [];
  isLoading = false;
  error: string | null = null;
  private unitSub: Subscription | null = null;

  // Paginación (ajusta según necesites)
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0; // Necesitarás que la API devuelva el total si quieres paginación real

  constructor(
    private adminUnitService: AdminUnitService, // Usar el servicio de admin
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadUnits();
  }

  ngOnDestroy(): void {
    this.unitSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadUnits(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.unitSub = this.adminUnitService.getUnits(pagination) // Llamar al método del servicio de admin
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          // Si tu API devuelve PaginatedUnitsResponse:
          // this.units = data.units;
          // this.totalItems = data.total;
          // Si devuelve IUnit[] directamente:
          this.units = data;
          this.totalItems = data.length; // Asumiendo que no hay paginación real en API aún
        },
        error: (err) => {
          this.error = 'No se pudieron cargar las unidades de medida.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreateUnit(): void {
    this.router.navigate(['/admin/units/new']); // Ruta correcta
  }

  goToEditUnit(unitId: string): void {
    this.router.navigate(['/admin/units/edit', unitId]); // Ruta correcta
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(unit: IUnit): void {
    this.unitToDelete = unit;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.unitToDelete) {
          this.confirmDelete(this.unitToDelete.id);
        }
        this.unitToDelete = null;
      },
      (reason) => {
        this.unitToDelete = null;
      }
    );
  }

  confirmDelete(unitId: string): void {
    this.isLoading = true;
    this.adminUnitService.deleteUnit(unitId) // Llamar al método del servicio de admin
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedUnit) => {
          this.notificationService.showSuccess(`Unidad "${deletedUnit.name}" eliminada.`, 'Éxito');
          this.loadUnits(); // Recargar la lista
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar la unidad.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }

  // --- Paginación (si aplica) ---
  // loadPage(page: number): void {
  //   if (page === this.currentPage || this.isLoading) return;
  //   this.currentPage = page;
  //   this.loadUnits();
  // }
}