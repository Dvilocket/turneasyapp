import { IsEnum, IsOptional, IsString } from "class-validator";
import { QueryParamAppointmentDto } from "./query-param-appointment.dto";
import { TypeDayWeek, TypeDayWeekListGeneral } from "src/enum";
import { Type } from "class-transformer";

export class QueryParamAppointmentExtendDto extends QueryParamAppointmentDto {

    @IsOptional()
    @IsString()
    @Type(() => String)
    @IsEnum(TypeDayWeek, {
        message: `Los valores permitidos son ${TypeDayWeekListGeneral}`
    })
    dia_semana?: TypeDayWeek
}