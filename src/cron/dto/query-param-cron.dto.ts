import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class QueryParamCronDto {

    @IsOptional()
    @Type(() => String)
    clave?: string;

    @IsOptional()
    @Type(() => String)
    hilo?:string;
}