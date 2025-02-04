import { Type } from "class-transformer";
import { IsEmail, IsEnum, IsLowercase, IsPhoneNumber, IsString, Matches } from "class-validator";
import { TypeCompanyCategory, TypeCompanyCategoryList } from "src/enum";

export class CreateCompanyDto {
    @IsString()
    @IsLowercase()
    @Matches(/^[^\s].+[^\s]$/, {
        message: 'El nombre de la empresa no debe contener espacios al inicio o final'
    })
    @Type(() => String)
    nombre: string;

    @IsString()
    @IsLowercase()
    @Type(() => String)
    direccion: string;

    @IsPhoneNumber('CO', {
        message: 'El número de teléfono no es válido para Colombia'
    })
    @Type(() => String)
    telefono: string;

    @IsEmail()
    @Type(() => String)
    correo: string;

    @IsEnum(TypeCompanyCategory, {
        message: `Los valores permitidos son ${TypeCompanyCategoryList}`
    })
    categoria: TypeCompanyCategory

    @IsString()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
        message: 'La hora de apertura debe estar en formato HH:mm o HH:mm:ss',
    })
    hora_apertura: string;

    @IsString()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
        message: 'La hora de cierre debe estar en formato HH:mm o HH:mm:ss',
    })
    hora_cierre: string;
}