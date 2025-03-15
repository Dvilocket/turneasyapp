import { OmitType, PartialType } from "@nestjs/mapped-types";
import { QueryParamAppointmentExtendDto } from "./query-param-appointment-extend.dto";
import { IsDateString, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class QueryParamAppointmentGeneralDto extends PartialType(
    OmitType(QueryParamAppointmentExtendDto, ['buscar'] as const)
) {
    @IsOptional()
    @IsDateString({}, { message: 'El formato de la fecha "hasta" debe ser Y-m-d' })
    @Type(() => String)
    fecha_servicio?: string;
}