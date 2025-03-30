import { Type } from "class-transformer";
import { IsDateString, IsOptional } from "class-validator";

export class QueryParamCronDownloadDto {

    @IsOptional()
    @IsDateString({}, {message: 'El formato de la fecha "hasta" debe ser Y-m-d'})
    @Type(() => String)
    fecha?: string;
}