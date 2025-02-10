import { ModelBase } from "src/model";

export class Employee extends ModelBase {

    public id_empleado: number = null;
    public id_empresa: number = null;
    public nombre: string = null;
    public correo: string = null;
    public telefono: string = null;
    public url_imagen: string = null;
    public formato_imagen: string = null;
    public id_imagen: string = null;
    public activo: boolean = null;

    public fecha_creacion: string = null;
    public fecha_actualizacion: string = null;
    public fecha_eliminacion: string = null;

    public nombreTabla: string = 'empleado';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }
}
