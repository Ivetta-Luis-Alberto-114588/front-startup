import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { AdminOrderStatusService } from '../../services/admin-order-status.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

declare var bootstrap: any;

@Component({
  selector: 'app-order-status-list',
  templateUrl: './order-status-list.component.html',
  styleUrls: ['./order-status-list.component.scss']
})
export class OrderStatusListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Exponer Math para usar en el template
  Math = Math;

  // Estados del componente
  isLoading = true;
  error: string | null = null;
  orderStatuses: IOrderStatus[] = [];

  // Paginación
  currentPage = 1;
  limit = 10;
  totalItems = 0;
  totalPages = 0;

  // Modal de confirmación
  selectedOrderStatus: IOrderStatus | null = null;
  private deleteModal: any;

  constructor(
    private orderStatusService: AdminOrderStatusService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOrderStatuses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.deleteModal) {
      this.deleteModal.dispose();
    }
  }
  loadOrderStatuses(): void {
    this.isLoading = true;
    this.error = null;

    const pagination: PaginationDto = {
      page: this.currentPage,
      limit: this.limit
    };

    this.orderStatusService.getOrderStatuses(pagination)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)      )      .subscribe({
        next: (response) => {
          this.orderStatuses = response.orderStatuses;
          this.totalItems = response.total;
          this.totalPages = Math.ceil(this.totalItems / this.limit);
        },
        error: (error) => {
          console.error('Error loading order statuses:', error);
          this.error = 'Error al cargar los estados de pedidos: ' + (error.error?.message || error.message);
        }
      });
  }

  goToCreateOrderStatus(): void {
    this.router.navigate(['/admin/order-statuses/new']);
  }  editOrderStatus(orderStatus: IOrderStatus): void {
    // El backend devuelve 'id' en lugar de '_id'
    const statusId = orderStatus._id || (orderStatus as any).id;
    
    if (!statusId) {
      this.error = 'Error: El ID del estado no está definido';
      return;
    }
    
    this.router.navigate(['/admin/order-statuses/edit', statusId]);
  }openDeleteModal(orderStatus: IOrderStatus): void {
    // El backend devuelve 'id' en lugar de '_id'
    const statusId = orderStatus._id || (orderStatus as any).id;
    
    if (!statusId) {
      this.error = 'Error: El ID del estado no está definido';
      return;
    }
    
    this.selectedOrderStatus = orderStatus;
    const modalElement = document.getElementById('deleteModal');
    
    if (modalElement) {
      this.deleteModal = new bootstrap.Modal(modalElement);
      this.deleteModal.show();
    }
  }
  confirmDelete(): void {
    if (!this.selectedOrderStatus) return;

    // El backend devuelve 'id' en lugar de '_id'
    const statusId = this.selectedOrderStatus._id || (this.selectedOrderStatus as any).id;
    
    if (!statusId) {
      this.error = 'Error: El ID del estado no está definido';
      return;
    }

    this.orderStatusService.deleteOrderStatus(statusId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadOrderStatuses();
          if (this.deleteModal) {
            this.deleteModal.hide();
          }
          this.selectedOrderStatus = null;
        },
        error: (error) => {
          console.error('Error deleting order status:', error);
          this.error = 'Error al eliminar el estado: ' + (error.error?.message || error.message);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOrderStatuses();
  }
  getPriorityClass(priority: number): string {
    if (priority <= 30) return 'low';
    if (priority <= 70) return 'medium';
    return 'high';
  }

  getPriorityBadgeClass(priority: number): string {
    if (priority <= 30) return 'bg-success';
    if (priority <= 70) return 'bg-warning';
    return 'bg-danger';
  }

  hasValidId(orderStatus: IOrderStatus): boolean {
    return !!(orderStatus._id || (orderStatus as any).id);
  }
}
