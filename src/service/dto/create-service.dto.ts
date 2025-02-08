import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsLowercase, IsString, Matches, Min, ValidateNested, IsNumber } from "class-validator";

export class CreateServiceBaseDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateServiceDto)
    servicios: CreateServiceDto[];
}

export class CreateServiceDto {
    @IsInt()
    @Min(1)
    @Transform(({ value }) => {
        const parsedValue = parseInt(value, 10);
        return isNaN(parsedValue) ? null : parsedValue;
    })
    id_empresa: number;

    @IsString()
    @IsLowercase()
    @Matches(/^[^\s].+[^\s]$/, {
        message: 'El nombre del servicio no debe contener espacios al inicio o al final',
    })
    @Transform(({value}) => {
        if (typeof value === 'string') {
            return value.toLowerCase();
        }
    })
    nombre_servicio: string;

    @IsString()
    @IsLowercase()
    @Matches(/^[^\s].+[^\s]$/, {
        message: 'La descripción del servicio no debe contener espacios al inicio o al final',
    })
    @Transform(({value}) => {
        if (typeof value === 'string') {
            return value.toLowerCase()
        }
    })
    descripcion: string;

    @IsInt()
    @Min(1)
    @Transform(({ value }) => {
        const parsedValue = parseInt(value, 10);
        return isNaN(parsedValue) ? null : parsedValue;
    })
    duracion: number;

    @IsNumber({}, { message: 'El precio debe ser un número válido' }) 
    @Min(0, { message: 'El precio no puede ser negativo' }) 
    @Transform(({ value }) => {
        const parsedValue = parseFloat(value); 
        return isNaN(parsedValue) ? null : parsedValue;
    })
    precio: number; 
}