import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbService } from './db/db.service';
import { CompanyModule } from './company/company.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ServiceModule } from './service/service.module';
import { EmployeeModule } from './employee/employee.module';
import { AppointmentModule } from './appointment/appointment.module';
import { CronModule } from './cron/cron.module';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { PropertiesModule } from './properties/properties.module';
@Module({
  imports: [AuthModule, CompanyModule, CloudinaryModule, ServiceModule, EmployeeModule, AppointmentModule, CronModule, EmailModule, PropertiesModule],
  controllers: [],
  providers: [DbService, EmailService],
})
export class AppModule {}
