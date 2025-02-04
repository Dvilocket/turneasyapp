import { Type } from "class-transformer";
import { IsLowercase, IsString, Matches, MinLength } from "class-validator";
import { string } from "joi";

export class LoginAuthDto {

    @IsString()
    @IsLowercase()
    @Matches(/^[^\s].+[^\s]$/, {
        message: 'usuario no debe contener espacios al inicio o final'
    })
    @Type(() => String)
    usuario: string;

    
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
}