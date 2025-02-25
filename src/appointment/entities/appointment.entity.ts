import { TypeDayWeek } from "src/enum";
import { ModelBase } from "src/model";

export class Appointment extends ModelBase{

    public id_citas: number = null;
    public id_empresa: number = null;
    public id_servicio: number = null;
    public id_empleado: number = null;
    public dia_semana_servicio: TypeDayWeek = null;
    public fecha_servicio: string = null;
    public hora_desde_servicio: string = null;
    public hora_hasta_servicio: string = null;
    public nombre: string = null;
    public apellido: string = null;
    public correo: string = null;
    public telefono: string = null;

    public nombreTabla: string = 'citas';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }

}
