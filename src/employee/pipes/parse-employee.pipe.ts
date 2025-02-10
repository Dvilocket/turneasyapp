import { ArgumentMetadata, BadRequestException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseEmployeePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.id_empresa) {
      if (!/^\d+(,\d+)*$/.test(value.id_empresa)) {
        throw new BadRequestException('id_empresa debe estar en formato 1,2,3..N')
      }

      const list = value.id_empresa.split(',').map(Number);
      value.id_empresa = [...new Set(list)].join(',')
    }
    return value;
  }
}
