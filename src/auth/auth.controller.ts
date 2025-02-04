import { Controller, Post, Body} from '@nestjs/common';
import { AuthService } from './auth.service';
import {CreateAuthGeneralDto, CreateAuthUserDto, LoginAuthDto } from './dto';
import { User } from './entities';
import { Roles } from 'src/common/decorators';
import { TypeUserGeneral } from 'src/enum';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Este endpoint es para hacer login
   * @param loginAuthDto 
   * @returns 
   */
  @Post('/login')
  public async authLogin(@Body() loginAuthDto: LoginAuthDto) {
    const response = await this.authService.validateUser(new User(loginAuthDto));
    return this.authService.login(new User(response));
  }

  /**
   * Este endpoint es para registar un usuario de tipo USER
   * @param createAuthUserDto 
   * @returns 
   */
  @Post('/register/user')
  public registerUser(@Body() createAuthUserDto: CreateAuthUserDto) {
    return this.authService.registerUser(createAuthUserDto)
  }
 
  /**
   * Este endpoint es para registrar un usuario de tipo ADMINISTRATOR
   * Y CLIENTE, este endpoint tambien valida si el usuario es ADMINISTRATOR
   * porque es el que tiene los privilegios
   * @param createAuthGeneralDto 
   * @returns 
   */
  @Roles(TypeUserGeneral.ADMINISTRATOR)
  @Post('/register')
  public registerGeneral(@Body() createAuthGeneralDto: CreateAuthGeneralDto) {
    return this.authService.registerGeneral(createAuthGeneralDto);
  }
}

