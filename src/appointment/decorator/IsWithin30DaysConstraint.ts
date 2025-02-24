import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';
import { envs } from 'src/config';

@ValidatorConstraint({ name: 'isWithin30Days', async: false })
export class IsWithin30DaysConstraint implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments) {
        if (!value) return false;

        const [year, month, day] = value.split('-');
        const fechaIngresada = new Date(Number(year), Number(month) - 1, Number(day));

        const fechaActual = new Date();

        const diferenciaMs = fechaIngresada.getTime() - fechaActual.getTime();

        const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

        return diferenciaDias <= Number(envs.days_allowed_on_appointment) && diferenciaDias >= 0;
    }

    defaultMessage(args: ValidationArguments) {
        return 'La fecha no puede superar los 30 días a partir de la fecha actual';
    }
}

export function IsWithin30Days(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsWithin30DaysConstraint,
        });
    };
}