import { Transform, Type } from "class-transformer";
import { IsEmail, IsLowercase, IsOptional, IsPhoneNumber, IsString, Matches } from "class-validator";

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

    @IsOptional()
    @IsString()
    id_empresa?: string;
}
