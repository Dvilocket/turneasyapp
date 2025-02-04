import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable } from 'rxjs';
import * as fs from 'fs';
import { Helper } from 'src/helper';

@Injectable()
export class DeleteFileOnErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    
    return next.handle().pipe(
      catchError((error) => {
        if (file) {
          const filePath = `${Helper.PATH_TO_TEMPO_FOLDER}/${file.filename}`;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        throw new HttpException(error.message, error.status);
      })
    );
  }
}
