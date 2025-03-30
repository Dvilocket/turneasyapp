import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import { CronService } from './cron.service';
import { QueryParamCronDto } from './dto/query-param-cron.dto';
import { QueryParamCronDownloadDto } from './dto';
import { LowerCasePipe } from './pipes';

import { Response } from 'express';

@Controller('cron')
export class CronController {

  constructor(private readonly cronService: CronService) {}

  @Get('/download/:name')
  public downloadCronFile(@Param('name', LowerCasePipe) name: string, @Query() queryParamCronDownloadDto: QueryParamCronDownloadDto, @Res() res: Response) {
    return this.cronService.downloadCronFile(name, queryParamCronDownloadDto, res);
  }

  @Get('/:name')
  public executeCron(@Param('name') name: string, @Query() queryParamCronDto: QueryParamCronDto) {
    return this.cronService.executeCron(name, queryParamCronDto);
  }
}
