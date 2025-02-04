import { TypeCompanyCategory } from "src/enum";
import { ModelBase } from "src/model";

export class Company extends ModelBase {

    public id_empresa: number = null;
    public id_usuario: number = null;
    public nombre: string = null;
    public direccion: string = null;
    public telefono: string = null;
    public correo: string = null;
    public url_imagen: string = null;
    public formato_imagen: string = null;
    public id_imagen: string = null;
    public categoria: TypeCompanyCategory = null;
    public hora_apertura: string = null;
    public hora_cierre: string = null;
    public fecha_creacion: string = null;
    public fecha_actualizacion: string = null;
    public fecha_eliminacion: string = null;


    public nombreTabla: string = 'empresa';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }
}
