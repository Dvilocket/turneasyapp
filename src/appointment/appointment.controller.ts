import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('/:id')
  create(@Param('id', ParseIntPipe) idCompany: number, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(idCompany, createAppointmentDto);
  }
}
