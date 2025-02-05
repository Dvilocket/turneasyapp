import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpException, HttpStatus, Request, Patch, Query, ParseIntPipe, Param, Get} from '@nestjs/common';
import { CompanyService } from './company.service';
import { Roles } from 'src/common/decorators';
import { TypeUserGeneral } from 'src/enum';
import { CreateCompanyDto, EditCompanyDto, EditTotalCompanyDto, QueryParamCompanyDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Helper } from 'src/helper';
import { DeleteFileOnErrorInterceptor } from 'src/common/interceptors';

@Controller('company')
export class CompanyController {

  constructor(private readonly companyService: CompanyService) {}

  /**
   * Este endpoint permite crear una empresa, se le debe proporcionar
   * la información basica de la empresa, se debe agregar tambien
   * una imagen de la empresa, para poder crear una empresa el usuario
   * debe ser de tipo CLIENT, ya que un cliente puede crear muchas empresas
   * @param createCompanyDto 
   * @param imagen 
   * @returns 
   */
  @Roles(TypeUserGeneral.CLIENT)
  @Post()
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: Helper.PATH_TO_TEMPO_FOLDER,
        filename: Helper.renameFile
      })
    }),
    DeleteFileOnErrorInterceptor,
  ) 
  public create(@Body() createCompanyDto: CreateCompanyDto, @UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new HttpException('You must enter an image of the company', HttpStatus.BAD_REQUEST);
    }
    return this.companyService.createCompany(createCompanyDto, file, req);
  }

  /**
   * Esta funcion me permite editar el total de empresas que puede
   * crear un cliente, esto se hace para crear un plan despues
   * de tantas empresa puede crear un cliente
   * @param id 
   * @param editTotalCompanyDto 
   * @returns 
   */
  @Roles(TypeUserGeneral.ADMINISTRATOR)
  @Patch('/total/:id')
  public editCompanyTotal(@Param('id', ParseIntPipe) id: number, @Body() editTotalCompanyDto: EditTotalCompanyDto) {
    return this.companyService.editCompanyTotal(id, editTotalCompanyDto);
  }

  /**
   * Función para obtener todas las empresas registradas en
   * la plataforma
   * @param queryParamCompanyDto 
   * @returns 
   */
  @Get()
  public getCompanies(@Query() queryParamCompanyDto: QueryParamCompanyDto) {
    return this.companyService.getCompanies(queryParamCompanyDto);
  }

  /**
   * Pendiente implementar para actualizar una imagen
   * @param editCompanyDto 
   * @param req 
   * @returns 
   */
  @Roles(TypeUserGeneral.CLIENT, TypeUserGeneral.ADMINISTRATOR)
  @Patch() 
  public editCompany(@Body() editCompanyDto: EditCompanyDto, @Request() req: any) {
    return this.companyService.editCompany(editCompanyDto, req);
  }
}
