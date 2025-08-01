import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { IPaymentMethod } from 'src/app/shared/models/ipayment-method';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { AdminPaymentMethodService } from '../../services/admin-payment-method.service';
import { OrderStatusService } from 'src/app/shared/services/order-status.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { RoleService } from 'src/app/shared/services/role.service';

@Component({
  selector: 'app-payment-method-list',
  templateUrl: './payment-method-list.component.html',
  styleUrls: ['./payment-method-list.component.scss']
})
export class PaymentMethodListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  paymentMethodToDelete: IPaymentMethod | null = null;

  paymentMethods: IPaymentMethod[] = [];
  orderStatuses: IOrderStatus[] = [];
  isLoading = false;
  error: string | null = null;
  private paymentMethodSub: Subscription | null = null;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private adminPaymentMethodService: AdminPaymentMethodService,
    private orderStatusService: OrderStatusService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal,
    public roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.loadOrderStatuses();
    this.loadPaymentMethods();
  }

  ngOnDestroy(): void {
    this.paymentMethodSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadOrderStatuses(): void {
    this.orderStatusService.getOrderStatuses().subscribe({
      next: (response) => {
        this.orderStatuses = response.orderStatuses;
      },
      error: (err) => {
        console.error('Error loading order statuses:', err);
      }
    });
  }

  loadPaymentMethods(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.paymentMethodSub = this.adminPaymentMethodService.getPaymentMethods(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.paymentMethods = response.paymentMethods;
          this.totalItems = response.total;
        },
        error: (err) => {
          this.error = 'No se pudieron cargar los métodos de pago.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreatePaymentMethod(): void {
    this.router.navigate(['/admin/payment-methods/new']);
  }

  /**
   * Helper method to safely get payment method ID from backend response
   * Handles both _id and id field naming conventions
   */
  getPaymentMethodId(paymentMethod: any): string {
    return paymentMethod._id || paymentMethod.id;
  }

  /**
   * Get order status name by ID
   */
  getOrderStatusName(orderStatusId: string): string {
    const status = this.orderStatuses.find(s => s._id === orderStatusId);
    return status ? status.name : 'N/A';
  }

  goToEditPaymentMethod(paymentMethodId: string): void {
    if (!paymentMethodId) {
      this.notificationService.showError('Error: ID de método de pago no válido', 'Error');
      return;
    }

    this.roleService.canEdit().subscribe(canEdit => {
      if (canEdit) {
        this.router.navigate(['/admin/payment-methods/edit', paymentMethodId]);
      } else {
        this.notificationService.showError('No tienes permisos para editar métodos de pago', 'Acceso denegado');
      }
    });
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(paymentMethod: IPaymentMethod): void {
    this.paymentMethodToDelete = paymentMethod;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.paymentMethodToDelete) {
          const paymentMethodId = this.getPaymentMethodId(this.paymentMethodToDelete);
          this.confirmDelete(paymentMethodId);
        }
        this.paymentMethodToDelete = null;
      },
      (reason) => {
        this.paymentMethodToDelete = null;
      }
    );
  }

  confirmDelete(paymentMethodId: string): void {
    this.isLoading = true;
    this.adminPaymentMethodService.deletePaymentMethod(paymentMethodId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedPaymentMethod) => {
          this.notificationService.showSuccess(`Método de pago "${deletedPaymentMethod.name}" eliminado.`, 'Éxito');
          this.loadPaymentMethods();
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'No se pudo eliminar el método de pago.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }
}
