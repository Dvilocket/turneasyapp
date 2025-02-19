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

    /**
     * metodo publico para que se pueda formatear la hora
     */
    public formatTime() {
        if (this.hora_inicio && this.hora_fin) {
            this.hora_inicio = this.format(this.hora_inicio);
            this.hora_fin = this.format(this.hora_fin);
        }
    }

    /**
     * Metodo privado para formatear la hora en el formato
     * deseado
     * @param hora 
     * @returns 
     */
    private format(hora: string): string {
        if (!hora) return null;
        const [horaCompleta, minutos] = hora.split(':');
        return `${parseInt(horaCompleta, 10)}:${minutos}`;
    }
}