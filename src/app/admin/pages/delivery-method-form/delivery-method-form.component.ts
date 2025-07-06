import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { IDeliveryMethod } from '../../../shared/models/idelivery-method';
import { DeliveryMethodService } from '../../../shared/services/delivery-method.service';
import { DeliveryMethodValidationService } from '../../services/delivery-method-validation.service';

@Component({
  selector: 'app-delivery-method-form',
  templateUrl: './delivery-method-form.component.html',
  styleUrls: ['./delivery-method-form.component.scss']
})
export class DeliveryMethodFormComponent implements OnInit, OnDestroy {
  deliveryMethodForm: FormGroup;
  loading = false;
  isEditMode = false;
  methodId: string | null = null;
  private destroy$ = new Subject<void>();

  // Códigos predefinidos comunes
  predefinedCodes = [
    { value: 'SHIPPING', label: 'Envío a Domicilio' },
    { value: 'PICKUP', label: 'Retiro en Local' },
    { value: 'EXPRESS', label: 'Envío Express' },
    { value: 'STANDARD', label: 'Envío Estándar' },
    { value: 'FREE_SHIPPING', label: 'Envío Gratis' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private deliveryMethodService: DeliveryMethodService,
    private toastr: ToastrService,
    private deliveryMethodValidationService: DeliveryMethodValidationService
  ) {
    this.deliveryMethodForm = this.createForm();
  }

  ngOnInit(): void {
    this.methodId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.methodId;

    if (this.isEditMode && this.methodId) {
      this.loadDeliveryMethod(this.methodId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      code: ['', [
        Validators.required, 
        Validators.maxLength(50),
        DeliveryMethodValidationService.codeFormatValidator()
      ]],
      description: ['', [Validators.maxLength(500)]],
      price: [0, [
        Validators.required, 
        Validators.min(0),
        DeliveryMethodValidationService.reasonablePriceValidator()
      ]],
      requiresAddress: [false, Validators.required],
      isActive: [true, Validators.required],
      estimatedDeliveryDays: [1, [
        Validators.min(0), 
        Validators.max(30),
        DeliveryMethodValidationService.reasonableDeliveryDaysValidator()
      ]],
      maxWeight: [null, [
        Validators.min(0),
        DeliveryMethodValidationService.reasonableWeightValidator()
      ]],
      availableAreas: ['']
    });
  }

  loadDeliveryMethod(id: string): void {
    this.loading = true;
    this.deliveryMethodService.getAllDeliveryMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (methods) => {
          const method = methods.find(m => m.id === id);
          if (method) {
            this.populateForm(method);
          } else {
            this.toastr.error('Método de entrega no encontrado', 'Error');
            this.router.navigate(['/admin/delivery-methods']);
          }
        },
        error: (error: any) => {
          console.error('Error al cargar método:', error);
          this.toastr.error('Error al cargar el método de entrega', 'Error');
          this.router.navigate(['/admin/delivery-methods']);
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  private populateForm(method: IDeliveryMethod): void {
    this.deliveryMethodForm.patchValue({
      name: method.name,
      code: method.code,
      description: method.description || '',
      price: method.price,
      requiresAddress: method.requiresAddress,
      isActive: method.isActive,
      estimatedDeliveryDays: method.estimatedDeliveryDays || 1,
      maxWeight: method.maxWeight || null,
      availableAreas: method.availableAreas?.join(', ') || ''
    });
  }

  onSubmit(): void {
    if (this.deliveryMethodForm.valid) {
      const formData = this.prepareFormData();
      
      // Validar reglas de negocio
      const businessErrors = this.deliveryMethodValidationService.validateBusinessRules(formData);
      if (businessErrors) {
        // Mostrar advertencias pero permitir continuar
        Object.keys(businessErrors).forEach(key => {
          const error = businessErrors[key];
          this.toastr.warning(error.message, 'Advertencia de Validación');
        });
      }
      
      this.loading = true;
      const operation$ = this.isEditMode
        ? this.deliveryMethodService.updateDeliveryMethod(this.methodId!, formData)
        : this.deliveryMethodService.createDeliveryMethod(formData);

      operation$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const message = this.isEditMode
              ? 'Método de entrega actualizado correctamente'
              : 'Método de entrega creado correctamente';
            this.toastr.success(message, 'Éxito');
            this.router.navigate(['/admin/delivery-methods']);
          },
          error: (error: any) => {
            console.error('Error al guardar método:', error);
            let errorMessage = 'Error al guardar el método de entrega';
            
            if (error.status === 409) {
              errorMessage = 'Ya existe un método con ese código';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            this.toastr.error(errorMessage, 'Error');
          },
          complete: () => {
            this.loading = false;
          }
        });
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Por favor, complete todos los campos requeridos', 'Formulario Incompleto');
    }
  }

  private prepareFormData(): Omit<IDeliveryMethod, 'id'> {
    const formValue = this.deliveryMethodForm.value;
    return {
      name: formValue.name.trim(),
      code: formValue.code.toUpperCase().trim(),
      description: formValue.description?.trim() || undefined,
      price: parseFloat(formValue.price),
      requiresAddress: formValue.requiresAddress,
      isActive: formValue.isActive,
      estimatedDeliveryDays: formValue.estimatedDeliveryDays || undefined,
      maxWeight: formValue.maxWeight || undefined,
      availableAreas: formValue.availableAreas 
        ? formValue.availableAreas.split(',').map((area: string) => area.trim()).filter((area: string) => area.length > 0)
        : undefined
    };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.deliveryMethodForm.controls).forEach(key => {
      const control = this.deliveryMethodForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/delivery-methods']);
  }

  // Métodos helper para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.deliveryMethodForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.deliveryMethodForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} debe ser mayor o igual a ${field.errors['min'].min}`;
      if (field.errors['max']) return `${this.getFieldLabel(fieldName)} debe ser menor o igual a ${field.errors['max'].max}`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} solo puede contener letras mayúsculas y guiones bajos`;
      
      // Validaciones personalizadas
      if (field.errors['invalidCodeFormat']) return field.errors['invalidCodeFormat'].message;
      if (field.errors['codeTooShort']) return `El código debe tener al menos ${field.errors['codeTooShort'].minLength} caracteres`;
      if (field.errors['codeTooLong']) return `El código no puede exceder ${field.errors['codeTooLong'].maxLength} caracteres`;
      if (field.errors['negativePrice']) return 'El precio no puede ser negativo';
      if (field.errors['priceToHigh']) return `El precio no puede exceder $${field.errors['priceToHigh'].maxPrice}`;
      if (field.errors['invalidWeight']) return 'El peso debe ser un número válido mayor a 0';
      if (field.errors['weightTooHigh']) return `El peso no puede exceder ${field.errors['weightTooHigh'].maxWeight} kg`;
      if (field.errors['negativeDays']) return 'Los días de entrega no pueden ser negativos';
      if (field.errors['daysTooHigh']) return `Los días de entrega no pueden exceder ${field.errors['daysTooHigh'].maxDays}`;
      if (field.errors['invalidDays']) return 'Los días de entrega deben ser un número válido';
      if (field.errors['codeExists']) return 'Ya existe un método con este código';
      if (field.errors['nameExists']) return 'Ya existe un método con este nombre';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nombre',
      code: 'Código',
      description: 'Descripción',
      price: 'Precio',
      estimatedDeliveryDays: 'Días de entrega',
      maxWeight: 'Peso máximo'
    };
    return labels[fieldName] || fieldName;
  }

  onCodeSelect(code: string): void {
    this.deliveryMethodForm.patchValue({ code });
  }
}
