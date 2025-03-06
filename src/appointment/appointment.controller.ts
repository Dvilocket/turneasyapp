import { Controller, Post, Body, Param, ParseIntPipe, Get, Request, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { TypeUserGeneral } from 'src/enum';
import { Roles } from 'src/common/decorators';
import { RequesExpressInterface } from 'src/interfaces';
import { QueryParamAppointmentDto, QueryParamAppointmentExtendDto } from './dto';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * Este controlador se encarga de crear una cita en la base de datos
   * a la vez este controlador hace validacciones para saber si se
   * puede agendar o no la cita, tiene en cuenta esos
   * aspectos
   * @param idCompany 
   * @param createAppointmentDto 
   * @returns 
   */
  @Post('/:id')
  public createAppointment(@Param('id', ParseIntPipe) idCompany: number, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(idCompany, createAppointmentDto);
  }

  /**
   * Controlador que me muestra todas las citas que estan agendadas
   * por fecha, este controlador distingue entre un usuario administrador
   * con un usuario cliente
   * @param queryParamAppointmentDto 
   * @param req 
   * @returns 
   */
  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.ADMINISTRATOR)
  @Get()
  public getAppointment(@Query() queryParamAppointmentDto: QueryParamAppointmentDto, @Request() req: RequesExpressInterface) {
    return this.appointmentService.getAppointment(queryParamAppointmentDto, req);
  }

  /**
   * Ahora debemos crear un controlador que me permita
   * filtrar pero por un empleado en concreto
   */
  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.ADMINISTRATOR)
  @Get('/employee/:id')
  public getAppointmentByEmployee(@Param('id', ParseIntPipe) idEmployee: number, @Request() req : RequesExpressInterface, @Query() queryParamAppointmentExtendDto: QueryParamAppointmentExtendDto) {
    return this.appointmentService.getAppointmentByEmployee(idEmployee, req, queryParamAppointmentExtendDto);
  }
}