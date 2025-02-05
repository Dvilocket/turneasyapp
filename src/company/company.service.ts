import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateCompanyDto, EditCompanyDto, EditTotalCompanyDto, QueryParamCompanyDto } from './dto';
import { ModelCompanyTotal } from 'src/model';
import { TypeJson } from 'src/db/interfaces';
import { Helper } from 'src/helper';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Company } from './entities/company.entity';
import { TypeUserGeneral } from 'src/enum';

@Injectable()
export class CompanyService {

  constructor(
    private readonly dbService: DbService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  /**
   * Función para crear una empresa en la plataforma,
   * se hace uso de del servicio cloudinary para
   * subir las imagenes
   * @param createCompanyDto 
   * @param file 
   * @returns 
   */
  public async createCompany(createCompanyDto: CreateCompanyDto, file: Express.Multer.File, req: any) {
  
    let modelSelectCompanyTotal = new ModelCompanyTotal();
    modelSelectCompanyTotal.id_usuario = req.user.id;
    modelSelectCompanyTotal.removeNullReferences();

    let sql = this.dbService.selectOne(modelSelectCompanyTotal, true);
    let response = await this.dbService.executeQueryModel(sql);

    if (response.length <= 0) {
      throw new HttpException('You cant create a company because you dont have an activated plan', HttpStatus.FORBIDDEN);
    }

    modelSelectCompanyTotal = new ModelCompanyTotal(response[0]);

    sql = this.dbService.queryStringJson('selTotalCompany', [
      {
        name: 'ID_USUARIO',
        value:  modelSelectCompanyTotal.id_usuario,
        type: TypeJson.NUMBER
      }
    ]);

    const responseCompanyCreated = await this.dbService.executeQueryModel(sql);
    const totalCompanyCreated = Number(Helper.getFirstElement(responseCompanyCreated));

    if (totalCompanyCreated >= modelSelectCompanyTotal.total) {
      throw new HttpException('It is not possible to create a company, because the allowed limit has already been reached.', HttpStatus.FORBIDDEN);
    }


    const [secureUrl, publicId, format] = await this.cloudinaryService.uploadImage(file);

    if (!secureUrl || !publicId || !format) {
      throw new HttpException('It is not possible to upload images at this time', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const modelInsertCompany = new Company(createCompanyDto);
    modelInsertCompany.id_usuario = modelSelectCompanyTotal.id_usuario;
    modelInsertCompany.url_imagen = secureUrl;
    modelInsertCompany.formato_imagen = format;
    modelInsertCompany.id_imagen = publicId;
    modelInsertCompany.removeNullReferences();


    sql = this.dbService.insert(modelInsertCompany);
    await this.dbService.executeQueryModel(sql);
  
    throw new HttpException('company created correctly', HttpStatus.OK);
  }

  /**
   * Función para editar la cantidad de empresas que un cliente
   * puede registrar en la plataforma
   * @param id 
   * @param editTotalCompanyDto 
   */
  public async editCompanyTotal(id: number, editTotalCompanyDto: EditTotalCompanyDto) {
    
    let modelSelect = new ModelCompanyTotal();
    modelSelect.id_empresa_total = id;
    modelSelect.removeNullReferences();

    let sql = this.dbService.selectOne(modelSelect, true);
    let response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException(`no record with id ${modelSelect.id_empresa_total} found`, HttpStatus.NOT_FOUND);
    }

    const modelResponse = new ModelCompanyTotal(response[0]);

    sql = this.dbService.queryStringJson('selTotalCompany', [
      {
        name: 'ID_USUARIO',
        value:  modelResponse.id_usuario,
        type: TypeJson.NUMBER
      }
    ]);

    const responseCompanyCreated = await this.dbService.executeQueryModel(sql);
    const total = Number(Helper.getFirstElement(responseCompanyCreated));

    if (editTotalCompanyDto.total > total) {

      const modelWhere = new ModelCompanyTotal();
      modelWhere.id_empresa_total = modelSelect.id_empresa_total;
      modelWhere.removeNullReferences();

      const modelSet = new ModelCompanyTotal();
      modelSet.total = editTotalCompanyDto.total;
      modelSet.removeNullReferences();

      sql = this.dbService.update(modelWhere, modelSet);
      await this.dbService.executeQueryModel(sql);

      throw new HttpException(`the total was modified correctly`, HttpStatus.OK);

    }

    throw new HttpException('It is not possible to update the quantity, because the amount entered is less than the companies that are created',HttpStatus.CONFLICT);
  }

  /**
   * Función que me permite obtener la lista de todas las empresas
   * que estan registradas en la plataforma, esta misma funcion
   * tiene query parametros para filtrar por limite, categoria
   * y idUser si se requiere por una necesidad
   * @param queryParamCompanyDto 
   * @returns 
   */
  public async getCompanies(queryParamCompanyDto: QueryParamCompanyDto) {

    const {limit = 100, category = null, idUser = null} = queryParamCompanyDto;

    const modelSelect = new Company();
    modelSelect.fecha_eliminacion = DbService.IS_NULL;
    modelSelect.categoria = category ?? null;
    modelSelect.id_usuario = idUser ?? null;

    modelSelect.removeNullReferences();

    let sql = this.dbService.select(modelSelect, true, limit);

    let response = await this.dbService.executeQueryModel(sql);

    return response.map((elemento: Company) => {

      if (idUser) {
        const {id_empresa, fecha_creacion, fecha_actualizacion, fecha_eliminacion, formato_imagen, id_imagen, ...newObject} = elemento;
        return newObject;
      } else {
        const {id_usuario, id_empresa, fecha_creacion, fecha_actualizacion, fecha_eliminacion, formato_imagen, id_imagen, ...newObject} = elemento;
        return newObject;
      }
    });
  }

  /**
   * Función para editar una empresa, cambiarle las propiedades
   * de la tabla de la base de datos
   * @param editCompanyDto 
   */
  public async editCompany(editCompanyDto: EditCompanyDto, req: any) {
    
    if (Object.keys(editCompanyDto).length === 1) {
      throw new HttpException('there is nothing to update', HttpStatus.NOT_FOUND);
    }

    let modelSelect = new Company();
    
    if (req.user.type_user === TypeUserGeneral.CLIENT) {
    
      modelSelect.id_usuario = req.user.id;

    }
    modelSelect.id_empresa = editCompanyDto.id_empresa;
    modelSelect.removeNullReferences();

    let sql = this.dbService.selectOne(modelSelect, true);
    let response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException('The company does not correspond', HttpStatus.NOT_FOUND);
    }
    

    const modelWhere = new Company();
    modelWhere.id_empresa = editCompanyDto.id_empresa;
    modelWhere.removeNullReferences();

    editCompanyDto.id_empresa = null;
    const modelSet = new Company(editCompanyDto);
    modelSet.fecha_actualizacion = DbService.NOW;
    modelSet.removeNullReferences();

    sql = this.dbService.update(modelWhere, modelSet);

    await this.dbService.executeQueryModel(sql);

    throw new HttpException('the company was updated correctly', HttpStatus.OK);
  }
}
