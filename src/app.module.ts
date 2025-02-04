import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbService } from './db/db.service';
import { CompanyModule } from './company/company.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
@Module({
  imports: [AuthModule, CompanyModule, CloudinaryModule],
  controllers: [],
  providers: [DbService],
})
export class AppModule {}
