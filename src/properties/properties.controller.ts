import { Body, Controller, Get} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesGeneralDto } from './dto/properties-general.dto';

@Controller('properties')
export class PropertiesController {
  
  constructor(private readonly propertiesService: PropertiesService) {}

  /**
   * Funcion para obtener una propiedad general de la plataforma
   * esto se hace con el fin de servir en el front propiedades
   * que estan en el backend, para que exista cierta cordinacion
   * @param propertiesGeneralDto 
   * @returns 
   */
  @Get()
  public getPropertiesGeneral(@Body() propertiesGeneralDto:PropertiesGeneralDto) {
    return this.propertiesService.getPropertiesGeneral(propertiesGeneralDto);
  }
}
