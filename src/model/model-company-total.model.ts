import { ModelBase } from "./model-base.model";

export class ModelCompanyTotal extends ModelBase {

    public id_empresa_total: number = null;
    public id_usuario: number = null;
    public total: number = null;

    public nombreTabla: string = 'empresa_total';

    constructor(modelObject: any = null) {
        super();
        super.getReferenceAndModel(this, modelObject);
        if (modelObject) {
            super.loadModel();
        }
    }
}