import { IsEnum, IsOptional, IsString, Matches } from "class-validator";
import { QueryParamAppointmentDto } from "./query-param-appointment.dto";
import { TypeDayWeek, TypeDayWeekListGeneral } from "src/enum";
import { Transform, Type } from "class-transformer";

export class QueryParamAppointmentExtendDto extends QueryParamAppointmentDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    @IsEnum(TypeDayWeek, {
        message: `Los valores permitidos son ${TypeDayWeekListGeneral}`
    })
    dia_semana?: TypeDayWeek

    @IsOptional()
    @Type(() => String)
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'hora_desde debe estar en formato HH:mm'
    })
    hora_desde?: string;

    @IsOptional()
    @Type(()=> String)
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'hora_hasta debe estar en formato HH:mm'
    })
    hora_hasta?: string;

    @IsOptional()
    @Type(() => String)
    @Transform(({value}) => {
        if (typeof value === 'string') {
            return value.toLowerCase().replace(/\s/g, "");
        }
        return null;
    })
    buscar?: string
}