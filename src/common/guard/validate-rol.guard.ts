import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ValidateRolGuard implements CanActivate {
  
  constructor(private readonly requiredRoles: string[]){}
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return this.validateRolUser(user);
  }

  /**
   * Esta Funcion me permite validar si el tipo
   * de usuario es un administrador, solo de tipo
   * administrador me va a permitir dejar hacer
   * la logica de negocio
   * @param user 
   * @returns 
   */
  private validateRolUser(user: any): boolean {
    if (user && this.requiredRoles.includes(user?.type_user)) {
      return true;
    }
    return false;
  }
}
