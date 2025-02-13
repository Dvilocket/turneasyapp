import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'IsHoraInicioBeforeHoraFin', async: false })
export class IsHoraInicioBeforeHoraFinConstraint implements ValidatorConstraintInterface {
    validate(horario: any[], args: ValidationArguments) {
        for (const item of horario) {
            const horaInicio = this.convertirHoraAMinutos(item.hora_inicio);
            const horaFin = this.convertirHoraAMinutos(item.hora_fin);
            
            if (horaInicio > horaFin) {
                return false;
            }
        }

        return true;
    }

    defaultMessage(args: ValidationArguments) {
        return 'La hora de inicio debe ser menor o igual que la hora de fin.';
    }

    private convertirHoraAMinutos(hora: string): number {
        const [horas, minutos] = hora.split(':').map(Number);
        return horas * 60 + minutos;
    }
}

export function IsHoraInicioBeforeHoraFin(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsHoraInicioBeforeHoraFinConstraint,
        });
    };
}