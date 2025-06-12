import { BadRequestException } from "@nestjs/common";
import { extname, join } from "path";
import {TypeDayWeekListGeneral } from "src/enum";

import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

export class Helper {
    
    static PATH_TO_TEMPO_FOLDER: string = join(__dirname, '../../src', 'tempo');

    static PATH_TO_VIEWS: string = join(__dirname, '../../src/views');

    static HOUR_FROM = '00:00';
    static HOUR_UNTIL = '23:59';


    static renameFile(req: any, file: any, callback: any) {

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `${uniqueSuffix}${ext}`;
        callback(null, filename);
    }

    /**
     * Funcion para obtener el primero elemento de una respuesta de
     * la base de datos
     * @param response 
     * @returns 
     */
    static getFirstElement(response: any[]) {
        const key = Object.keys(response[0]);
        return response[0][key[0]] ?? -1; 
    }

    /**
     * Funcion para revisar la extension de un archivo para subirlo
     * @param req 
     * @param file 
     * @param callback 
     */
    static checkExtensionFile(req: any, file: any, callback: any) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const fileExtension = file.originalname.toLowerCase().match(/\.[0-9a-z]+$/i)?.[0];

        if (fileExtension && allowedExtensions.includes(fileExtension)) {
            //aceptamos el archivo
            callback(null, true);
        } else {
            //Rechazamos el archivo
            callback(new BadRequestException(`file type not allowed, the allowed files are as follows ${allowedExtensions}`), false);
        }
    }

    /**
     * Funcion para escoger un dia de la semana
     * @param dateString 
     * @returns 
     */
    static getDayWeek(dateString: string) {

        const [yearString, monthString, dayString] = dateString.split('-');

        const yearNumber = Number(yearString);
        const monthNumber = Number(monthString);
        const dayNumber = Number(dayString);

        const date = new Date(yearNumber, monthNumber - 1, dayNumber);

        return TypeDayWeekListGeneral[date.getDay()];

    }

    /**
     * Funcion para agregarle minutos a una fecha de js
     * @param hour 
     * @param minuteToAdd 
     * @returns 
     */
    static addMinutes(hour: string, minuteToAdd: number) {
        const [hours, minutes] = hour.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        date.setMinutes(date.getMinutes() + minuteToAdd);

        const newHour = date.getHours().toString().padStart(2, '0');
        const newMinutes = date.getMinutes().toString().padStart(2, '0');

        return `${newHour}:${newMinutes}`;
    }


    /**
     * Funcion para convertir hora a minutos
     * @param hour 
     * @returns 
     */
    static convertHourToMinute(hour: string): number {
        const [h, m] = hour.split(':').map(Number);
        return h * 60 + m;
    }

    /**
     * Funcion para convertir una fecha de posgretsql en una fecha
     * de js
     * @param date 
     * @returns 
     */
    static formatDate(date: string) {
        const dateModel = new Date(date);

        const year = dateModel.getFullYear();
        const month = String(dateModel.getMonth() + 1).padStart(2, '0');
        const day = String(dateModel.getDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
    }

    /**
     * Funcion para formatear una hora de acuerdo al estandar
     * preestablecido
     * @param hour 
     * @returns 
     */
    static formatHour(hour: string) {
        const [hours, minutes] = hour.split(':');
        return `${hours}:${minutes}`;
    }

    /**
     * Funcion para obtener la fecha actual en formato
     * Y-m-d
     */
    static getDateNow() {
        const today = new Date(); 
        const year = today.getFullYear(); 
        const month = String(today.getMonth() + 1).padStart(2, '0'); 
        const day = String(today.getDate()).padStart(2, '0'); 
        return `${year}-${month}-${day}`;
    }

    /**
     * Funcion para obtener el dia de la semana
     * actual, puede ser Lunes, Martes ... Domingo
     * @returns 
     */
    static getDayNow() { 
        const date = this.getDateNow();
        return this.getDayWeek(date);
    }

    /**
     * Pedniente implementar la logica de este metodo
     * @param route 
     * @param params 
     */
    static getView(nameRoute: string, params: { [key: string]: string }[] = []) {
        
        if (!nameRoute) {
            return null;
        }

        const routeList = nameRoute.split(".");

        if (routeList.length === 2) {
            if (routeList[1] !== "html") {
                return null;
            }
        } else {
            nameRoute = routeList[0] + ".html";
        }

        const hasRepeatedStamps = (): boolean => {
            const memory = [];
            for(const element of params) {
                const key = Object.keys(element)[0];
                if (!memory.includes(key)) {
                    memory.push(key)
                } else {
                    return true;
                }
            }
            return false;
        }

        if (hasRepeatedStamps()) {
            return null;
        }

        const route = join(Helper.PATH_TO_VIEWS, nameRoute);

        if (!fs.existsSync(route)) {
            return null;
        }

        let htmlContent = fs.readFileSync(route, "utf8");
        const regex = /__\w+__/g; 

        if (!regex.test(htmlContent)) {
            return htmlContent;
        }

        const searchStamp = (key: string): string => {
            for(const element of params){
                if (Object.keys(element)[0] === key) {
                    return element[key];
                }
            }
            return key;
        }

        htmlContent = htmlContent.replace(/__\w+__/g, (match) => {
            const key = match.slice(2, -2);
            return searchStamp(key);  
        });
        return htmlContent;
    }

    /**
     * Funcion para hashear una clave
     * @param password 
     * @returns 
     */
    static async hashPassword(password: string): Promise<string> {
        const SALT_ROUNDS = 10;
        return await bcrypt.hash(password, SALT_ROUNDS);
    }

    /**
     * Funcion para comparar si la clave hassheada es la misma
     * @param password 
     * @param hashedPassword 
     * @returns 
     */
    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }
};