import { Controller, Post, Body, Request, Res, Patch, Get, Param, ParseIntPipe} from '@nestjs/common';
import { ServiceService } from './service.service';

import { Roles } from 'src/common/decorators';
import { TypeUserGeneral } from 'src/enum';
import { CreateServiceBaseDto, EditServiceDto } from './dto';
import { RequesExpressInterface } from 'src/interfaces/request-express.interface';
import { ResponseExpressInterface } from 'src/interfaces';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  /**
   * Controlador para crear un servicio
   * @param createServiceBaseDto 
   * @param req 
   * @param res 
   * @returns 
   */
  @Roles(TypeUserGeneral.CLIENT)
  @Post()
  public createServiceCompany(@Body() createServiceBaseDto: CreateServiceBaseDto, @Request() req: RequesExpressInterface, @Res() res: ResponseExpressInterface) {  
    return this.serviceService.createServiceCompany(createServiceBaseDto, req, res);
  }

  /**
   * Controlador para editar un servicio
   * @param editServiceDto 
   * @param req 
   * @returns 
   */
  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.ADMINISTRATOR)
  @Patch(':id')
  public editServiceCompany(@Param('id', ParseIntPipe) id: number, @Body() editServiceDto: EditServiceDto, @Request() req: RequesExpressInterface) {  
    return this.serviceService.editServiceCompany(id, editServiceDto, req);
  }

  @Get('/:id')
  public getServiceGeneral(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.getServiceGeneral(id);
  }
}
