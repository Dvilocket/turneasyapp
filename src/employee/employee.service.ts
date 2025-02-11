import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DbService } from 'src/db/db.service';
import { Employee } from './entities';
import { Company } from 'src/company/entities/company.entity';
import { RequesExpressInterface } from 'src/interfaces';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TypeUserGeneral } from 'src/enum';
import { TypeJson } from 'src/db/interfaces';

@Injectable()
export class EmployeeService {

  constructor(
    private readonly dbService: DbService,
    private readonly cloudinaryService: CloudinaryService
  ){}


  /**
   * Función para crear un empleado
   * @param createEmployeeDto 
   * @param req 
   * @param file 
   */
  public async createEmployee(createEmployeeDto: CreateEmployeeDto, req: RequesExpressInterface, file: Express.Multer.File) {
    
    const modelEmployee = new Employee(createEmployeeDto);
    modelEmployee.removeNullReferences();

    let modelSelectEmployee = new Employee();
    modelSelectEmployee.correo = modelEmployee.correo;
    modelSelectEmployee.removeNullReferences();

    let sql = this.dbService.selectOne(modelSelectEmployee, true);
    let response = await this.dbService.executeQueryModel(sql);


    if (response.length > 0) {
      throw new HttpException(`Mail ${modelSelectEmployee.correo} already exists`, HttpStatus.CONFLICT);
    }

    let modelSelectCompany = new Company();
    modelSelectCompany.id_usuario = req.user.id;
    modelSelectCompany.removeNullReferences();


    sql = this.dbService.select(modelSelectCompany, true);

    response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException(`You do not currently have any company created`, HttpStatus.BAD_REQUEST);
    }

    const [secureUrl, publicId, format] = await this.cloudinaryService.uploadImage(file);

    if (!secureUrl || !publicId || !format) {
      throw new HttpException('It is not possible to upload images at this time', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    modelEmployee.url_imagen = secureUrl;
    modelEmployee.formato_imagen = format;
    modelEmployee.id_imagen = publicId;


    if (response.length === 1) {

      modelSelectCompany = new Company(response[0]);
      modelEmployee.id_empresa = modelSelectCompany.id_empresa;

      sql = this.dbService.insert(modelEmployee);


      await this.dbService.executeQueryModel(sql);

    } else {

      if (!createEmployeeDto.id_empresa) {
        throw new HttpException('The id_empresa attribute is necessary because the client has several companies', HttpStatus.BAD_REQUEST);
      }
      
      const listIdCompany = response.map((element: Company) => element.id_empresa);
      
      let idCompanyUser = createEmployeeDto.id_empresa.split(',').map(Number);

      idCompanyUser = idCompanyUser.filter((element: number) => listIdCompany.includes(element));
      

      if (idCompanyUser.length === 0) {
        throw new HttpException(`the ids ${createEmployeeDto.id_empresa} do not exist`, HttpStatus.BAD_REQUEST);
      }

      this.dbService.beginTransaction();

      for(const idCompany of idCompanyUser) {
        
        const modelInsertCompany = new Company({
          ...modelEmployee
        });

        modelInsertCompany.id_empresa = idCompany;
        modelInsertCompany.removeNullReferences();

        sql = this.dbService.insert(modelInsertCompany);


        await this.dbService.executeQueryInTransaction(sql);
      }
      this.dbService.commitTransaction();
    }
    
    throw new HttpException('employees were inserted correctly', HttpStatus.OK);
  }



  /**
   * Funcionalidad para editar un empleado
   * @param id 
   * @param updateEmployeeDto 
   * @param req 
   * @returns 
   */
  public async editEmployee(id: number, updateEmployeeDto: UpdateEmployeeDto, req: RequesExpressInterface, file: Express.Multer.File = null) {
    
    //Funcion para obtener un empleado de acuerdo a su id
    const getObjectEmployee = async (idEmployee: number): Promise<Employee> => {
      
      let model = new Employee();
      model.id_empleado = idEmployee;
      model.removeNullReferences();

      const sql = this.dbService.selectOne(model, true);
      const response = await this.dbService.executeQueryModel(sql);

      if (response.length > 0) {
        model =  new Employee(response[0]);
        model.removeNullReferences();
        return  model;
      }

    }

    let response = null;
    let sql = null;

    /**
     * Si el usuario es tipo cliente, pues yo tengo que revisar
     * si al empleado que va a editar le corresponde
     */
    if (req.user.type_user === TypeUserGeneral.CLIENT) {

      let sql = this.dbService.queryStringJson('selExistsEditEmployee', [
        {
          name: 'ID_USUARIO',
          value: req.user.id,
          type: TypeJson.NUMBER
        }, 
        {
          name: 'ID_EMPLEADO',
          value: id,
          type: TypeJson.NUMBER
        }
      ]);

      let response = await this.dbService.executeQueryModel(sql);
      
      if (response.length === 0) {
        throw new HttpException(`You can't edit the employee with ID ${id} because it does not belong`, HttpStatus.BAD_REQUEST);
      }
    }

      const objectEmployee = await getObjectEmployee(id);

      if (updateEmployeeDto.hasOwnProperty('nombre') && updateEmployeeDto.hasOwnProperty('correo')) {
        
        const modelSelectEmployee = new Employee();
        modelSelectEmployee.nombre = updateEmployeeDto.nombre;
        modelSelectEmployee.correo = updateEmployeeDto.correo;
        modelSelectEmployee.id_empresa = objectEmployee.id_empresa;

        modelSelectEmployee.removeNullReferences();

        sql = this.dbService.selectOne(modelSelectEmployee, true);

        response = await this.dbService.executeQueryModel(sql);

        if (response.length > 0) {
          throw new HttpException(`An employee already exists with name ${modelSelectEmployee.nombre} and email ${modelSelectEmployee.correo}`, HttpStatus.BAD_REQUEST);
        }
      }

      const modelWhere = new Employee();
      modelWhere.id_empleado = id;
      modelWhere.removeNullReferences();

      const modelSet = new Employee(updateEmployeeDto);
      modelSet.fecha_actualizacion = DbService.NOW;

      if (file) {

        await this.cloudinaryService.deleteImage(objectEmployee.id_imagen);
        const [secureUrl, publicId, format] = await this.cloudinaryService.uploadImage(file);

        if (!secureUrl || !publicId || !format) {
          throw new HttpException('error, it is not possible to upload the image at this time', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        modelSet.url_imagen = secureUrl;
        modelSet.formato_imagen = format;
        modelSet.id_imagen = publicId;
      }

      modelSet.removeNullReferences();

      if (!updateEmployeeDto.activo) {
        modelSet.fecha_eliminacion = DbService.NOW;
      } else {
        modelSet.fecha_eliminacion = null;
      }

      sql = this.dbService.update(modelWhere, modelSet);

      await this.dbService.executeQueryModel(sql);

      throw new HttpException('The employee was successfully updated', HttpStatus.OK);
    
  }
}
