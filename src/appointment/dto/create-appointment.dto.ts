import { Transform, Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsPhoneNumber, IsString, Matches, Min } from "class-validator";
import { IsWithin30Days } from "../decorator/IsWithin30DaysConstraint";
import { IsTimeGreaterOrEqualCurrent } from "../decorator/IsTimeGreaterOrEqualCurrentConstraint";

export class CreateAppointmentDto {
    @IsInt()
    @Min(1)
    @IsNotEmpty()
    @Transform(({value}) => {
        const parsedValue = parseInt(value, 10);
        return isNaN(parsedValue) ? null : parsedValue;
    })
    id_empleado: number;

    @IsInt()
    @Min(1)
    @IsNotEmpty()
    @Transform(({value}) => {
        const parsedValue = parseInt(value, 10);
        return isNaN(parsedValue) ? null : parsedValue;
    })
    id_servicio: number;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: 'La fecha debe tener el formato YYYY-MM-DD'})
    @Transform(({value}) => {
        const [yearString, monthString, dayString] = value.split('-');
        const date = new Date(Number(yearString), Number(monthString) - 1, Number(dayString));

        if (date.getFullYear() !== Number(yearString) || date.getMonth() + 1 !== Number(monthString) || date.getDate() !== Number(dayString)) {
           return null;
        }

        return value;
    })
    @IsWithin30Days()
    fecha_servicio: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'La hora debe tener el formato HH:mm (por ejemplo, 9:30, 10:00, 23:00)',
    })
    @IsTimeGreaterOrEqualCurrent()
    hora_servicio: string;

    @IsString()
    @IsNotEmpty()
    @Type(() => String)
    nombre: string;

    @IsString()
    @IsNotEmpty()
    @Type(() => String)
    apellido: string;

    @IsEmail()
    @IsNotEmpty()
    @Type(() => String)
    correo: string;

    @IsPhoneNumber('CO', {
        message: 'El número de teléfono no es válido para Colombia'
    })
    @Type(() => String)
    telefono: string;
}
