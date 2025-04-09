import { ModelBase } from "src/model";

export class EmployeeServiceEntity extends ModelBase {

    public id_empleado: number = null;
    public id_servicio: number = null;

    public nombreTabla: string = 'empleado_servicio';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }
}