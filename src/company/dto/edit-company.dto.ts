import { PartialType } from "@nestjs/mapped-types";
import { CreateCompanyDto } from "./create-company.dto";
import { IsNumber, Min } from "class-validator";
import { Transform} from "class-transformer";

export class EditCompanyDto extends PartialType(CreateCompanyDto)  {
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value, 10))
    id_empresa: number;
}