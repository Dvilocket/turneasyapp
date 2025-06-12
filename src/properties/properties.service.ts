import { TypeCompanyCategoryList, TypePropertiesParameter } from 'src/enum';
import { PropertiesGeneralDto } from './dto/properties-general.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PropertiesService {
  
  public getPropertiesGeneral(propertiesGeneralDto:PropertiesGeneralDto) {

    if (propertiesGeneralDto.propiedad === TypePropertiesParameter.CATEGORIA_EMPRESA) {
      return {
        propiedad: TypePropertiesParameter.CATEGORIA_EMPRESA,
        valor: TypeCompanyCategoryList
      }
    }
  }
}
