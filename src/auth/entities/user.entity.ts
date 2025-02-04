import { TypeUser, TypeUserGeneral } from "src/enum";
import { ModelBase } from "src/model";

export class User extends ModelBase {

    public id_usuario: number = null;
    public usuario: string = null;
    public nombre: string = null;
    public clave: string = null;
    public correo: string = null;
    public telefono:string = null;
    public tipo_usuario: TypeUser | TypeUserGeneral = null;
    public fecha_creacion: string = null;
    public fecha_actualizacion: string = null;
    public fecha_eliminacion: string = null;

    public nombreTabla: string = 'usuario';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }
}