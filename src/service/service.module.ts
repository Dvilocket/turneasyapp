import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { DbModule } from 'src/db/db.module';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService],
  imports: [
    DbModule
  ]
})
export class ServiceModule {}
