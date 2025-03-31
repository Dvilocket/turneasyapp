import { HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; 
import { QueryParamCronDto } from './dto/query-param-cron.dto';
import { envs } from 'src/config/envs';
import { join } from 'path';
import { appendFileSync, closeSync, existsSync, openSync, readdirSync, unlinkSync } from 'fs';
import { Helper } from 'src/helper';
import { DbService } from 'src/db/db.service';
import { QueryParamCronDownloadDto } from './dto';
import { Response } from 'express';
import { EmailService } from 'src/email/email.service';

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
      name: string,
      execute: () => Promise<void>;
    }
  };
  private readonly EMAIL_BASE_CRON = "miguel.ramirez2@utp.edu.co";

  private nameFile: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService,
    private readonly emailService: EmailService
  ) {

    if (!existsSync(this.LOCK_DIR)) {
      require('fs').mkdirSync(this.LOCK_DIR);
    }

    //AQUI SE PONE LA MEMOERIA DE LOS CRONES
    this.MEMORY_CRON_SERVICE = {
      cronCopyHistoricalDataAppointments: {
        canRun: true,
        password: "miguel123",
        name: "CronHistorialDeCitasLog",
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

  /**
   * Funcion para agregar un log y tener la trazibilidad 
   * del proceso
   * @param message 
   */
  private addMessageLog(message: string) {
    if (this.nameFile) {
      const logFile = join(this.LOG_DIR, `${Helper.getDateNow()}_${this.nameFile.toLowerCase()}.log`);
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

  /**
   * Metodo para ejecutar un cron, simula la peticion de un hilo
   * @param name 
   * @param queryParamCronDto 
   */
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

        const view = Helper.getView("cron-view-ok", [
          {
            NOMBRECRON : this.MEMORY_CRON_SERVICE[name].name
          }
        ]);
        
        if (view) {
          await this.emailService.sendEmail({
            to: this.EMAIL_BASE_CRON,
            subject: "Informacion de cron",
            html: view
          });
          this.addMessageLog("Se envio el correo de aviso")
        } else {
          this.addMessageLog("No es posible enviar el correo de aviso, porque no se cargo la vista")
        }

      } catch(error) {
        this.addMessageLog(`Succedio el siguiente error ${error.message}`);
      } finally {
        this.releaseLock(name);
      }
    }
  }

  /**
   * Metodo para descargar un archivo, en este caso vamos a descargar
   * los archivos que genera el cron
   * @param name 
   * @param queryParamCronDownloadDto 
   * @returns 
   */
  public downloadCronFile(name: string, queryParamCronDownloadDto: QueryParamCronDownloadDto, res: Response) {

    const {fecha = Helper.getDateNow()} = queryParamCronDownloadDto;

    const getMemoryLogs = () => {
      
      const nameFiles = readdirSync(this.LOG_DIR);
      const objectMemory = {};

      if (nameFiles.length === 0) {
        return objectMemory;
      }

      for(const element of nameFiles){
        
        let general = element.split('_');
        const date = general[0];
        general = general[1].split('.');
        const fileName = general[0];
        const extension = general[1];

        if (Object.keys(objectMemory).length === 0 || !Object.keys(objectMemory).includes(fileName)) {
          objectMemory[fileName] = {
            dateFile : [
              date
            ],
            extensionFile: extension
          }
        } else {
          objectMemory[fileName].dateFile.push(date);
        }
      }
      return objectMemory;
    }

    const objectMemory: {
      [key: string] : {
        dateFile: string[],
        extensionFile: string
      }
    } = getMemoryLogs();

    //Preguntar si existe el archivo
    if (Object.keys(objectMemory).length === 0 || !Object.keys(objectMemory).includes(name)) {
      throw new HttpException(`No existe el archivo ${name}`, HttpStatus.NOT_FOUND);
    }

    //Preguntar si existe la fecha buscada para ese archivo
    if (!objectMemory[name].dateFile.includes(fecha)) {
      throw new HttpException(`No existe la fecha ${fecha} para el archivo ${name}`, HttpStatus.NOT_FOUND);
    }

    //Ahora, aqui todo bien, ahora si podemos descargar el archivo
    const completeRoute = join(this.LOG_DIR, `${fecha}_${name}.${objectMemory[name].extensionFile}`);

    return res.sendFile(completeRoute, (err) => {
      if (err) {
        return res.status(500).send('Error al enviar el archivo');
      }
    });
  }
}
