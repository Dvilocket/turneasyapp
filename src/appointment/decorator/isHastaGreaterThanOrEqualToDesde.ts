import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { QueryParamAppointmentDto } from "../dto";


@ValidatorConstraint({ name: 'IsHastaGreaterThanOrEqualToDesde', async: false })
export class IsHastaGreaterThanOrEqualToDesdeConstraint implements ValidatorConstraintInterface {
    validate(hasta: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        
        const {object} = validationArguments;
        const desde = (object as QueryParamAppointmentDto).desde;

        if (hasta && desde){
            const dateDesde = new Date(desde);
            const dateHasta = new Date(hasta);
            return dateHasta >= dateDesde;
        }
        return true;
    }
    defaultMessage?(validationArguments?: ValidationArguments): string {
        return 'La fecha "hasta" debe ser mayor o igual que la fecha "desde"';
    }
}


export function IsHastaGreaterThanOrEqualToDesde(validationOptions?: ValidationOptions){
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsHastaGreaterThanOrEqualToDesdeConstraint,
        });
    };
}