import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";


@ValidatorConstraint({ name: 'IsUniqueDayWeek', async: false })
export class IsUniqueDayWeekConstraint implements ValidatorConstraintInterface {
    validate(schedule: any[], args: ValidationArguments) {

        const uniqueDays = new Set<string>();

        for(const item of schedule) {
            const dayWeek = item.dia_semana;
            if (uniqueDays.has(dayWeek)) {
                return false;
            }
            uniqueDays.add(dayWeek);
        }
        return true; 
    }

    defaultMessage(args: ValidationArguments) {
        return 'No se permiten días de la semana repetidos en el horario.';
    }
}

export function IsUniqueDayWeek(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUniqueDayWeekConstraint,
        });
    }
}