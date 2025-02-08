import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateServiceDto } from "./create-service.dto";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { Transform } from "class-transformer";

export class EditServiceDto extends PartialType(
    OmitType(CreateServiceDto, ['id_empresa'] as const)
) {
    
    @IsInt()
    @Min(1)
    @Transform(({value}) => {
        const parsedValue = parseInt(value, 10);
        return isNaN(parsedValue) ? null : parsedValue;
    })
    id_servicio: number;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;   
}