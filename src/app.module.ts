import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbService } from './db/db.service';
import { CompanyModule } from './company/company.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ServiceModule } from './service/service.module';
import { EmployeeModule } from './employee/employee.module';
import { AppointmentModule } from './appointment/appointment.module';
import { CronModule } from './cron/cron.module';
@Module({
  imports: [AuthModule, CompanyModule, CloudinaryModule, ServiceModule, EmployeeModule, AppointmentModule, CronModule],
  controllers: [],
  providers: [DbService],
})
export class AppModule {}
