import { IsEnum, IsOptional } from "class-validator";
import { TypeAuthParameter } from "src/enum";

export class QueryAuthBaseDto {
    @IsOptional()
    @IsEnum(TypeAuthParameter, {each: true})
    parameter?: TypeAuthParameter;
}