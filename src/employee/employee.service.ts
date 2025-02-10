import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DbService } from 'src/db/db.service';
import { Employee } from './entities';
import { Company } from 'src/company/entities/company.entity';
import { RequesExpressInterface } from 'src/interfaces';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class EmployeeService {

  constructor(
    private readonly dbService: DbService,
    private readonly cloudinaryService: CloudinaryService
  ){}

  public async create(createEmployeeDto: CreateEmployeeDto, req: RequesExpressInterface, file: Express.Multer.File) {
    
    const modelEmployee = new Employee(createEmployeeDto);
    modelEmployee.removeNullReferences();

    let modelSelectEmployee = new Employee();
    modelSelectEmployee.correo = modelEmployee.correo;
    modelSelectEmployee.removeNullReferences();

    let sql = this.dbService.selectOne(modelSelectEmployee, true);
    let response = await this.dbService.executeQueryModel(sql);


    if (response.length > 0) {
      throw new HttpException(`Mail ${modelSelectEmployee.correo} already exists`, HttpStatus.CONFLICT);
    }

    let modelSelectCompany = new Company();
    modelSelectCompany.id_usuario = req.user.id;
    modelSelectCompany.removeNullReferences();


    sql = this.dbService.select(modelSelectCompany, true);

    response = await this.dbService.executeQueryModel(sql);

    if (response.length === 0) {
      throw new HttpException(`You do not currently have any company created`, HttpStatus.BAD_REQUEST);
    }

    const [secureUrl, publicId, format] = await this.cloudinaryService.uploadImage(file);

    if (!secureUrl || !publicId || !format) {
      throw new HttpException('It is not possible to upload images at this time', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    modelEmployee.url_imagen = secureUrl;
    modelEmployee.formato_imagen = format;
    modelEmployee.id_imagen = publicId;


    if (response.length === 1) {

      modelSelectCompany = new Company(response[0]);
      modelEmployee.id_empresa = modelSelectCompany.id_empresa;

      sql = this.dbService.insert(modelEmployee);


      await this.dbService.executeQueryModel(sql);

    } else {

      if (!createEmployeeDto.id_empresa) {
        throw new HttpException('The id_empresa attribute is necessary because the client has several companies', HttpStatus.BAD_REQUEST);
      }
      
      const listIdCompany = response.map((element: Company) => element.id_empresa);
      
      let idCompanyUser = createEmployeeDto.id_empresa.split(',').map(Number);

      idCompanyUser = idCompanyUser.filter((element: number) => listIdCompany.includes(element));
      

      if (idCompanyUser.length === 0) {
        throw new HttpException(`the ids ${createEmployeeDto.id_empresa} do not exist`, HttpStatus.BAD_REQUEST);
      }

      this.dbService.beginTransaction();

      for(const idCompany of idCompanyUser) {
        
        const modelInsertCompany = new Company({
          ...modelEmployee
        });

        modelInsertCompany.id_empresa = idCompany;
        modelInsertCompany.removeNullReferences();

        sql = this.dbService.insert(modelInsertCompany);


        await this.dbService.executeQueryInTransaction(sql);
      }
      this.dbService.commitTransaction();
    }
    
    throw new HttpException('employees were inserted correctly', HttpStatus.OK);
  }
}
