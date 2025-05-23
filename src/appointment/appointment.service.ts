import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DbService } from 'src/db/db.service';
import { Company } from 'src/company/entities/company.entity';
import { Employee, EmployeeServiceEntity } from 'src/employee/entities';
import { Service } from 'src/service/entities';
import { Helper } from 'src/helper';
import { Shift } from 'src/employee/entities/shift.entity';
import { Appointment } from './entities/appointment.entity';
import { RequesExpressInterface } from 'src/interfaces';
import { TypeJson } from 'src/db/interfaces';
import { QueryParamAppointmentDto, QueryParamAppointmentExtendDto, QueryParamAppointmentGeneralDto } from './dto';
import { TypeUserGeneral } from 'src/enum';

@Injectable()
export class AppointmentService {

  constructor(
    private readonly dbService: DbService
  ) { }

  /**
   * Función para agendar una cita, esta funcion es de manera General
   * y despues se piensa para que funcione como cliente
   * @param idCompany 
   * @param createAppointmentDto 
   * @returns 
   */
  public async createAppointment(idCompany: number, createAppointmentDto: CreateAppointmentDto) {

    const modelCompany = new Company();
    modelCompany.id_empresa = idCompany;
    modelCompany.removeNullReferences();

    let sql = this.dbService.selectOne(modelCompany, true);
    const responseCompany = await this.dbService.executeQueryModel(sql);

    //debo preguntarme si la empresa existe
    if (responseCompany.length === 0) {
      throw new HttpException(`Company with id ${modelCompany.id_empresa} does not exist`, HttpStatus.NOT_FOUND);
    }

    //Debo preguntarme si el servicio existe
    const modelService = new Service();
    modelService.id_servicio = createAppointmentDto.id_servicio;
    modelService.id_empresa = idCompany;
    modelService.activo = true;
    modelService.removeNullReferences();

    sql = this.dbService.selectOne(modelService, true);
    const responseService = await this.dbService.executeQueryModel(sql);

    if (responseService.length === 0) {
      throw new HttpException(`Service with id ${modelService.id_servicio} does not exist`, HttpStatus.NOT_FOUND);
    }


    //Debo preguntarme si la empresa actual, tiene empleados disponibles
    const modelEmployee = new Employee();
    modelEmployee.id_empresa = idCompany;
    modelEmployee.activo = true;
    modelEmployee.removeNullReferences();

    sql = this.dbService.select(modelEmployee, true);
    const responseEmployee = await this.dbService.executeQueryModel(sql);

    if (responseEmployee.length === 0) {
      throw new HttpException(`The company with id ${modelCompany.id_empresa} has no available employees`, HttpStatus.NOT_FOUND);
    }

    /**
     * Debo preguntarme si el id_empleado que me ingresa el usuario
     * existe un empleado con ese id asociado a esa empresa y que el
     * empleado este activo
     */
    const existEmployee = responseEmployee.some((employee: Employee) => employee.id_empleado === createAppointmentDto.id_empleado && employee.id_empresa === idCompany);

    if (!existEmployee) {
      throw new HttpException(`Employee with id ${createAppointmentDto.id_empleado} does not exist`, HttpStatus.NOT_FOUND);
    }

    const employeeActive = responseEmployee.filter((employee: Employee) => employee.id_empleado === createAppointmentDto.id_empleado);
    const employeeDb = new Employee(employeeActive[0]);

    //El servicio existe, ahora debo verificar si ese servicio esta asignado a ese empleado
    const modelEmployeeServiceEntity = new EmployeeServiceEntity();
    modelEmployeeServiceEntity.id_servicio = modelService.id_servicio;
    modelEmployeeServiceEntity.id_empleado = employeeDb.id_empleado;

    const sqlEmployeeServiceEntity = this.dbService.selectOne(modelEmployeeServiceEntity, true);
    const responseEmployeeServiceEntity = await this.dbService.executeQueryModel(sqlEmployeeServiceEntity);

    if (responseEmployeeServiceEntity.length === 0) {
      throw new HttpException(`El empleado con id ${employeeDb.id_empleado} no tiene aignado el servicio con id ${modelService.id_servicio}`, HttpStatus.BAD_REQUEST);
    }

    /**
     * Debemos preguntarnos si ese empleado tiene turnos
     * es ilogico, asignar a este empleado si no tiene
     * ningun turno asignado, nos traemos todos su horario
     * de disponibilidad
     */
    const modelShift = new Shift();
    modelShift.id_empleado = employeeDb.id_empleado;
    modelShift.removeNullReferences();

    sql = this.dbService.select(modelShift, true);
    const responseShift = await this.dbService.executeQueryModel(sql);

    if (responseShift.length === 0) {
      throw new HttpException(`Employee with id ${modelShift.id_empleado} have not shifts`, HttpStatus.NOT_FOUND);
    }

    /**
     * Ahora debo preguntarme si el empleado tiene un dia de la semana
     * que esta solicitando el usuario, es decir, si el Usuario
     * escogio Lunes para la cita, pues debe existir un horario para
     * el empleado pero para el dia Lunes, si no lo tiene, pues
     * no hay necesidad de asignarlo, porque no lo tiene
     */
    const dayWeekUser = Helper.getDayWeek(createAppointmentDto.fecha_servicio);

    const existDayWeekUser = responseShift.some((shift: Shift) => shift.dia_semana === dayWeekUser);

    if (!existDayWeekUser) {
      throw new HttpException(`The employee with ID ${employeeDb.id_empleado} does not have the day ${dayWeekUser} assigned in the schedule, please create that schedule for him/her.`, HttpStatus.NOT_FOUND);
    }

    //Obtenemos los turnos que tenemos en la base de datos, para ese empleado
    const shiftDb: Shift[] = responseShift.filter((shift: Shift) => shift.dia_semana === dayWeekUser);

    const modelAppointment = new Appointment();
    modelAppointment.id_empresa = idCompany;
    modelAppointment.id_empleado = employeeDb.id_empleado;
    modelAppointment.dia_semana_servicio = dayWeekUser;
    modelAppointment.fecha_servicio = createAppointmentDto.fecha_servicio;
    modelAppointment.removeNullReferences();

    sql = this.dbService.select(modelAppointment, true);
    const responseAppointment = await this.dbService.executeQueryModel(sql);

    /* Ahora debemo preguntarme si ese usuario con ese correo ya ha agendado
    uan cita, no podemos agendar mas citas con ese correo que tiene
    el usuario, si no se hace eso, vamos a permitir que ese usario agende
    citas como el quiere*/

    const existUserInDb = responseAppointment.some((appointment: Appointment) => appointment.dia_semana_servicio === dayWeekUser && appointment.correo === createAppointmentDto.correo);

    if (existUserInDb) {
      throw new HttpException("Ya programaste una cita para el dia de hoy", HttpStatus.CONFLICT);
    }

    let isInserted = false;
    const responseServiceModel = new Service(responseService[0]);

    const hourSinceService = createAppointmentDto.hora_servicio;
    const hourUntilService = Helper.addMinutes(hourSinceService, responseServiceModel.duracion);

    const endMinutesSinceService = Helper.convertHourToMinute(hourSinceService);
    const endMinutesUntilService = Helper.convertHourToMinute(hourUntilService);

    /**
     * Si entra en el siguiente condicional quiere decir que el empleado
     * para esa fecha, tiene turnos, por lo tanto tenemos que explorar
     * que los turnos que estan creados no vaya a chocar con los turnos
     * que vamos a ingresar, por eso se valida primero esa condición
     */
    if (responseAppointment.length >= 1) {

      for (const element of responseAppointment) {

        const modelElement = new Appointment(element);
        modelElement.formatHour();

        const modelElementMinuteStart = Helper.convertHourToMinute(modelElement.hora_desde_servicio);
        const modelElementMinuteEnd = Helper.convertHourToMinute(modelElement.hora_hasta_servicio);

        if (
          // Caso 1: Nueva reserva comienza DENTRO de una existente
          (endMinutesSinceService > modelElementMinuteStart && endMinutesSinceService < modelElementMinuteEnd) ||
          // Caso 2: Nueva reserva termina DENTRO de una existente
          (endMinutesUntilService > modelElementMinuteStart && endMinutesUntilService < modelElementMinuteEnd) ||
          // Caso 3: Nueva reserva ENVUELVE una existente
          (endMinutesSinceService <= modelElementMinuteStart && endMinutesUntilService >= modelElementMinuteEnd)
        ) {
          throw new HttpException('The schedule is busy, please try another time slot', HttpStatus.CONFLICT);
        }
      }
    }

    for (const shift of shiftDb) {
      const modelShiftObject = new Shift(shift);
      modelShiftObject.formatHour();

      const minuteStartShiftObject = Helper.convertHourToMinute(modelShiftObject.hora_inicio);
      const minuteEndShiftObject = Helper.convertHourToMinute(modelShiftObject.hora_fin);

      const isRange = endMinutesSinceService >= minuteStartShiftObject && endMinutesUntilService <= minuteEndShiftObject;

      if (shift.dia_semana === dayWeekUser && isRange) {

        const modelInsert = new Appointment();

        modelInsert.id_empresa = idCompany;
        modelInsert.id_servicio = modelService.id_servicio;
        modelInsert.id_empleado = createAppointmentDto.id_empleado;
        modelInsert.dia_semana_servicio = dayWeekUser;
        modelInsert.fecha_servicio = createAppointmentDto.fecha_servicio;
        modelInsert.hora_desde_servicio = createAppointmentDto.hora_servicio;
        modelInsert.hora_hasta_servicio = hourUntilService;
        modelInsert.nombre = createAppointmentDto.nombre;
        modelInsert.apellido = createAppointmentDto.apellido;
        modelInsert.correo = createAppointmentDto.correo;
        modelInsert.telefono = createAppointmentDto.telefono;

        modelInsert.removeNullReferences();

        const sqlInsert = this.dbService.insert(modelInsert);
        await this.dbService.executeQueryModel(sqlInsert);
        isInserted = true;
        break;
      }
    }

    if (!isInserted) {
      throw new HttpException('it is not possible to schedule the appointment', HttpStatus.CONFLICT);
    }
    throw new HttpException('appointment scheduled correctly', HttpStatus.OK);
  }


  /**
   * Funcion para obtener las citas que actualmente estan en base de datos
   * @param queryParamAppointmentDto 
   * @param req 
   * @returns 
   */
  public async getAppointment(queryParamAppointmentDto: QueryParamAppointmentDto, req: RequesExpressInterface) {

    let response = null;
    let sql = null;

    const { desde = Helper.getDateNow(), hasta = Helper.getDateNow() } = queryParamAppointmentDto;

    if (req.user.type_user === TypeUserGeneral.CLIENT) {

      const modelCompany = new Company();
      modelCompany.id_usuario = req.user.id;
      modelCompany.removeNullReferences();

      sql = this.dbService.select(modelCompany, true);

      response = await this.dbService.executeQueryModel(sql);

      if (response.length === 0) {
        throw new HttpException('No company has been created', HttpStatus.NO_CONTENT);
      }

      sql = this.dbService.queryStringJson('selAppointment', [
        {
          name: 'ID_EMPRESA',
          value: response.map((element: Company) => element.id_empresa).join(','),
          type: TypeJson.STRING
        },
        {
          name: "FECHA_DESDE",
          value: desde,
          type: TypeJson.STRING
        },
        {
          name: "FECHA_HASTA",
          value: hasta,
          type: TypeJson.STRING
        }
      ]);

    } else {

      //Significa que es un administrador
      const modelCompanyGeneral = new Company();
      modelCompanyGeneral.removeNullReferences();

      const sqlCompanyGeneral = this.dbService.select(modelCompanyGeneral, true);
      response = await this.dbService.executeQueryModel(sqlCompanyGeneral);

      sql = this.dbService.queryStringJson("selAppointmentAdmin", [
        {
          name: "FECHA_DESDE",
          value: desde,
          type: TypeJson.STRING
        },
        {
          name: "FECHA_HASTA",
          value: hasta,
          type: TypeJson.STRING
        }
      ])
    }
    const responseAppointment = await this.dbService.executeQueryModel(sql);

    if (responseAppointment.length === 0) {
      throw new HttpException(`The company currently has no scheduled appointments.`, HttpStatus.NOT_FOUND);
    }

    const listServices: Service[] = [];
    const listEmployees: Employee[] = [];

    const createAppointment = async (idCompany: number) => {

      const jsonResponse = [];

      const appointment: Appointment[] = responseAppointment.filter((element: Appointment) => element.id_empresa === idCompany);

      const addElement = (service: Service, employee: Employee, appointment: Appointment) => {

        jsonResponse.push({
          servicio: {
            nombre_servicio: service.nombre_servicio,
            descripcion: service.descripcion,
            duracion: String(service.duracion) + ' minutos',
            precio: service.precio
          },
          empleado: {
            nombre: employee.nombre,
            correo: employee.correo,
            telefono: employee.telefono,
            url_imagen: employee.url_imagen
          },
          informacion: {
            dia_cita: appointment.dia_semana_servicio,
            fecha_cita: Helper.formatDate(appointment.fecha_servicio),
            hora_cita: Helper.formatHour(appointment.hora_desde_servicio),
            hora_finalizacion_cita: Helper.formatHour(appointment.hora_hasta_servicio),
            nombre_cliente: appointment.nombre,
            apellido_cliente: appointment.apellido,
            correo_cliente: appointment.correo,
            telefono_cliente: appointment.telefono
          }
        })
      };

      for (const element of appointment) {

        const model = new Appointment(element);
        model.removeNullReferences();

        if (listServices.length === 0 && listEmployees.length === 0) {

          let modelService = new Service();
          modelService.id_servicio = model.id_servicio;
          modelService.removeNullReferences();

          const sqlModelService = this.dbService.select(modelService, true);
          const responseModelService = await this.dbService.executeQueryModel(sqlModelService);

          modelService = new Service(responseModelService[0]);
          modelService.removeNullReferences();

          let modelEmployee = new Employee();
          modelEmployee.id_empleado = model.id_empleado;
          modelEmployee.removeNullReferences();

          const sqlModelEmployee = this.dbService.select(modelEmployee, true);
          const responseModelEmployee = await this.dbService.executeQueryModel(sqlModelEmployee);

          modelEmployee = new Employee(responseModelEmployee[0])
          modelEmployee.removeNullReferences();

          listServices.push(modelService);
          listEmployees.push(modelEmployee);

          addElement(modelService, modelEmployee, model);

          continue;

        } else {
          const serviceInList = listServices.filter((element) => element.id_servicio === model.id_servicio);

          let elementA = null;

          if (serviceInList.length === 0) {

            elementA = new Service();
            elementA.id_servicio = model.id_servicio;
            elementA.removeNullReferences();

            const sqlElementA = this.dbService.select(elementA, true);
            const responseElementA = await this.dbService.executeQueryModel(sqlElementA);

            elementA = new Service(responseElementA[0]);
            elementA.removeNullReferences();

            listServices.push(elementA);

          } else {
            elementA = new Service(serviceInList[0]);
          }

          const employeeInList = listEmployees.filter((element) => element.id_empleado === model.id_empleado);

          let elementB = null;

          if (employeeInList.length === 0) {

            elementB = new Employee();
            elementB.id_empleado = model.id_empleado;
            elementB.removeNullReferences();

            const sqlElementB = this.dbService.select(elementB, true);
            const responseElementB = await this.dbService.executeQueryModel(sqlElementB);

            elementB = new Employee(responseElementB[0]);
            elementB.removeNullReferences();

            listEmployees.push(elementB);

          } else {
            elementB = new Employee(employeeInList[0]);
          }
          addElement(elementA, elementB, model);
        }
      }
      return jsonResponse;
    }

    let responseJson = [];

    for (const element of response) {

      const model = new Company(element);
      model.removeNullReferences();

      model.hora_apertura = Helper.formatHour(model.hora_apertura);
      model.hora_cierre = Helper.formatHour(model.hora_cierre);

      const { id_usuario, fecha_creacion, fecha_actualizacion, fecha_eliminacion, formato_imagen, id_imagen, nombreTabla, ...result } = model;

      result['citas'] = await createAppointment(model.id_empresa);

      responseJson.push(result);
    }

    return responseJson;
  }

  /**
   * Funcionalidad terminada, para filtrar
   * @param idEmployee 
   * @param req 
   * @returns 
   */
  public async getAppointmentByEmployee(idEmployee: number, req: RequesExpressInterface, queryParamAppointmentExtendDto: QueryParamAppointmentExtendDto) {

    let sql = null;
    if (queryParamAppointmentExtendDto.desde && queryParamAppointmentExtendDto.hasta) {

      //Tiene el filtro de la fecha desde hasta la fecha hasta
      sql = this.dbService.queryStringJson('selAppointmentUserGeneral', [
        {
          name: 'ID_EMPLEADO',
          value: idEmployee,
          type: TypeJson.NUMBER
        },
        {
          name: 'FECHA_DESDE',
          value: queryParamAppointmentExtendDto.desde,
          type: TypeJson.STRING
        },
        {
          name: 'FECHA_HASTA',
          value: queryParamAppointmentExtendDto.hasta,
          type: TypeJson.STRING
        }
      ]);
    } else if (queryParamAppointmentExtendDto.dia_semana) {

      //Tiene el filtro de la semana
      const modelAppointment = new Appointment();
      modelAppointment.id_empleado = idEmployee;
      modelAppointment.dia_semana_servicio = queryParamAppointmentExtendDto.dia_semana;
      modelAppointment.removeNullReferences();

      sql = this.dbService.select(modelAppointment, true);
    } else if (queryParamAppointmentExtendDto.hora_desde && queryParamAppointmentExtendDto.hora_hasta) {

      sql = this.dbService.queryStringJson('selAppointmentUserGeneralByHour', [
        {
          name: 'ID_EMPLEADO',
          value: idEmployee,
          type: TypeJson.NUMBER
        },
        {
          name: 'HORA_DESDE',
          value: queryParamAppointmentExtendDto.hora_desde,
          type: TypeJson.STRING
        },
        {
          name: 'HORA_HASTA',
          value: queryParamAppointmentExtendDto.hora_hasta,
          type: TypeJson.STRING
        }
      ]);

    } else if (queryParamAppointmentExtendDto.buscar) {
      //Significa que vamos a buscar por un valor en concreto
      sql = this.dbService.queryStringJson('selAppointmentUserGeneralByValue', [
        {
          name: 'ID_EMPLEADO',
          value: idEmployee,
          type: TypeJson.NUMBER
        },
        {
          name: 'VALOR',
          value: `${'%'}${queryParamAppointmentExtendDto.buscar}${'%'}`,
          type: TypeJson.STRING
        }
      ]);
    } else {
      //Significa que no trae un filtro
      const modelAppointment = new Appointment();
      modelAppointment.id_empleado = idEmployee;
      modelAppointment.removeNullReferences();

      sql = this.dbService.select(modelAppointment, true);
    }

    let response: Appointment[] = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException(`No se encuentra un registro con esos parametros de busqueda`, HttpStatus.NOT_FOUND);
    }

    if (req.user.type_user === TypeUserGeneral.CLIENT) {

      const modelCompany = new Company();
      modelCompany.id_usuario = req.user.id;
      modelCompany.removeNullReferences();

      const sqlModelCompany = this.dbService.select(modelCompany, true);
      const responseModelCompany: Company[] = await this.dbService.executeQueryModel(sqlModelCompany);

      const listIdCompany = responseModelCompany.map((element) => element.id_empresa);

      response = response.filter((element) => listIdCompany.includes(element.id_empresa));

      if (response.length === 0) {
        throw new HttpException(`El empleado con id ${idEmployee} no le corresponde`, HttpStatus.NOT_FOUND);
      }
    }
    //Aqui se ponen los mecanismos para filtrar de acuerdo al argumento
    const listMemoryCompany: Company[] = [];
    const listMemoryService: Service[] = [];
    const listMemoryEmployee = [];

    const responseJson = [];
    let contador = 0;

    for (const register of response) {
      const model = new Appointment(register);

      const { nombreTabla, ...resto } = model;

      responseJson.push({
        ...resto,
        id_empresa: null,
        id_servicio: null,
        id_empleado: null
      });

      //Vamos a buscar la empresa
      let result: Company[] | Service[] | Employee[] = listMemoryCompany.filter((element) => element.id_empresa === model.id_empresa);

      if (result.length === 0) {

        const modelCompany = new Company();
        modelCompany.id_empresa = model.id_empresa;
        modelCompany.removeNullReferences();

        const sql = this.dbService.selectOne(modelCompany, true);
        let response: Company[] = await this.dbService.executeQueryModel(sql);

        listMemoryCompany.push(response[0]);
        result = response;
      }

      //Agregamos la empresa al modelo
      responseJson[contador].id_empresa = {
        id_empresa: result[0].id_empresa,
        nombre: result[0].nombre,
        direccion: result[0].direccion,
        telefono: result[0].telefono,
        correo: result[0].correo,
        url_imagen: result[0].url_imagen,
        categoria: result[0].categoria
      };

      result = listMemoryService.filter((element) => element.id_servicio === model.id_servicio);

      if (result.length === 0) {
        const modelService = new Service();
        modelService.id_servicio = model.id_servicio;
        modelService.removeNullReferences();

        const sql = this.dbService.selectOne(modelService, true);
        let response: Service[] = await this.dbService.executeQueryModel(sql);

        listMemoryService.push(response[0]);
        result = response;
      }

      //Agregamos el servicio al modelo
      responseJson[contador].id_servicio = {
        id_servicio: result[0].id_servicio,
        nombre_servicio: result[0].nombre_servicio,
        descripcion: result[0].descripcion,
        duracion: result[0].duracion,
        precio: result[0].precio,
      }

      //Ahora vamos a agregar el empleado

      let result2 = listMemoryEmployee.filter((element) => element.id_empleado === model.id_empleado);

      if (result2.length === 0) {

        const modelEmployee = new Employee();
        modelEmployee.id_empleado = model.id_empleado;
        modelEmployee.removeNullReferences();

        const sql = this.dbService.selectOne(modelEmployee, true);
        const response: Employee[] = await this.dbService.executeQueryModel(sql);

        listMemoryEmployee.push(response[0]);
        result2 = response;

      }
      responseJson[contador].id_empleado = {
        id_empleado: result2[0].id_empleado,
        nombre: result2[0].nombre,
        correo: result2[0].correo,
        telefono: result2[0].telefono,
        url_imagen: result2[0].url_imagen,
      }

      contador += 1;
    }
    return responseJson
  }


  /**
   * Metodo para revisar que horarios tiene asignado un empleado
   * esto nos ayuda al front para revisar la disponibilidad
   * del empleado para un cliente en concreto
   * @param idEmployee 
   * @param queryParamAppointmentGeneralDto 
   * @returns 
   */
  public async getAppointmentByEmployeeGeneral(idEmployee: number, queryParamAppointmentGeneralDto: QueryParamAppointmentGeneralDto) {

    const {
      fecha_servicio = Helper.getDateNow(),
    } = queryParamAppointmentGeneralDto;

    const modelAppointment = new Appointment();
    modelAppointment.id_empleado = idEmployee;
    modelAppointment.fecha_servicio = fecha_servicio;
    modelAppointment.dia_semana_servicio = Helper.getDayWeek(fecha_servicio);
    modelAppointment.hora_desde_servicio = Helper.HOUR_FROM,
      modelAppointment.hora_hasta_servicio = Helper.HOUR_UNTIL;

    modelAppointment.removeNullReferences();

    const sql = this.dbService.queryStringJson('selAppointmentGeneral', [
      {
        name: 'ID_EMPLEADO',
        value: modelAppointment.id_empleado,
        type: TypeJson.NUMBER
      },
      {
        name: 'DIA_SEMANA_SERVICIO',
        value: modelAppointment.dia_semana_servicio,
        type: TypeJson.STRING
      },
      {
        name: 'FECHA_SERVICIO',
        value: modelAppointment.fecha_servicio,
        type: TypeJson.STRING
      },
      {
        name: 'HORA_DESDE',
        value: modelAppointment.hora_desde_servicio,
        type: TypeJson.STRING
      },
      {
        name: 'HORA_HASTA',
        value: modelAppointment.hora_hasta_servicio,
        type: TypeJson.STRING
      }
    ]);

    const response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException('No se encuentran registros con ese criterio de busqueda', HttpStatus.NO_CONTENT);
    }

    return response.map((elemet: Appointment) => {
      const { id_empresa, id_servicio, id_empleado, id_citas, ...all } = elemet;
      return all;
    })
  }
}
