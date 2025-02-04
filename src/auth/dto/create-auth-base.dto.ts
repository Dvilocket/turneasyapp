import { Type } from "class-transformer";
import { IsEmail, IsLowercase, IsOptional, IsPhoneNumber, IsString, Matches, MinLength } from "class-validator";

export class CreateAuthBaseDto {
    
    @IsString()
    @IsLowercase()
    @Matches(/^[^\s].+[^\s]$/, {
        message: 'usuario no debe contener espacios al inicio o final'
    })
    @Type(() => String)
    usuario: string;

    @IsString()
    @Type(() => String)
    nombre: string;

    @IsEmail()
    @Type(() => String)
    correo: string;


    @IsString()
    @MinLength(8, {
        message: 'La clave debe tener al menos 8 caracteres'
    })
    @Matches(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'La clave debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
    })
    @Type(() => String)
    clave: string;


    @IsPhoneNumber('CO', {
        message: 'El número de teléfono no es válido para Colombia'
    })
    @IsOptional()
    @Type(() => String)
    telefono?: string;
}