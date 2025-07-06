import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DeliveryMethodService } from '../../shared/services/delivery-method.service';
import { IDeliveryMethod } from '../../shared/models/idelivery-method';

@Injectable({
    providedIn: 'root'
})
export class DeliveryMethodValidationService {

    constructor(private deliveryMethodService: DeliveryMethodService) { }

    /**
     * Validador para códigos únicos de métodos de entrega
     */
    uniqueCodeValidator(currentMethodId?: string): ValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (!control.value) {
                return of(null);
            }

            return this.deliveryMethodService.getAllDeliveryMethods().pipe(
                map((methods: IDeliveryMethod[]) => {
                    const existingMethod = methods.find((method: IDeliveryMethod) =>
                        method.code.toUpperCase() === control.value.toUpperCase() &&
                        method.id !== currentMethodId
                    );
                    return existingMethod ? { codeExists: true } : null;
                }),
                catchError(() => of(null))
            );
        };
    }

    /**
     * Validador para nombres únicos de métodos de entrega
     */
    uniqueNameValidator(currentMethodId?: string): ValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (!control.value) {
                return of(null);
            }

            return this.deliveryMethodService.getAllDeliveryMethods().pipe(
                map((methods: IDeliveryMethod[]) => {
                    const existingMethod = methods.find((method: IDeliveryMethod) =>
                        method.name.toLowerCase() === control.value.toLowerCase() &&
                        method.id !== currentMethodId
                    );
                    return existingMethod ? { nameExists: true } : null;
                }),
                catchError(() => of(null))
            );
        };
    }

    /**
     * Validador para precios razonables
     */
    static reasonablePriceValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = parseFloat(control.value);
            if (isNaN(value)) {
                return null; // Dejar que required maneje valores vacíos
            }

            if (value < 0) {
                return { negativePrice: true };
            }

            if (value > 10000) {
                return { priceToHigh: { maxPrice: 10000, actualPrice: value } };
            }

            return null;
        };
    }

    /**
     * Validador para peso máximo razonable
     */
    static reasonableWeightValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null; // Campo opcional
            }

            const value = parseFloat(control.value);
            if (isNaN(value)) {
                return { invalidWeight: true };
            }

            if (value <= 0) {
                return { invalidWeight: true };
            }

            if (value > 1000) {
                return { weightTooHigh: { maxWeight: 1000, actualWeight: value } };
            }

            return null;
        };
    }

    /**
     * Validador para días de entrega razonables
     */
    static reasonableDeliveryDaysValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null; // Campo opcional
            }

            const value = parseInt(control.value);
            if (isNaN(value)) {
                return { invalidDays: true };
            }

            if (value < 0) {
                return { negativeDays: true };
            }

            if (value > 30) {
                return { daysTooHigh: { maxDays: 30, actualDays: value } };
            }

            return null;
        };
    }

    /**
     * Validador para código con formato correcto
     */
    static codeFormatValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const codeRegex = /^[A-Z][A-Z0-9_]*$/;
            if (!codeRegex.test(control.value)) {
                return {
                    invalidCodeFormat: {
                        message: 'El código debe comenzar con letra mayúscula y contener solo letras, números y guiones bajos'
                    }
                };
            }

            if (control.value.length < 2) {
                return { codeTooShort: { minLength: 2 } };
            }

            if (control.value.length > 50) {
                return { codeTooLong: { maxLength: 50 } };
            }

            return null;
        };
    }

    /**
     * Validar conjunto de reglas de negocio
     */
    validateBusinessRules(deliveryMethod: any): ValidationErrors | null {
        const errors: ValidationErrors = {};

        // Regla: Si no requiere dirección, el precio debería ser menor (típicamente pickup)
        if (!deliveryMethod.requiresAddress && deliveryMethod.price > 500) {
            errors['pickupPriceHigh'] = {
                message: 'Los métodos de retiro usualmente tienen precios menores a $500'
            };
        }

        // Regla: Si requiere dirección y el precio es 0, podría ser sospechoso
        if (deliveryMethod.requiresAddress && deliveryMethod.price === 0) {
            errors['freeShippingWarning'] = {
                message: 'Verifique si el envío gratuito es correcto para este método'
            };
        }

        // Regla: Códigos comunes no deberían tener configuraciones conflictivas
        if (deliveryMethod.code === 'PICKUP' && deliveryMethod.requiresAddress) {
            errors['pickupAddressConflict'] = {
                message: 'Los métodos PICKUP normalmente no requieren dirección'
            };
        }

        if ((deliveryMethod.code === 'SHIPPING' || deliveryMethod.code === 'DELIVERY') && !deliveryMethod.requiresAddress) {
            errors['shippingAddressConflict'] = {
                message: 'Los métodos de envío normalmente requieren dirección'
            };
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }
}
