import { HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; 
import { QueryParamCronDto } from './dto/query-param-cron.dto';
import { envs } from 'src/config/envs';
import { join } from 'path';
import { appendFileSync, closeSync, existsSync, openSync, unlinkSync } from 'fs';
import { Helper } from 'src/helper';
import { DbService } from 'src/db/db.service';

@Injectable()
export class CronService {

  private readonly BASE_URL = envs.base_url || 'http://localhost:3000';
  private readonly logger = new Logger(CronService.name);
  private readonly LOCK_DIR = join(__dirname, '../../src', 'cron', 'cron_locks');
  private readonly LOG_DIR = join(__dirname, '../../src', 'cron', 'logs');

  private readonly MEMORY_CRON_SERVICE: {
    [key: string] : {
      canRun: boolean,
      password: string,
      execute: () => Promise<void>;
    }
  };

  private nameFile: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService
  ) {

    if (!existsSync(this.LOCK_DIR)) {
      require('fs').mkdirSync(this.LOCK_DIR);
    }

    //AQUI SE PONE LA MEMOERIA DE LOS CRONES
    this.MEMORY_CRON_SERVICE = {
      cronCopyHistoricalDataAppointments: {
        canRun: true,
        password: "miguel123",
        execute: this.executecronCopyHistoricalDataAppointments
      }
    };
  }

  private getLockFilePath(name: string): string {
    return join(this.LOCK_DIR, `${name}.lock`);
  }

  private acquireLock(name: string) {
    const lockFile = this.getLockFilePath(name);
    try {
      const fd = openSync(lockFile, 'wx');
      closeSync(fd);
      return true;
    } catch(err) {
      if (err.code === 'EEXIST') {
        return false;
      }
      throw err;
    }
  }

  private releaseLock(name: string): void {
    const lockFile = this.getLockFilePath(name);
    try {
      unlinkSync(lockFile);
    } catch (err) {
      this.logger.error(`Error liberando lock ${name}: ${err.message}`);
    }
  }

  private addMessageLog(message: string) {
    if (this.nameFile) {
      const logFile = join(this.LOG_DIR, `${Helper.getDateNow()}_${this.nameFile}.log`);
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      appendFileSync(logFile, logMessage, 'utf8');
    }
  }

  private executecronCopyHistoricalDataAppointments = async (): Promise<void> => {    
    
    this.addMessageLog("Inicia el cron HistoricalDataAppointments");

    this.dbService.beginTransaction();

    let sql = this.dbService.queryStringJson("insertAppointmentTableLog");

    this.dbService.executeQueryInTransaction(sql);

    sql = this.dbService.queryStringJson("deleteAppointmentTable");

    this.dbService.executeQueryInTransaction(sql);

    this.dbService.commitTransaction();

    this.addMessageLog("Termina el cron HistoricalDataAppointments");
  };

  public async executeCron(name: string, queryParamCronDto: QueryParamCronDto) {
    const { clave = null, hilo = null } = queryParamCronDto;

    if (!clave) {
      throw new HttpException('Por favor ingresar la clave del cron', HttpStatus.BAD_REQUEST);
    }

    if (!this.MEMORY_CRON_SERVICE.hasOwnProperty(name)) {
      throw new HttpException(`No se encuentra el cron ${name}`, HttpStatus.BAD_REQUEST);
    }

    if (!this.MEMORY_CRON_SERVICE[name].canRun || this.MEMORY_CRON_SERVICE[name].password !== queryParamCronDto.clave) {
      throw new HttpException(`Parametros incorrectos del cron ${name}`, HttpStatus.BAD_REQUEST);
    }

    if (!hilo) {
      try {
        const url = `${this.BASE_URL}/api/cron/${name}`;
        this.httpService.get(url, {
          params: {
            hilo: '1',
            clave: queryParamCronDto.clave
          }
        }).subscribe({
          next: () => this.logger.log(`Hilo ${name} iniciado con éxito`),
          error: (err) => this.logger.log(`Error iniciando el hilo ${name}: ${err.message}`)
        });
      } catch(err) {
        throw new HttpException(`Error lanzando el hilo ${name}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      throw new HttpException('Cron lanzado correctamente', HttpStatus.OK);
      
    } else {
      if (!this.acquireLock(name)) {
        throw new HttpException(`El proceso ${name} ya está en ejecución`, HttpStatus.CONFLICT);
      }

      try {
        this.nameFile = name;
        await this.MEMORY_CRON_SERVICE[name].execute();
      } catch(error) {
        this.addMessageLog(`Succedio el siguiente error ${error.message}`);
      } finally {
        this.releaseLock(name);
      }
    }
  }
}
