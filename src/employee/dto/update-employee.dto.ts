import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export class UpdateEmployeeDto extends PartialType(
    OmitType(CreateEmployeeDto, ['id_empresa'] as const)
) {
    @IsBoolean()
    @IsOptional()
    @Transform(({value}) => {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') {
                return true;
            } else if (value.toLowerCase() === 'false') {
                return false;
            }
        }
        throw new BadRequestException('The asset value must be a boolean or a string true or false');
    })
    activo?: boolean; 
}
