import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { IOrderStatus } from 'src/app/shared/models/iorder-status';
import { AdminOrderStatusService, IOrderStatusCreateDto, IOrderStatusUpdateDto } from '../../services/admin-order-status.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-order-status-form',
  templateUrl: './order-status-form.component.html',
  styleUrls: ['./order-status-form.component.scss']
})
export class OrderStatusFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estados del componente
  isLoading = false;
  isEditMode = false;
  isSaving = false;
  error: string | null = null;
  orderStatusId: string | null = null;

  // Formulario
  orderStatusForm: FormGroup;

  // Datos para selecciones
  availableOrderStatuses: IOrderStatus[] = [];

  // Colores predefinidos
  predefinedColors = [
    '#6c757d', // Pendiente (gris)
    '#ffc107', // En proceso (amarillo)
    '#28a745', // Pagado (verde)
    '#17a2b8', // Preparando (cyan)
    '#007bff', // Listo (azul)
    '#fd7e14', // Enviado (naranja)
    '#20c997', // Completado (teal)
    '#dc3545', // Cancelado (rojo)
    '#6f42c1', // Devuelto (púrpura)
    '#e83e8c'  // Personalizado (rosa)
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private orderStatusService: AdminOrderStatusService
  ) {
    this.orderStatusForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAvailableOrderStatuses();
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      description: ['', [Validators.maxLength(200)]],
      color: ['#6c757d', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      order: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
      isActive: [true],
      isDefault: [false],
      canTransitionTo: [[]]
    });
  }
  private checkRouteParams(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.orderStatusId = params['id'];
        if (this.orderStatusId) {
          this.loadOrderStatus(this.orderStatusId);
        }
      }
    });
  }

  private loadAvailableOrderStatuses(): void {
    this.orderStatusService.getOrderStatuses({ page: 1, limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.availableOrderStatuses = response.orderStatuses;
        },
        error: (error) => {
          console.error('Error loading order statuses:', error);
        }
      });
  }
  private loadOrderStatus(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.orderStatusService.getOrderStatusById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (orderStatus: IOrderStatus) => {
          this.orderStatusForm.patchValue({
            name: orderStatus.name,
            code: orderStatus.name.toLowerCase().replace(/\s+/g, '_'), // Generate code from name if not available
            description: orderStatus.description || '',
            color: orderStatus.color,
            order: orderStatus.priority,
            isActive: true,
            isDefault: false,
            canTransitionTo: orderStatus.allowedTransitions || []
          });
        },
        error: (error: any) => {
          console.error('Error loading order status:', error);
          this.error = 'Error al cargar el estado: ' + (error.error?.message || error.message);
        }
      });
  }

  selectColor(color: string): void {
    this.orderStatusForm.patchValue({ color });
  }
  onTransitionChange(orderStatusId: string, event: any): void {
    const currentTransitions = this.orderStatusForm.get('canTransitionTo')?.value || [];
    if (event.target.checked) {
      if (!currentTransitions.includes(orderStatusId)) {
        this.orderStatusForm.patchValue({
          canTransitionTo: [...currentTransitions, orderStatusId]
        });
      }
    } else {
      this.orderStatusForm.patchValue({
        canTransitionTo: currentTransitions.filter((id: string) => id !== orderStatusId)
      });
    }
  }

  isTransitionSelected(orderStatusId: string): boolean {
    const transitions = this.orderStatusForm.get('canTransitionTo')?.value || [];
    return transitions.includes(orderStatusId);
  }
  onSubmit(): void {
    if (this.orderStatusForm.invalid) {
      this.orderStatusForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;

    const formValue = this.orderStatusForm.value;

    if (this.isEditMode && this.orderStatusId) {
      // Actualizar
      const updateDto: IOrderStatusUpdateDto = {
        name: formValue.name,
        code: formValue.code,
        description: formValue.description,
        color: formValue.color,
        order: formValue.order,
        isActive: formValue.isActive,
        isDefault: formValue.isDefault,
        canTransitionTo: formValue.canTransitionTo
      };

      this.orderStatusService.updateOrderStatus(this.orderStatusId, updateDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: () => {
            this.router.navigate(['/admin/order-statuses']);
          },
          error: (error) => {
            console.error('Error updating order status:', error);
            this.error = 'Error al actualizar el estado: ' + (error.error?.message || error.message);
          }
        });
    } else {
      // Crear
      const createDto: IOrderStatusCreateDto = {
        name: formValue.name,
        code: formValue.code,
        description: formValue.description,
        color: formValue.color,
        order: formValue.order,
        isActive: formValue.isActive,
        isDefault: formValue.isDefault,
        canTransitionTo: formValue.canTransitionTo
      };

      this.orderStatusService.createOrderStatus(createDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: () => {
            this.router.navigate(['/admin/order-statuses']);
          },
          error: (error) => {
            console.error('Error creating order status:', error);
            this.error = 'Error al crear el estado: ' + (error.error?.message || error.message);
          }
        });
    }
  }

  goBack(): void {
    this.location.back();
  }
  // Getters para validación
  get name() { return this.orderStatusForm.get('name'); }
  get code() { return this.orderStatusForm.get('code'); }
  get description() { return this.orderStatusForm.get('description'); }
  get color() { return this.orderStatusForm.get('color'); }
  get order() { return this.orderStatusForm.get('order'); }
  get isActive() { return this.orderStatusForm.get('isActive'); }
  get isDefault() { return this.orderStatusForm.get('isDefault'); }
  get canTransitionTo() { return this.orderStatusForm.get('canTransitionTo'); }
}
