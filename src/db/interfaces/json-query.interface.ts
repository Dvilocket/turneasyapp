export enum TypeJson {
    STRING = 'STRING',
    NUMBER= 'NUMBER',
    BOOLEAN = 'BOOLEAN'
}



export interface JsonQueryInterface {
    name: string;
    value: string | number | boolean;
    type: TypeJson;
}