import { Type } from "class-transformer";
import {IsString, Matches, ValidateNested } from "class-validator";
import { IsHourStartBeforeHourEnd } from "../decorator/IsHourStartBeforeHourEndConstraint";

export class UpdateShifGeneral {

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


export class UpdateShiftDto {
    @ValidateNested({each: true})
    @Type(() => UpdateShifGeneral)
    @IsHourStartBeforeHourEnd()
    horario: UpdateShifGeneral;
}