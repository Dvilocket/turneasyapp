import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [CronController],
  providers: [CronService],
  imports: [
    HttpModule
  ]
})
export class CronModule {}
