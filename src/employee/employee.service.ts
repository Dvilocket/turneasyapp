import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DbService } from 'src/db/db.service';
import { Employee } from './entities';
import { Company } from 'src/company/entities/company.entity';
import { RequesExpressInterface } from 'src/interfaces';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TypeDayWeek, TypeDayWeekListGeneral, TypeUser, TypeUserGeneral } from 'src/enum';
import { TypeJson } from 'src/db/interfaces';
import { CreateEmployeeShiftDto } from './dto';
import { Helper } from 'src/helper';
import { Shift } from './entities/shift.entity';
import { ResponseShiftJsonInterface, ShiftJsonInterface } from './interfaces';

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

  /**
   * Funcion para obtener el id de las empresas
   * que tiene un cliente
   * @param idUser 
   * @returns 
   */
  private async getIdCompany(idUser: number): Promise<number[]> {
    
    let modelCompany = new Company();
    modelCompany.id_usuario = idUser;
    modelCompany.removeNullReferences();

    const sql = this.dbService.select(modelCompany, true);
    const response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException('A company has not been created', HttpStatus.BAD_REQUEST);
    }
    
    const listIds = [];
    for(const element of response) {
      modelCompany = new Company(element)
      if (modelCompany.id_empresa) {
        listIds.push(modelCompany.id_empresa);
      }
    }
    return listIds;
  }

  /**
   * 
   * @param id 
   * @param req 
   * @param createEmployeeShiftDto 
   */
  public async createShift(id: number, req: RequesExpressInterface, createEmployeeShiftDto:CreateEmployeeShiftDto) {
    const idsCompany =  await this.getIdCompany(req.user.id);
    
    if (!idsCompany.includes(id)) {
      throw new HttpException(`The company id ${id} is not associated with the client`, HttpStatus.BAD_REQUEST);
    }

    if(!Array.isArray(createEmployeeShiftDto.turnos)) {
      throw new HttpException('Error, must be an array', HttpStatus.INTERNAL_SERVER_ERROR);
    }


    let modelCompanySelect = new Company();
    modelCompanySelect.id_empresa = id;
    modelCompanySelect.removeNullReferences();

    const sqlModelCompanySelect = this.dbService.select(modelCompanySelect, true);
    const responseModelCompanySelect = await this.dbService.executeQueryModel(sqlModelCompanySelect);

    modelCompanySelect = new Company(responseModelCompanySelect[0]);
    modelCompanySelect.formatHour();


    const hourOpen = this.convertHourToMinute(modelCompanySelect.hora_apertura);
    const hourExit = this.convertHourToMinute(modelCompanySelect.hora_cierre);

    /**
     * Funcion es para comprobar que los horarios ingresados 
     * pertenecen al horario establecido por la empresa,
     * faltaba tener en cuenta esa funcionalidad
     * @param shedule 
     */
    const checkOpeningTime = (shedule: any[]) => {
      
      for(const element1 of shedule) {
        
        for(const element2 of element1.horario) {
          
          let hourStart = this.convertHourToMinute(element2.hora_inicio);
          let hourEnd = this.convertHourToMinute(element2.hora_fin);

          if (hourStart < hourOpen || hourEnd > hourExit) {
            const message = `The time entered ${element2.hora_inicio}, ${element2.hora_fin} does not comply with the company's schedules ${modelCompanySelect.hora_apertura}, ${modelCompanySelect.hora_cierre}`;
            throw new HttpException(message, HttpStatus.BAD_REQUEST);
          }
        }
      }
    };

    checkOpeningTime(createEmployeeShiftDto.turnos);

    for(const element of createEmployeeShiftDto.turnos) {

      if (!element.hasOwnProperty('id_empleado') || !Array.isArray(element.horario)) {
        continue;
      }

      let model = new Employee();
      model.id_empleado = element.id_empleado;
      model.id_empresa = id;
      model.removeNullReferences();

      let sql = this.dbService.selectOne(model, true);

      let response = await this.dbService.executeQueryModel(sql);

      if (response.length === 0) {
        throw new HttpException(`The employee id ${model.id_empleado} does not exist`, HttpStatus.BAD_REQUEST);
      }

      model = new Employee(response[0]);
      model.removeNullReferences();

      if (!model.activo) {
        throw new HttpException(`The employee id ${model.id_empleado} is not active`, HttpStatus.BAD_REQUEST);
      }
    
      const modelShift = new Shift();
      modelShift.id_empleado = element.id_empleado;
      modelShift.removeNullReferences();

      sql = this.dbService.select(modelShift, true);
      response = await this.dbService.executeQueryModel(sql);

      if (response.length > 0) {
        const daysWeekInDb: TypeDayWeek[] = this.getDaysWeekInDb(response);
        let datainsert = this.doFilterSchedule(daysWeekInDb, element.horario, response);
      
        const newData = response.map((element:any) => {
          const model = new Shift(element);
          model.removeNullReferences();
          model.formatHour();
          return {
            dia_semana: model.dia_semana,
            hora_inicio: model.hora_inicio,
            hora_fin: model.hora_fin
          };
        })

        this.dataIsSwapped([...datainsert, ...newData]);
        element.horario = datainsert;
      }

      this.dbService.beginTransaction();

        for(const schedule of element.horario) {
          const modelInsert = new Shift(
            {
              ...schedule,
              id_empleado: element.id_empleado
            }
          );
          modelInsert.removeNullReferences();

          sql = this.dbService.insertOnConflict(modelInsert, true);

          await this.dbService.executeQueryInTransaction(sql);

        }
        this.dbService.commitTransaction();
    }
    throw new HttpException('records were entered correctly', HttpStatus.OK);
  }

  /**
   * Función para obtener los dias de la semana del horario de un empleado
   * en especifico
   * @param response 
   * @returns 
   */
  private getDaysWeekInDb(response: any[]): TypeDayWeek[] {
    const list = [];
    for(const element of response) {
      const model = new Shift(element);
      model.removeNullReferences();
      if (!list.includes(model.dia_semana)) {
        list.push(model.dia_semana);
      }
    }
    return list
  }

  /**
   * Funcion para filtrar un horario, es decir sacarle los repetidos
   * pues no hay necesidad de ingresar nuevamente esos repetidos
   * @param weekInDb 
   * @param scheduleClient 
   * @param scheduleDb 
   * @returns 
   */
  private doFilterSchedule(weekInDb: TypeDayWeek[], scheduleClient: any[], scheduleDb: any[]) {
    const allowedList = [];
    const repeatList = [];

    for(const element of scheduleClient) {
      if (!weekInDb.includes(element.dia_semana)) {
        allowedList.push(element);
        continue;
      }
      repeatList.push(element);
    }

    const removeRepeat = () => {

      for(const day of weekInDb) {

        let elementDb = [];
        let elementClient = [];

        for(const element of scheduleClient) {
          if (element.dia_semana === day) {
            elementClient.push(element);
          }
        }

        for(const element of scheduleDb) {
          const model = new Shift(element);
          model.removeNullReferences();
          model.formatHour();

          if (model.dia_semana === day) {
            elementDb.push({
              dia_semana: model.dia_semana,
              hora_inicio: model.hora_inicio,
              hora_fin: model.hora_fin
            })
          }
        }
        
        if (elementDb.length > 0 && elementClient.length > 0) {
          for(const elementA of elementClient) {
            let exists = false;
            for(const elementB of elementDb) {
              if (elementA.dia_semana === elementB.dia_semana && elementA.hora_inicio === elementB.hora_inicio && elementA.hora_fin === elementB.hora_fin) {
                exists = true;
                break;
              }
            }
            if (!exists) {
              allowedList.push(elementA);
            }
          }
        }

      }
    }
    if (repeatList.length > 0) {
      removeRepeat();
    }
    
    if (allowedList.length === 0) {
      throw new HttpException('These schedules are already in the database', HttpStatus.BAD_REQUEST);
    }
    return allowedList;
  }

  /**
   * Funcion para comprobar que si un empleado ingresa un horario
   * y ya tiene horarios en base de datos, pues se debe revisar
   * que no vayan a solapar los horarios existentes, esto se hace
   * para eivtar datos errroneos
   * @param schedule 
   */
  private dataIsSwapped(schedule: any[]) {
    for(const dayWeek of TypeDayWeekListGeneral) {
      const list = schedule.filter((element) => element.dia_semana === dayWeek);
      if (list.length >= 2 && this.thereIsOverLap(list)) {
        throw new HttpException('It is not possible to enter the schedules because a schedule is overlapping with one in the database, please check the schedules', HttpStatus.BAD_REQUEST);
      }
    }
  }

  /**
   * Funcion para comprobar si los horarios se solapan
   * @param schedules 
   * @returns 
   */
  private thereIsOverLap(schedules: any[]): boolean {
    for(let i = 0; i < schedules.length; i++) {
      for(let j = i + 1; j < schedules.length; j++) {
        const inicio1 = this.convertHourToMinute(schedules[i].hora_inicio);
        const fin1 = this.convertHourToMinute(schedules[i].hora_fin);
        const inicio2 = this.convertHourToMinute(schedules[j].hora_inicio);
        const fin2 = this.convertHourToMinute(schedules[j].hora_fin);

        if (inicio1 < fin2 && fin1 > inicio2) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Funcion para convertir de horas a minutos
   * @param hour 
   * @returns 
   */
  private convertHourToMinute(hour: string): number {
      const [h, m] = hour.split(':').map(Number);
      return h * 60 + m;
  }

  /**
   * Funcion para mostrar los horarios de los empleados
   * con su respectiva empresa, muestra todos los horarios
   * que lo comprenden, tiene en cuenta si es adminsitrador
   * o cliente
   * @param req 
   * @returns 
   */
  public async getShift(req: RequesExpressInterface) {

    let sql = '';
    if (req.user.type_user === TypeUserGeneral.CLIENT) {
      const idsCompany =  await this.getIdCompany(req.user.id);

      sql = this.dbService.queryStringJson('selShift', [
        {
          name: 'ID_USUARIO',
          value: idsCompany.join(','),
          type: TypeJson.STRING
        }
      ]);

    } else {
      sql = this.dbService.queryStringJson('selShiftAdministrator');
    }

    let response: ResponseShiftJsonInterface[] = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException('There is no employee containing shifts', HttpStatus.NO_CONTENT);
    }

    const responseJson: ShiftJsonInterface[] = [];

    const existsCompanyJson = (id: number) => {
      for(const element of responseJson) {
        if (element.id_empresa === id) {
          return true;
        }
      }
      return false;
    }

    const addCompanyJson = (element: ResponseShiftJsonInterface) => {
      responseJson.push(
        {
          id_empresa: element.id_empresa,
          nombre: element.nombre,
          direccion: element.direccion,
          empleados : [
            {
              id_empleado: element.id_empleado,
              nombre_empleado: element.nombre_empleado,
              correo_empleado: element.correo_empleado,
              telefono_empleado: element.telefono_empleado,
              imagen_empleado: element.imagen_empleado,
              horarios: [
                {
                  dia_semana: element.dia_semana,
                  hora_inicio: element.hora_inicio,
                  hora_fin: element.hora_fin,
                  fecha_creacion: element.fecha_creacion
                }
              ]
            }
          ]
        }
      );
    }

    const getCompanyByIdJson = (id: number) => {
      for(const element of responseJson) {
        if (element.id_empresa === id) {
          return element;
        }
      }
    }

    const doProccessJson = (element: ResponseShiftJsonInterface) => {
      const elementJson = getCompanyByIdJson(element.id_empresa);
      for(const employee of elementJson.empleados) {
        if (employee.id_empleado === element.id_empleado) {
            employee.horarios.push(
              {
                dia_semana: element.dia_semana,
                hora_inicio: element.hora_inicio,
                hora_fin: element.hora_fin,
                fecha_creacion: element.fecha_creacion
              }
            )
          return;
        }
      }
      elementJson.empleados.push({
        id_empleado : element.id_empleado,
        nombre_empleado: element.nombre_empleado,
        correo_empleado: element.correo_empleado,
        telefono_empleado: element.telefono_empleado,
        imagen_empleado: element.imagen_empleado,
        horarios: [
          {
            dia_semana: element.dia_semana,
            hora_inicio: element.hora_inicio,
            hora_fin: element.hora_fin,
            fecha_creacion: element.fecha_creacion
          }
        ]
      })
    }

    for(const element of response) {
      if (responseJson.length === 0) {
        addCompanyJson(element);
      } else {
        if (!existsCompanyJson(element.id_empresa)) {
          addCompanyJson(element);
          continue;
        }
        doProccessJson(element)
      }
    }
    return responseJson;
  }
}
