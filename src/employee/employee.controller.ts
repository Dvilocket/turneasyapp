import { Controller, Request, Post, Body, UseInterceptors, UploadedFile, HttpException, HttpStatus, Patch, Param, ParseIntPipe, Get } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Roles } from 'src/common/decorators';
import { TypeUserGeneral } from 'src/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Helper } from 'src/helper';
import { DeleteFileOnErrorInterceptor } from 'src/common/interceptors';
import { RequesExpressInterface } from 'src/interfaces';
import { ParseEmployeePipe } from './pipes';
import { CreateEmployeeShiftDto } from './dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  /**
   * Controlador para crear un empleado
   * @param createEmployeeDto 
   * @param file 
   * @param req 
   * @returns 
   */
  @Roles(TypeUserGeneral.CLIENT)
  @Post()
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: Helper.PATH_TO_TEMPO_FOLDER,
        filename: Helper.renameFile
      }),
      fileFilter: Helper.checkExtensionFile
    }),
    DeleteFileOnErrorInterceptor
  )
  public createEmployee(@Body(ParseEmployeePipe) createEmployeeDto: CreateEmployeeDto, @UploadedFile() file: Express.Multer.File, @Request() req: RequesExpressInterface) {

    if (!file) {
      throw new HttpException('you need to enter an image', HttpStatus.BAD_REQUEST);
    }
    
    return this.employeeService.createEmployee(createEmployeeDto, req, file);
  }


  /**
   * Pendiente terminar el desarollo de este 
   * controlado y ajustar el controlador
   * de servicio
   * @param id 
   * @param updateEmployeeDto 
   * @param req 
   * @returns 
   */
  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.ADMINISTRATOR)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: Helper.PATH_TO_TEMPO_FOLDER,
        filename: Helper.renameFile
      }),
      fileFilter: Helper.checkExtensionFile
    }),
    DeleteFileOnErrorInterceptor
  )
  public editEmployee(@Param('id', ParseIntPipe) id: number,  @Body() updateEmployeeDto: UpdateEmployeeDto, @Request() req: RequesExpressInterface, @UploadedFile() file: Express.Multer.File) {
    return this.employeeService.editEmployee(id, updateEmployeeDto, req, file);
  }

  /**
   * Función para crear un turno
   * @param id 
   * @param req 
   * @param createEmployeeShiftDto 
   */
  @Roles(TypeUserGeneral.CLIENT)
  @Post('/shift/:id')
  public createShift(@Param('id', ParseIntPipe) id: number, @Request() req: RequesExpressInterface, @Body() createEmployeeShiftDto: CreateEmployeeShiftDto) {
    return this.employeeService.createShift(id, req, createEmployeeShiftDto);
  }

  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.ADMINISTRATOR)
  @Get('/shift')
  public getShift(@Request() req: RequesExpressInterface) {
    return this.employeeService.getShift(req);
  }

  /**
   * Controlador para editar el horario de un empleado
   * 
   */
  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.ADMINISTRATOR)
  @Patch('/shift/:id')
  public editShift(@Param('id', ParseIntPipe) id: number, @Request() req: RequesExpressInterface, @Body() updateShiftDto: UpdateShiftDto) {
    return this.employeeService.editShift(id, req, updateShiftDto);
  }
  /**
   * Controlador para obtener los horarios 
   * de un empleado
   * @param idEmployee 
   * @returns 
   */
  @Get('/shift/general/:id')
  public getShiftGeneral(@Param('id', ParseIntPipe) idEmployee: number) {
    return this.employeeService.getShiftGeneral(idEmployee);
  }

  /**
   * Controlador para mostrar los empleados que estan asignados a un
   * servicio especifico
   * @param idService 
   * @returns 
   */
  @Get('/service/:idService')
  public getEmployeeByService(@Param('idService', ParseIntPipe) idService: number) {
    return this.employeeService.getEmployeeByService(idService);
  }
}
