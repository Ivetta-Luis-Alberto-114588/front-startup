import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Validador que comprueba si dos campos coinciden */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    // Si los controles no existen o aún no tienen valor, no validar
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
        return null;
    }

    // Retorna error si no coinciden, null si coinciden
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};