import { Controller, Get, Body, Param, Query } from '@nestjs/common';
import { CronService } from './cron.service';
import { QueryParamCronDto } from './dto/query-param-cron.dto';

@Controller('cron')
export class CronController {

  constructor(private readonly cronService: CronService) {}

  @Get('/:name')
  public executeCron(@Param('name') name: string, @Query() queryParamCronDto: QueryParamCronDto) {
    return this.cronService.executeCron(name, queryParamCronDto);
  }
}
