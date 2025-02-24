import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { DbModule } from 'src/db/db.module';

@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService],
  imports: [
    DbModule
  ]
})
export class AppointmentModule {}
