import { IsEnum, IsNotEmpty, IsString, Validate } from 'class-validator';
import { TypePropertiesParameter, TypePropertiesParameterList } from './../../enum/type-properties-parameter.enum';
import { Type } from 'class-transformer';
import { IsCorrectPassword } from '../decorators/IsCorrectPassword ';

export class PropertiesGeneralDto {
    @IsString()
    @IsNotEmpty()
    @Validate(IsCorrectPassword)
    clave:string;

    @IsString()
    @Type(() => String)
    @IsEnum(TypePropertiesParameter, {
        message: `Los valores permitidos son: ${TypePropertiesParameterList}`
    })
    propiedad: TypePropertiesParameter;
}