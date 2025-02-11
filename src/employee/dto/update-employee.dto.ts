import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

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
            } else {
                return false;
            }
        }
    })
    activo?: boolean; 
}
