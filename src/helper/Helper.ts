import { BadRequestException } from "@nestjs/common";
import { extname, join } from "path";

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
};