import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { Helper } from "src/helper";


@ValidatorConstraint({ name: 'IsHourStartBeforeHourEnd', async: false })
export class IsHourStartBeforeHourEndConstraint implements ValidatorConstraintInterface {
    
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        
        const hourStart = Helper.convertHourToMinute(value.hora_inicio);
        const endStart = Helper.convertHourToMinute(value.hora_fin);

        if (hourStart > endStart) {
            return false;
        }
        return true;
    }

    
    defaultMessage?(validationArguments?: ValidationArguments): string {
        return 'La hora de inicio debe ser menor o igual que la hora de fin.';
    }
}

export function IsHourStartBeforeHourEnd(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsHourStartBeforeHourEndConstraint,
        });
    };
}