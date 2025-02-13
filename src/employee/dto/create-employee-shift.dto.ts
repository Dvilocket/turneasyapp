import { Transform, Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsString, Matches, Min, ValidateNested } from "class-validator";
import { TypeDayWeek, TypeDayWeekListGeneral } from "src/enum";
import { IsUniqueDayWeek } from "../decorator/IsUniqueDayWeekConstraint";
import { IsUniqueEmployeeId } from "../decorator/isUniqueEmployeeIdConstraint";
import { IsHoraInicioBeforeHoraFin } from "../decorator/IsHoraInicioBeforeHoraFinConstraint ";



export class CreateEmployeeShiftGeneral {

    @IsEnum(TypeDayWeek, {
        message: `Los valores permitidos son ${TypeDayWeekListGeneral}`
    })
    dia_semana: TypeDayWeek;

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'hora_inicio debe estar en formato HH:MM (por ejemplo, 08:00, 12:00, 22:00)'
    })
    @Type(() => String)
    hora_inicio: string;

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'hora_fin debe estar en formato HH:MM (por ejemplo, 08:00, 12:00, 22:00)'
    })
    @Type(() => String)
    hora_fin: string;
}

export class CreateEmployeeShiftDtoGeneral {
    @IsInt()
    @Min(1)
    @Transform(({value}) => {
        const parsedValue = parseInt(value, 10);
        return isNaN(parsedValue) ? null : parsedValue;
    })
    id_empleado: number;

    @IsArray()
    @ValidateNested({each: true})
    @Type(() => CreateEmployeeShiftGeneral)
    @IsUniqueDayWeek()
    @IsHoraInicioBeforeHoraFin()
    horario: CreateEmployeeShiftGeneral;
}


export class CreateEmployeeShiftDto {
    @IsArray()
    @ValidateNested({each: true})
    @Type(() => CreateEmployeeShiftDtoGeneral)
    @IsUniqueEmployeeId()
    turnos: CreateEmployeeShiftDtoGeneral
}


