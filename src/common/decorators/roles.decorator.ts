import {applyDecorators, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ValidateRolGuard } from '../guard';


export function Roles(...roles: string[]) {
    return applyDecorators(
        UseGuards(
            JwtAuthGuard,
            new ValidateRolGuard(roles)
        )
    );
}