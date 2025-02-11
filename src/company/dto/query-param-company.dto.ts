import { BadRequestException } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { TypeCompanyCategory, TypeCompanyCategoryList } from "src/enum";

export class QueryParamCompanyDto {
    
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value, 10))
    idUser?: number

    @IsOptional()
    @IsEnum(TypeCompanyCategory, {
        message: `allowed values ${TypeCompanyCategoryList}`
    })
    category?: TypeCompanyCategory

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') {
                return true;
            }
            if (value.toLowerCase() === 'false') {
                return false;
            }
        }
        throw new BadRequestException('The asset value must be a boolean or a string true or false');
    })
    consultServices?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({value}) => {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') {
                return true;
            }
            if (value.toLowerCase() === 'false') {
                return false;
            }
        }
        throw new BadRequestException('The asset value must be a boolean or a string true or false');
    })
    servicesActives?: boolean;
}