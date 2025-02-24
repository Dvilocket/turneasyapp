import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Matches, Min } from "class-validator";
import { IsWithin30Days } from "../decorator/IsWithin30DaysConstraint";

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
}
