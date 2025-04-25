// src/app/admin/pages/coupon-list/coupon-list.component.ts
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ICoupon } from 'src/app/shared/models/icoupon'; // Ajusta la ruta si es necesario
import { AdminCouponService } from '../../services/admin-coupon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-coupon-list',
  templateUrl: './coupon-list.component.html',
  styleUrls: ['./coupon-list.component.scss']
})
export class CouponListComponent implements OnInit, OnDestroy {

  @ViewChild('confirmDeleteModal') private modalContent!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  couponToDelete: ICoupon | null = null;

  coupons: ICoupon[] = [];
  isLoading = false;
  error: string | null = null;
  private couponSub: Subscription | null = null;

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private adminCouponService: AdminCouponService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadCoupons();
  }

  ngOnDestroy(): void {
    this.couponSub?.unsubscribe();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadCoupons(): void {
    this.isLoading = true;
    this.error = null;
    const pagination: PaginationDto = { page: this.currentPage, limit: this.itemsPerPage };

    this.couponSub = this.adminCouponService.getCoupons(pagination)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.coupons = data;
          this.totalItems = data.length; // Ajustar si la API devuelve paginación real
        },
        error: (err) => {
          console.error("Error loading coupons:", err);
          this.error = 'No se pudieron cargar los cupones.';
          this.notificationService.showError(this.error, 'Error');
        }
      });
  }

  // --- Métodos para Navegación ---
  goToCreateCoupon(): void {
    this.router.navigate(['/admin/coupons/new']);
  }

  goToEditCoupon(couponId: string): void {
    this.router.navigate(['/admin/coupons/edit', couponId]);
  }

  // --- Métodos para Eliminar con Confirmación ---
  openDeleteConfirmation(coupon: ICoupon): void {
    this.couponToDelete = coupon;
    this.modalRef = this.modalService.open(this.modalContent, { ariaLabelledBy: 'modal-basic-title', centered: true });

    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.couponToDelete) {
          this.confirmDelete(this.couponToDelete.id);
        }
        this.couponToDelete = null;
      },
      (reason) => {
        this.couponToDelete = null;
      }
    );
  }

  confirmDelete(couponId: string): void {
    this.isLoading = true;
    this.adminCouponService.deleteCoupon(couponId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (deletedCoupon) => {
          this.notificationService.showSuccess(`Cupón "${deletedCoupon.code}" eliminado.`, 'Éxito');
          this.loadCoupons(); // Recargar la lista
        },
        error: (err) => {
          console.error(`Error deleting coupon ${couponId}:`, err);
          const errorMsg = err.error?.error || 'No se pudo eliminar el cupón.';
          this.notificationService.showError(errorMsg, 'Error al Eliminar');
        }
      });
  }

  // --- Paginación (si aplica) ---
  // loadPage(page: number): void { ... }
}