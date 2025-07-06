import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { IDeliveryMethod } from '../../../shared/models/idelivery-method';
import { DeliveryMethodService } from '../../../shared/services/delivery-method.service';
import { RoleService } from '../../../shared/services/role.service';

@Component({
    selector: 'app-delivery-method-list',
    templateUrl: './delivery-method-list.component.html',
    styleUrls: ['./delivery-method-list.component.scss']
})
export class DeliveryMethodListComponent implements OnInit, OnDestroy {
    deliveryMethods$: Observable<IDeliveryMethod[]>;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(
        private deliveryMethodService: DeliveryMethodService,
        private toastr: ToastrService,
        public roleService: RoleService
    ) {
        this.deliveryMethods$ = this.deliveryMethodService.getAllDeliveryMethods();
    }

    ngOnInit(): void {
        this.loadDeliveryMethods();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDeliveryMethods(): void {
        this.loading = true;
        this.deliveryMethods$ = this.deliveryMethodService.getAllDeliveryMethods();
        this.loading = false;
    }

    toggleActive(method: IDeliveryMethod): void {
        this.loading = true;
        const updatedMethod = { ...method, isActive: !method.isActive };

        this.deliveryMethodService.updateDeliveryMethod(method.id, updatedMethod)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.toastr.success(
                        `Método ${updatedMethod.isActive ? 'activado' : 'desactivado'} correctamente`,
                        'Método actualizado'
                    );
                    this.loadDeliveryMethods();
                },
                error: (error: any) => {
                    console.error('Error al actualizar método:', error);
                    this.toastr.error('Error al actualizar el método de entrega', 'Error');
                },
                complete: () => {
                    this.loading = false;
                }
            });
    }

    deleteMethod(method: IDeliveryMethod): void {
        if (confirm(`¿Está seguro que desea eliminar el método "${method.name}"?`)) {
            this.loading = true;

            this.deliveryMethodService.deleteDeliveryMethod(method.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.toastr.success('Método eliminado correctamente', 'Método eliminado');
                        this.loadDeliveryMethods();
                    },
                    error: (error: any) => {
                        console.error('Error al eliminar método:', error);
                        this.toastr.error('Error al eliminar el método de entrega', 'Error');
                    },
                    complete: () => {
                        this.loading = false;
                    }
                });
        }
    }

    refreshList(): void {
        this.loadDeliveryMethods();
        this.toastr.info('Lista actualizada', 'Actualización');
    }

    // Helper methods for template
    trackByMethodId(index: number, method: IDeliveryMethod): string {
        return method.id;
    }

    getMethodIcon(code: string): string {
        switch (code?.toUpperCase()) {
            case 'SHIPPING':
            case 'DELIVERY':
                return 'bi-truck';
            case 'PICKUP':
                return 'bi-shop';
            case 'EXPRESS':
                return 'bi-lightning-fill';
            default:
                return 'bi-box-seam';
        }
    }

    getActiveMethodsCount(methods: IDeliveryMethod[]): number {
        return methods.filter(method => method.isActive).length;
    }

    getShippingMethodsCount(methods: IDeliveryMethod[]): number {
        return methods.filter(method => method.requiresAddress).length;
    }

    getPickupMethodsCount(methods: IDeliveryMethod[]): number {
        return methods.filter(method => !method.requiresAddress).length;
    }

    /**
     * Muestra los detalles de un método de entrega
     * @param method - Método de entrega a mostrar
     */
    viewMethod(method: IDeliveryMethod): void {
        // Por ahora mostrar en un alert, después se puede implementar un modal
        const details = `
Detalles del Método de Entrega:

Nombre: ${method.name}
Código: ${method.code}
Precio: $${method.price}
Días estimados: ${method.estimatedDeliveryDays || 'No especificado'}
Peso máximo: ${method.maxWeight || 'Sin límite'} kg
Requiere dirección: ${method.requiresAddress ? 'Sí' : 'No'}
Estado: ${method.isActive ? 'Activo' : 'Inactivo'}
Áreas disponibles: ${method.availableAreas?.join(', ') || 'No especificado'}
Descripción: ${method.description || 'Sin descripción'}
        `.trim();

        alert(details);
    }
}
