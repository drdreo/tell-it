import { ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";

export function roomNameValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const allowed = nameRe.test(control.value);
        return allowed ? null : { forbiddenName: { value: control.value } };
    };
}
