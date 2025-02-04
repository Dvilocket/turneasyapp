interface Param {
    [key: string] : string
}

export interface JsonInterface {
    sql: string;
    params?: Param[]
}