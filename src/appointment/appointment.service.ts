import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DbService } from 'src/db/db.service';
import { Company } from 'src/company/entities/company.entity';
import { Employee } from 'src/employee/entities';
import { Service } from 'src/service/entities';
import { Helper } from 'src/helper';
import { Shift } from 'src/employee/entities/shift.entity';
import { Appointment } from './entities/appointment.entity';

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
    const shiftDb = responseShift.filter((shift: Shift) => shift.dia_semana === dayWeekUser);
  
    const modelAppointment = new Appointment();
    modelAppointment.id_empresa = idCompany;
    modelAppointment.id_empleado = employeeDb.id_empleado;
    modelAppointment.dia_semana_servicio = dayWeekUser;
    modelAppointment.fecha_servicio = createAppointmentDto.fecha_servicio;
    modelAppointment.removeNullReferences();

    sql = this.dbService.select(modelAppointment, true);
    const responseAppointment = await this.dbService.executeQueryModel(sql);

    if (responseAppointment.length === 0) {
      
      /**
       * Significa que no tiene turnos, por lo tanto tenemos que revisar,
       * que si esta en el rango de fechas que es 
       */

      const responseServiceModel = new Service(responseService[0]);
      const hourSinceService = createAppointmentDto.hora_servicio;
      const hourUntilService = Helper.addMinutes(hourSinceService, responseServiceModel.duracion);

      console.log('hora desde servicio:', hourSinceService);
      console.log('hora hasta servicio:', hourUntilService);

      return 'hola mundo';

    } else {
      //significa que si tiene turnos¿
    }

    return employeeDb;
  }

}
