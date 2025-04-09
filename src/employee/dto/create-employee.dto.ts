import { Transform, Type } from "class-transformer";
import { IsEmail, IsLowercase, IsOptional, IsPhoneNumber, IsString, Matches } from "class-validator";
import { NoRepeatedCommaValues } from "../decorator/NoRepeatedCommaValuesConstraint";

export class CreateEmployeeDto {

    @IsString()
    @IsLowercase()
    @Matches(/^[^\s].+[^\s]$/, {
        message: 'El nombre del empleado no debe contener espacios al inicio o al final',
    })
    @Transform(({value}) => {
        if (typeof value === 'string') {
            return value.toLocaleLowerCase().trim()
        }
    })
    nombre: string;

    @IsEmail()
    @Type(() => String)
    correo: string;

    @IsPhoneNumber('CO', {
        message: 'Debes ingresar un numero de telefono colombiano'
    })
    telefono: string;

    @IsString()
    @NoRepeatedCommaValues({
        message: "No se permiten valores repetidos en el campo id_servicio"
    })
    id_servicio: string;

    @IsOptional()
    @IsString()
    @NoRepeatedCommaValues({
        message: "No se permite valores repetidos en el campo id_empresa"
    })
    id_empresa?: string;
}
