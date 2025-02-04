import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateCompanyDto, EditTotalCompanyDto } from './dto';
import { ModelCompanyTotal } from 'src/model';
import { TypeJson } from 'src/db/interfaces';
import { Helper } from 'src/helper';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Company } from './entities/company.entity';

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
}
