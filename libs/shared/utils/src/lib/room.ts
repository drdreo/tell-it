import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export function roomNameValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const forbidden = nameRe.test(control.value);
        return forbidden ? {forbiddenName: {value: control.value}} : null;
    };
}
