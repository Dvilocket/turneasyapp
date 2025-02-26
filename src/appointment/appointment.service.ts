import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DbService } from 'src/db/db.service';
import { Company } from 'src/company/entities/company.entity';
import { Employee } from 'src/employee/entities';
import { Service } from 'src/service/entities';
import { Helper } from 'src/helper';
import { Shift } from 'src/employee/entities/shift.entity';
import { Appointment } from './entities/appointment.entity';
import { RequesExpressInterface } from 'src/interfaces';
import { TypeJson } from 'src/db/interfaces';

@Injectable()
export class AppointmentService {

  constructor(
    private readonly dbService: DbService
  ){}


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

      for(const element of responseAppointment) {
        const modelElement = new Appointment(element);
        modelElement.formatHour();

        const modelElementMinuteStart = Helper.convertHourToMinute(modelElement.hora_desde_servicio);
        const modelElementMinuteEnd = Helper.convertHourToMinute(modelElement.hora_hasta_servicio);

        if (endMinutesSinceService >= modelElementMinuteStart && endMinutesSinceService <= modelElementMinuteEnd) {
          throw new HttpException('The schedule is busy, please try another time slot', HttpStatus.CONFLICT);
        }
      }
    }

    for(const shift of shiftDb) {
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
   * TODO: PENDIENTE PARA FITRAR POR SERVICIOS QUE YA SE PASARON
   * DE LA FECHA DE HOY, MOSTRAR REGISTROS QUE SEAN A LA FECHA
   * CONTEMPORANEA, NECESARIO HACER ESTO
   * @param req 
   * @returns 
   */
  public async getAppointment(req: RequesExpressInterface) {
    const modelCompany = new Company();
    modelCompany.id_usuario = req.user.id;
    modelCompany.removeNullReferences();

    let sql = this.dbService.select(modelCompany, true);
    let response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException('No company has been created', HttpStatus.NO_CONTENT);
    }

    sql = this.dbService.queryStringJson('selAppointment', [
      {
        name: 'ID_EMPRESA',
        value: response.map((element: Company) => element.id_empresa).join(','),
        type: TypeJson.STRING
      }
    ]);

    const responseAppointment = await this.dbService.executeQueryModel(sql);

    if (responseAppointment.length === 0) {
      throw new HttpException(`The company currently has no scheduled appointments.`, HttpStatus.NOT_FOUND);
    }

    const listServices: Service[]= [];
    const listEmployees: Employee[]= [];

    const createAppointment = async (idCompany: number) => {

      const jsonResponse = [];

      const appointment: Appointment[] =  responseAppointment.filter((element: Appointment) => element.id_empresa === idCompany);    

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

      for(const element of appointment) {
        
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

    for(const element of response) {

      const model = new Company(element);
      model.removeNullReferences();

      model.hora_apertura = Helper.formatHour(model.hora_apertura);
      model.hora_cierre = Helper.formatHour(model.hora_cierre);

      const {id_usuario, fecha_creacion, fecha_actualizacion, fecha_eliminacion, formato_imagen, id_imagen, nombreTabla, ...result} = model;
      
      result['citas'] = await createAppointment(model.id_empresa);

      responseJson.push(result);
    }


    return responseJson;
  }
}
