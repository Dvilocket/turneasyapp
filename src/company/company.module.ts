import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { DbModule } from 'src/db/db.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
  imports: [DbModule, CloudinaryModule]
})
export class CompanyModule {}
