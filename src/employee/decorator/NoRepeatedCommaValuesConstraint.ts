import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";


@ValidatorConstraint({ name: 'NoRepeatedCommaValues', async: false })
export class NoRepeatedCommaValuesConstraint implements ValidatorConstraintInterface {
    validate(elements: string, args: ValidationArguments) {

        if (typeof elements !==  'string') return false;

        const values = elements.split(',').map(v => v.trim());
        const unique = new Set(values);
        
        return unique.size === values.length;
    }

    defaultMessage(args: ValidationArguments) {
        return 'No se permiten valores repetidos';
    }
}

export function NoRepeatedCommaValues(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: NoRepeatedCommaValuesConstraint,
        });
    }
}