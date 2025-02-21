import { TypeDayWeek } from "src/enum";
import { ModelBase } from "src/model";
export class Shift extends ModelBase {

    public id_turno: number = null;
    public id_empleado: number = null;
    public dia_semana: TypeDayWeek = null;
    public hora_inicio: string = null;
    public hora_fin: string = null;

    public fecha_creacion: string = null;
    public fecha_actualizacion: string = null;
    public fecha_eliminacion: string = null;
    public nombreTabla: string = 'turno';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }
}