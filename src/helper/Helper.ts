import { BadRequestException } from "@nestjs/common";
import { extname, join } from "path";
import { TypeDayWeek, TypeDayWeekListGeneral } from "src/enum";

export class Helper {
    
    static PATH_TO_TEMPO_FOLDER: string = join(__dirname, '../../src', 'tempo');

    static renameFile(req: any, file: any, callback: any) {

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `${uniqueSuffix}${ext}`;
        callback(null, filename);
    }

    static getFirstElement(response: any[]) {
        const key = Object.keys(response[0]);
        return response[0][key[0]] ?? -1; 
    }

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

    static getDayWeek(dateString: string) {
        const [yearString, monthString, dayString] = dateString.split('-');

        const yearNumber = Number(yearString);
        const monthNumber = Number(monthString);
        const dayNumber = Number(dayString);

        const date = new Date(yearNumber, monthNumber - 1, dayNumber);

        return TypeDayWeekListGeneral[date.getDay()];

    }

    static addMinutes(hour: string, minuteToAdd: number) {
        const [hours, minutes] = hour.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        date.setMinutes(date.getMinutes() + minuteToAdd);

        const newHour = date.getHours().toString().padStart(2, '0');
        const newMinutes = date.getMinutes().toString().padStart(2, '0');

        return `${newHour}:${newMinutes}`;
    }
};