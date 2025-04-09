import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Company } from 'src/company/entities/company.entity';
import { CreateServiceBaseDto, EditServiceDto } from './dto';
import { Service } from './entities';
import { RequesExpressInterface } from 'src/interfaces/request-express.interface';
import { ResponseExpressInterface } from 'src/interfaces';
import { TypeUserGeneral } from 'src/enum';
import { TypeJson } from 'src/db/interfaces';
import { Helper } from 'src/helper';


@Injectable()
export class ServiceService {

  constructor(
    private readonly dbService: DbService
  ){}

  /**
   * Función para ingresar los servicios de una empresa, 
   * esta funcion se encarga de ingresar n servicios
   * devuelve la cantidad de registros que se ingresaron
   * y los que no se pudieron ingresar
   * @param createServiceBaseDto 
   * @param req 
   * @returns 
   */
  public async createServiceCompany(
    createServiceBaseDto: CreateServiceBaseDto,
    req: RequesExpressInterface,
    res: ResponseExpressInterface,
  ) {
    const response = {
      quantityElementsEntered: 0,
      recordsNotEntered: 0,
      elementsNotEntered: [],
    };
  
    const newName = (name: string) => {
      return name.length > 10 ? name.slice(0, name.length - 5) + '...' : name;
    };
  
    for (const service of createServiceBaseDto.servicios) {
      let modelCompany = new Company();
      modelCompany.id_empresa = service.id_empresa;
      modelCompany.id_usuario = req.user.id;
      modelCompany.removeNullReferences();
  
      let sqlCompany = this.dbService.selectOne(modelCompany, true);
      let responseCompany = await this.dbService.executeQueryModel(sqlCompany);
  
      if (responseCompany.length === 0) {
        response.recordsNotEntered += 1;
        response.elementsNotEntered.push(newName(service.nombre_servicio));
        continue;
      }
  
      let modelService = new Service();
      modelService.id_empresa = service.id_empresa;
      modelService.nombre_servicio = service.nombre_servicio.toLowerCase();
      modelService.removeNullReferences();
  
      let sqlService = this.dbService.selectOne(modelService, true);
      let responseService = await this.dbService.executeQueryModel(sqlService);
  
      if (responseService.length > 0) {
        response.recordsNotEntered += 1;
        response.elementsNotEntered.push(newName(service.nombre_servicio));
        continue;
      }
  
      let modelInsert = new Service(service);
      modelInsert.removeNullReferences();
  
      let sqlInsert = this.dbService.insert(modelInsert);
      await this.dbService.executeQueryModel(sqlInsert);
      response.quantityElementsEntered += 1;
    }
  
    const status = response.quantityElementsEntered > 0 ? 200 : 422;
    return res.status(status).json(response);
  }


  /**
   * Función para actualizar los servicios de una empresa
   * si el usario es de tipo cliente, pues se debe validar
   * que dichos servicios corresponde a la empresa de dicho
   * cliente, en cambio si es administrador puede editarlo
   * como el quiera
   * @param id 
   * @param editServiceDto 
   * @param req 
   */
  public async editServiceCompany(id: number, editServiceDto: EditServiceDto, req: RequesExpressInterface) {
    
    if (req.user.type_user === TypeUserGeneral.CLIENT) {

      const sql = this.dbService.queryStringJson('selExistsEditServiceCompany', [
        {
          name: 'ID_USUARIO',
          value: req.user.id,
          type: TypeJson.NUMBER
        }, 
        {
          name: 'ID_SERVICIO',
          value: id,
          type: TypeJson.NUMBER
        }
      ]);

      const responseSql = await this.dbService.executeQueryModel(sql);
      const response: boolean = Helper.getFirstElement(responseSql);

      if (!response) {
        throw new HttpException(
          `That record does not correspond to you`,
          HttpStatus.FORBIDDEN
        );
      }
    }  
  
    const modelWhere = new Service();
    modelWhere.id_servicio = id;
    modelWhere.removeNullReferences();

    const modelSet = new Service(editServiceDto);
    modelSet.fecha_actualizacion = DbService.NOW;

    
    modelSet.removeNullReferences();

    if (editServiceDto.hasOwnProperty('activo') && !editServiceDto.activo) {
      modelSet.fecha_eliminacion = DbService.NOW;
    } else {
      modelSet.fecha_eliminacion = null;
    }

    const sql = this.dbService.update(modelWhere, modelSet);
    await this.dbService.executeQueryModel(sql);

    throw new HttpException(
      'registry updated successfully',
      HttpStatus.OK
    )
  }

  /**
   * Funcion para obtener los servicios de una empresa
   * @param id 
   * @returns 
   */
  public async getServiceGeneral(id: number) {
    
    const model = new Service();
    model.id_empresa = id;
    model.activo = true;
    model.removeNullReferences();

    const sql = this.dbService.select(model, true);

    const response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException(`No se encuentran servicios para la empresa ${id}`, HttpStatus.NOT_FOUND);
    }

    return response.map((element: Service) => ({
      id_servicio: element.id_servicio,
      nombre_servicio: element.nombre_servicio,
      descripcion: element.descripcion,
      duracion: element.duracion,
      precio: element.precio,
      consolidado: `${element.nombre_servicio} - $${element.precio.toLocaleString('es-CO')}`
    }))

  }
}
