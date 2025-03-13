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
}