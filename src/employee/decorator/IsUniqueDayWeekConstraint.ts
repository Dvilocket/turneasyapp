import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { TypeDayWeekListGeneral } from "src/enum";

@ValidatorConstraint({ name: 'IsUniqueDayWeek', async: false })
export class IsUniqueDayWeekConstraint implements ValidatorConstraintInterface {

    validate(schedule: any[], args: ValidationArguments) {
        
        if (!Array.isArray(schedule)) {
            return false;
        }

        for (const dayWeek of TypeDayWeekListGeneral) {
            const horariosDelDia = schedule.filter((element) => element.dia_semana === dayWeek);
            if (horariosDelDia.length >= 2 && this.thereIsOverlap(horariosDelDia)) {
                return false; 
            }
        }

        return true;
    }

    private convertHourToMinute(hour: string): number {
        const [h, m] = hour.split(':').map(Number);
        return h * 60 + m;
    }

    private thereIsOverlap(horarios: any[]): boolean {
        for (let i = 0; i < horarios.length; i++) {
            for (let j = i + 1; j < horarios.length; j++) {
                const inicio1 = this.convertHourToMinute(horarios[i].hora_inicio);
                const fin1 = this.convertHourToMinute(horarios[i].hora_fin);
                const inicio2 = this.convertHourToMinute(horarios[j].hora_inicio);
                const fin2 = this.convertHourToMinute(horarios[j].hora_fin);

                if (inicio1 < fin2 && fin1 > inicio2) {
                    return true;
                }
            }
        }

        return false;
    }

    defaultMessage(args: ValidationArguments) {
        return `Los horarios para un mismo día de la semana no pueden solaparse.`;
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
    };
}