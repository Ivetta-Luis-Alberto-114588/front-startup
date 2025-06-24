// src/app/admin/pages/customer-list/customer-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ICustomer } from 'src/app/features/customers/models/icustomer';
import { AdminCustomerService, PaginatedAdminCustomersResponse } from '../../services/admin-customer.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  customerToDelete: ICustomer | null = null;

  customers: ICustomer[] = [];
  isLoading = false;
  error: string | null = null;
  private customerSub: Subscription | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0; // Este valor necesitará venir de otra fuente si la API no lo devuelve

  constructor(
    private adminCustomerService: AdminCustomerService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.customerSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.customerSub = this.adminCustomerService.getCustomers(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: PaginatedAdminCustomersResponse) => {
          this.customers = response.customers;
          this.totalItems = response.total;
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los clientes.';
          this.notificationService.showError(this.error, 'Error');
          this.customers = [];
          this.totalItems = 0;
        }
      });
  }

  // --- Métodos sin cambios ---
  goToEditCustomer(customerId: string): void {
    this.router.navigate(['/admin/customers/edit', customerId]);
  }

  loadPage(page: number): void {
    if (page === this.currentPage || this.isLoading) return;
    this.currentPage = page;
    this.loadCustomers();
  }

  openDeleteConfirmation(customer: ICustomer): void {
    if (customer.userId) {
      this.notificationService.showWarning('No se pueden eliminar clientes que son usuarios registrados. Elimina la cuenta de usuario primero.', 'Acción No Permitida');
      return;
    }
    this.customerToDelete = customer;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.customerToDelete) {
          this.confirmDelete(this.customerToDelete.id);
        }
        this.customerToDelete = null;
      },
      (reason) => {
        this.customerToDelete = null;
      }
    );
  }

  confirmDelete(customerId: string): void {
    this.isLoading = true;
    this.adminCustomerService.deleteCustomer(customerId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedCustomer) => {
          this.notificationService.showSuccess(`Cliente "${deletedCustomer.name}" eliminado.`, 'Éxito');
          this.loadCustomers();
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar el cliente.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }
}