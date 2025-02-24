import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DbService } from 'src/db/db.service';
import { Company } from 'src/company/entities/company.entity';
import { Employee } from 'src/employee/entities';
import { Service } from 'src/service/entities';
import { Helper } from 'src/helper';

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
     * Ahora debo poreguntarme si ese empleado tiene turnos actualmente
     * y si tiene turnos, revisar qque los horarios no se crucen
     */

    return employeeDb;

    const {id_empleado, id_servicio} = createAppointmentDto;

    return 'This action adds a new appointment';
  }



}
