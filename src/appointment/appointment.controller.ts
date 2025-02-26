import { Controller, Post, Body, Param, ParseIntPipe, Get, Request } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { TypeUserGeneral } from 'src/enum';
import { Roles } from 'src/common/decorators';
import { RequesExpressInterface } from 'src/interfaces';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}
  
  @Post('/:id')
  public createAppointment(@Param('id', ParseIntPipe) idCompany: number, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(idCompany, createAppointmentDto);
  }

  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.CLIENT)
  @Get()
  public getAppointment(@Request() req: RequesExpressInterface) {
    return this.appointmentService.getAppointment(req);
  }
}
