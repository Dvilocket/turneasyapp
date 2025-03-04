import { IsOptional, IsDateString, ValidateIf, validateOrReject } from 'class-validator';
import { Type } from 'class-transformer';
import { IsHastaGreaterThanOrEqualToDesde } from '../decorator/isHastaGreaterThanOrEqualToDesde';

export class QueryParamAppointmentDto {

    @IsOptional()
    @IsDateString({}, { message: 'El formato de la fecha "desde" debe ser Y-m-d' })
    @Type(() => String)
    desde?: string;

    @IsOptional()
    @IsDateString({}, { message: 'El formato de la fecha "hasta" debe ser Y-m-d' })
    @Type(() => String)
    @IsHastaGreaterThanOrEqualToDesde()
    hasta?: string;
}