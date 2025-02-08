import { ModelBase } from "src/model";

export class Service extends ModelBase{
    
    
    public id_servicio: number = null;
    public id_empresa: number = null;
    public nombre_servicio: string = null;
    public descripcion: string = null;
    public duracion: number = null;
    public precio: number = null;
    public activo: boolean = null;

    public fecha_creacion: string = null;
    public fecha_actualizacion: string = null;
    public fecha_eliminacion: string = null;

    
    
    public nombreTabla: string = 'servicio';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }
}
