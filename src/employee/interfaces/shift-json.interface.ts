export interface Schedule {
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    fecha_creacion: string;
}

export interface Employee {
    id_empleado: number;
    nombre_empleado: string;
    correo_empleado: string;
    telefono_empleado: string;
    imagen_empleado: string;
    horarios: Schedule[];
}

export interface ShiftJsonInterface {
    id_empresa: number;
    nombre: string;
    direccion: string;
    empleados: Employee[];
}


