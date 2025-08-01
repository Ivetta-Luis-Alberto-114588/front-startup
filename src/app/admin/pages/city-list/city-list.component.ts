// src/app/admin/pages/city-list/city-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ICity } from 'src/app/features/customers/models/icity'; // Reutilizar interfaz
import { AdminCityService } from '../../services/admin-city.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { RoleService } from 'src/app/shared/services/role.service';

@Component({
  selector: 'app-city-list',
  templateUrl: './city-list.component.html',
  styleUrls: ['./city-list.component.scss']
})
export class CityListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  cityToDelete: ICity | null = null;

  cities: ICity[] = [];
  isLoading = false;
  error: string | null = null;
  private citySub: Subscription | null = null;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private adminCityService: AdminCityService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal,
    public roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.loadCities();
  }

  ngOnDestroy(): void {
    this.citySub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadCities(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.citySub = this.adminCityService.getCities(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.cities = data;
          this.totalItems = data.length; // Ajustar si la API devuelve paginación real
        },
        error: (err) => {
          this.error = 'No se pudieron cargar las ciudades.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreateCity(): void {
    this.router.navigate(['/admin/cities/new']);
  }

  goToEditCity(cityId: string): void {
    this.roleService.canEdit().subscribe(canEdit => {
      if (canEdit) {
        this.router.navigate(['/admin/cities/edit', cityId]);
      } else {
        this.notificationService.showError('No tienes permisos para editar ciudades', 'Acceso denegado');
      }
    });
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(city: ICity): void {
    this.cityToDelete = city;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.cityToDelete) {
          this.confirmDelete(this.cityToDelete.id);
        }
        this.cityToDelete = null;
      },
      (reason) => {
        this.cityToDelete = null;
      }
    );
  }

  confirmDelete(cityId: string): void {
    this.isLoading = true;
    this.adminCityService.deleteCity(cityId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedCity) => {
          this.notificationService.showSuccess(`Ciudad "${deletedCity.name}" eliminada.`, 'Éxito');
          this.loadCities(); // Recargar la lista
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar la ciudad.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }

  // --- Paginación (si aplica) ---
  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) return;
    this.currentPage = page;
    this.loadCities();
  }
}