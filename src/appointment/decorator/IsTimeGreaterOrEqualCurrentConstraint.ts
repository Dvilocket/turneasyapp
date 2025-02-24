import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'isTimeGreaterOrEqualCurrent', async: false })
export class IsTimeGreaterOrEqualCurrentConstraint implements ValidatorConstraintInterface {
    validate(serviceTime: string, args: ValidationArguments) {
        if (!serviceTime) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const [hour, minute] = serviceTime.split(':').map(Number);


        if (hour > currentHour) {
            return true;
        } else if (hour === currentHour && minute >= currentMinute) {
            return true;
        }

        return false; 
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