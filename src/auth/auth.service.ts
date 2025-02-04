import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthGeneralDto, CreateAuthUserDto } from './dto';
import { DbService } from 'src/db/db.service';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities';
import * as bcrypt from 'bcrypt';
import { TypeUserGeneral } from 'src/enum';
import { ModelCompanyTotal } from 'src/model';

@Injectable()
export class AuthService {
  
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly dbService: DbService,
    private readonly jwtService: JwtService
  ){}

  /**
   * Función que se encarga para validar un usario y hacer
   * su respectivo, Login, esta funcion se encarga de recibir
   * un modelo que tiene usario y clave y valida si ese usuario
   * existe en la base de datos y la clave es valida
   * @param user 
   * @returns 
   */
  public async validateUser(user: User) {

    const password = user.clave;
    user.clave = null;
    user.removeNullReferences();

    const sql = this.dbService.selectOne(user, true);
    const response: any[] = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException('Wrong username or password', HttpStatus.UNAUTHORIZED);
    }

    const responseDb = new User(response[0]);
    
    if (! await this.comparePassword(password, responseDb.clave)) {
      throw new HttpException(`Wrong username or password`, HttpStatus.UNAUTHORIZED);
    }

    return responseDb;
  }

  /**
   * Función para crear el token de acuerdo al cliente que hizo
   * login, se devuelve su token para ingresar a la Api
   * @param user 
   * @returns 
   */
  public login(user: User) {
    
    const payload = {
      id: user.id_usuario,
      user: user.nombre,
      email: user.correo,
      phone: user.telefono,
      type_user: user.tipo_usuario
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Función para encriptar una clave
   * @param password 
   * @returns 
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Función para comparar una clave encriptada
   * @param password 
   * @param hashedPassword 
   * @returns 
   */
  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Función para registrar un usuario de tipo User en la base de
   * datos
   * @param createAuthUserDto 
   */
  public async registerUser(createAuthUserDto: CreateAuthUserDto) {
    const model = new User(createAuthUserDto);

    const modelSelectUsername = new User();
    modelSelectUsername.usuario = model.usuario;
    modelSelectUsername.removeNullReferences();

    let sql = this.dbService.selectOne(modelSelectUsername, true);
    let response: any[] = await this.dbService.executeQueryModel(sql);

    if (response.length > 0) {
      throw new HttpException(`The username ${modelSelectUsername.usuario} is already registered`, HttpStatus.CONFLICT);
    }

    const modelSelectEmail = new User();
    modelSelectEmail.correo = model.correo;
    modelSelectEmail.removeNullReferences();

    sql = this.dbService.selectOne(modelSelectEmail, true);
    response = await this.dbService.executeQueryModel(sql);

    if (response.length > 0) {
      throw new HttpException(`the email ${modelSelectEmail.correo} is already registered`, HttpStatus.CONFLICT);
    }

    model.removeNullReferences();
    model.clave = await this.hashPassword(model.clave);
    sql =  this.dbService.insert(model);
    await this.dbService.executeQueryModel(sql);

    throw new HttpException('Successfully created user', HttpStatus.OK);
  }

  /**
   * Función para registrar un usuario que es de tipo ADMINISTRADOR
   * o CLIENTE, el unico usuario que puede hacer eso debe ser
   * de tipo administrador
   * @param createAuthGeneralDto 
   * @returns 
   */
  public async registerGeneral(createAuthGeneralDto: CreateAuthGeneralDto) {
    
    let modelUser = new User(createAuthGeneralDto);

    const modelSelectEmail = new User();
    modelSelectEmail.correo = modelUser.correo;
    modelSelectEmail.removeNullReferences();

    const modelSelectUser = new User();
    modelSelectUser.usuario = modelUser.usuario;
    modelSelectUser.removeNullReferences();

    let sql = this.dbService.selectOne(modelSelectEmail, true);
    let response = await this.dbService.executeQueryModel(sql);

    if (response.length > 0) {
      throw new HttpException(`the email ${modelSelectEmail.correo} is already registered`, HttpStatus.CONFLICT);
    }

    sql = this.dbService.selectOne(modelSelectUser, true);
    response = await this.dbService.executeQueryModel(sql);

    if (response.length > 0) {
      throw new HttpException(`The username ${modelSelectUser.usuario} is already registered`, HttpStatus.CONFLICT);
    }

    modelUser.removeNullReferences();
    modelUser.clave = await this.hashPassword(modelUser.clave);

    sql = this.dbService.insert(modelUser);    
    
    if (createAuthGeneralDto.tipo_usuario === TypeUserGeneral.ADMINISTRATOR) {
          
      await this.dbService.executeQueryModel(sql);

      throw new HttpException('Successfully created user', HttpStatus.OK);
    }

    /**
     * Como se hace en una misma transaccion
     * se mantiene el estado de la transaccion
     * por lo tanto puedo emplearla para consultar otras tablas
     */
    await this.dbService.beginTransaction();
    let responseCompany = await this.dbService.executeQueryInTransaction(sql);

    modelUser = new User(responseCompany[0]);

    const modelCompanyTotal = new ModelCompanyTotal();
    modelCompanyTotal.id_usuario = modelUser.id_usuario;
    modelCompanyTotal.removeNullReferences();

    sql = this.dbService.insert(modelCompanyTotal);
    responseCompany = await this.dbService.executeQueryInTransaction(sql);

    /**
     * Se confirma la transaccion
     */
    await this.dbService.commitTransaction();

    throw new HttpException('Successfully created user', HttpStatus.OK);
  }
}
