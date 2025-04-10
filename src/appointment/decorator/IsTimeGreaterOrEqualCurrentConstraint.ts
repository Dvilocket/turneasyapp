import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'isTimeGreaterOrEqualCurrent', async: false })
export class IsTimeGreaterOrEqualCurrentConstraint implements ValidatorConstraintInterface {
    validate(serviceTime: string, args: ValidationArguments) {
        if (!serviceTime) return false;

        const [hour, minute] = serviceTime.split(':').map(Number);

        if (hour < 6 || hour > 23) {
            return false;
        }

        const object: any = args.object;
        const serviceDate: string = object.fecha_servicio;

        if (!serviceDate) return false;

        const [year, month, day] = serviceDate.split('-').map(Number);
        const serviceDateTime = new Date(year, month - 1, day, hour, minute, 0);

        const now = new Date();

        return serviceDateTime >= now;
    }

    defaultMessage(args: ValidationArguments) {
        return 'La hora debe ser mayor o igual a la hora actual';
    }
}

export function IsTimeGreaterOrEqualCurrent(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsTimeGreaterOrEqualCurrentConstraint,
        });
    };
}