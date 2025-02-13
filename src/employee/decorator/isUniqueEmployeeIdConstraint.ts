import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";


@ValidatorConstraint({ name: 'IsUniqueEmployeeId', async: false })
export class IsUniqueEmployeeIdConstraint implements ValidatorConstraintInterface {
    validate(elements: any[], args: ValidationArguments) {

        const uniqueEmployeeId = new Set<number>();

        for(const element of elements) {
            const id = element.id_empleado;

            if (uniqueEmployeeId.has(id)) {
                return false;
            }

            uniqueEmployeeId.add(id);
        }
        return true;
    }

    defaultMessage(args: ValidationArguments) {
        return 'No se permiten id_empleados repetidos';
    }
}

export function IsUniqueEmployeeId(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUniqueEmployeeIdConstraint,
        });
    }
}