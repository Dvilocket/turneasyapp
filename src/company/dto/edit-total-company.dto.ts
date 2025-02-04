import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class EditTotalCompanyDto {

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    total: number;
}