import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class LowerCasePipe implements PipeTransform {

    transform(value: any, metadata: ArgumentMetadata) {
        return (typeof value === 'string') ? value.toLowerCase() : value;
    }
}