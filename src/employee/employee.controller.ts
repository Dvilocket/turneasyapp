import { Controller, Request, Post, Body, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
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

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Roles(TypeUserGeneral.CLIENT)
  @Post()
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: Helper.PATH_TO_TEMPO_FOLDER,
        filename: Helper.renameFile
      })
    }),
    DeleteFileOnErrorInterceptor
  )
  public create(@Body(ParseEmployeePipe) createEmployeeDto: CreateEmployeeDto, @UploadedFile() file: Express.Multer.File, @Request() req: RequesExpressInterface) {

    if (!file) {
      throw new HttpException('you need to enter an image', HttpStatus.BAD_REQUEST);
    }
    
    return this.employeeService.create(createEmployeeDto, req, file);
  }
}
