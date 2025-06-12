import {
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidatorConstraint,
} from 'class-validator';
import { envs } from 'src/config';
import { Helper } from 'src/helper';

@ValidatorConstraint({ async: true })
export class IsCorrectPassword implements ValidatorConstraintInterface  {
  
  async validate(value: string, validationArguments?: ValidationArguments): Promise<boolean> {  
    return await Helper.comparePassword(value, envs.properties_password);
  }

  defaultMessage (validationArguments: ValidationArguments): string {
    return "Clave Incorrecta"
  }
}