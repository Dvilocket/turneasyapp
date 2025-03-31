import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { HttpModule } from '@nestjs/axios';
import { DbModule } from 'src/db/db.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [CronController],
  providers: [CronService],
  imports: [
    HttpModule,
    DbModule,
    EmailModule
  ]
})
export class CronModule {}
