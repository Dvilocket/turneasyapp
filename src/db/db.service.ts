import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'pg';
import { envs } from 'src/config';
import {TypeUserGeneral } from 'src/enum';
import { JsonInterface, JsonQueryInterface, TypeJson } from './interfaces';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class DbService implements OnModuleInit {
    
    private readonly NAME_TABLE: string = 'nombreTabla';
    private readonly PATH_QUERIES: string = join(__dirname, '../../src/db', 'queries');

    private logger: Logger = new Logger('Db-Service-main');
    private client: Client;

    static IS_NULL: string = 'IS NULL';
    static NOW: string = 'NOW()';

    /**
     * Cuando se inicia el servicio
     * nos conectamos a la base de datos
     * si no es posible conectarnos
     * lanzamos un error
     */
    async onModuleInit() {
        
        this.client = new Client({
            host: envs.db_host,
            port: envs.db_port,
            user: envs.db_user,
            password: envs.db_password,
            database: envs.db_name
        });

        try {
            await this.client.connect();
            await this.enterUserMaster();
            this.logger.log('connected to the database');
        } catch(error) {
            this.logger.log('I couldnt connect to the database');
            throw error;
        }
    }

    /**
     * Funcion para crear el usuario master en toda la aplicacion,
     * es el usaurio que desde base va a poder crear administradores
     * y clientes, es el usuario principal en la aplicacion
     * @returns 
     */
    private async enterUserMaster() {
        const model = {
            usuario: envs.user_master,
            nombreTabla: 'usuario'
        }
        const sql = this.selectOne(model, true);

        const response: any[] = await this.executeQueryModel(sql);

        if (response.length > 0) {
            this.logger.log(`master user ${model.usuario} created`);
            return;
        }

        if (envs.user_master_type_user !== TypeUserGeneral.ADMINISTRATOR) {
            this.logger.log('It is not possible to create the master user because it must be administrator type');
            return;
        }

        const insertModel = {
            usuario: envs.user_master,
            nombre: envs.user_master_name,
            clave: envs.user_master_password,
            correo: envs.user_master_email,
            telefono: envs.user_master_phone,
            tipo_usuario: envs.user_master_type_user,
            nombreTabla: 'usuario'
        };

        const sqlInsert = this.insert(insertModel);
        await this.executeQueryModel(sqlInsert);
        this.logger.log(`the master user was created`);
    }

    /**
     * Limpiar la conexión cuando se cierra
     * la aplicación
     */
    async onModuleDestroy() {
        await this.client.end();
    }

    /**
     * Función que me permite organizar el where en una consulta, es
     * decir coge las propiedades de un objeto y lo que hace
     * es transformarla en un where usando clave valor
     * @param modelo 
     * @returns 
     */
    private organizeWhere(model: Object): string {
       let sqlWhere = Object.entries(model).map(([key, value]) => {
            if (key !== this.NAME_TABLE) {
                if (value === DbService.IS_NULL) {
                    return `${key} IS NULL`;
                } else {
                    if (typeof value === 'string') {
                        return `${key}=\'${value}\'`;
                    } else {
                        return `${key}=${value}`;
                    } 
                }
            }
       });
       return sqlWhere.filter((element) => element !== undefined).join(' AND ');
    }

    /**
     * Función que me permite organizar el select en una consulta, es decir
     * coge las propiedades del opbjeto y lo transforma en un select
     * @param model 
     */
    private organizeSelect(model: Object): string {
        const keys = Object.keys(model).filter((element) => element !== this.NAME_TABLE);
        return keys.join(',');
    }

    /**
     * Función que me permite organizar el insert de la forma en el
     * que la sql lo espera, devuelve la parte de las llaves del
     * insert y devuelve sus valores de acuerdo al estandar
     * de posgretsql para hacer la inserción
     * @param model 
     * @returns 
     */
    private organizeInsert(model: Object): string[] {
        const keys = this.organizeSelect(model);
        const keysInsert = `(${keys})`;
        const values = [];
        
        for(const element of keys.split(',')) {
            if (typeof model[element] === 'string') {
                values.push(`\'${model[element]}\'`);
                continue;
            }
            values.push(model[element]);
        }
        
        const valuesInsert = `(${values.join(',')})`;
        
        return [
            keysInsert,
            valuesInsert
        ];
    }

    /**
     * Función que me permite consultar si un modelo ingresado por argumento
     * tiene alguna propiedad que sea distinta a la de la propiedad del nombre
     * de la tabla
     * @param model 
     * @returns 
     */
    private hasProperties(model: Object): boolean {
        const keys = Object.keys(model).filter((element) => element !== this.NAME_TABLE)
        return keys.length > 0;
    }

    /**
     * Función que nos permite hacer un select en base de datos
     * de acuerdo a las propiedades que tiene el objeto, si no
     * se le pasa ninguna propieda se hace un select * from
     * @param model 
     * @param excludeProperties 
     * @returns 
     */
    public select(model: Object, excludeProperties: boolean = false, limit: number = 100): string {
        if (model.hasOwnProperty(this.NAME_TABLE)){
            if (!this.hasProperties(model)) {
                return `SELECT * FROM ${model[this.NAME_TABLE]}`;
            }
            let sql = '';
            if (!excludeProperties) {
                sql = `SELECT ${this.organizeSelect(model)} FROM ${model[this.NAME_TABLE]}`;
            } else {
                sql = `SELECT * FROM ${model[this.NAME_TABLE]}`;
            }
            sql += ` WHERE ${this.organizeWhere(model)}`;
            sql += ` LIMIT ${limit}`;
            return sql;
        }
    }

    /**
     * Funcion que nos permite hacer un select en la base de datos
     * de acuerdo a las propiedades que tiene el objeto, pero esta vez
     * se pasa el argumento de limit = 1 para devolver solo un registro
     * @param model 
     * @param excludeProperties 
     * @returns 
     */
    public selectOne(model: Object, excludeProperties: boolean = false): string {
        return this.select(model, excludeProperties, 1);
    }

    /**
     * Funcion que nos permite hacer un delete en la base de datos
     * de acuerdo a las propiedades que tiene el objeto, tiene el
     * argumento addReturning que nos permite saber que registros
     * son afectados por el delete, es de manera opcional
     * @param model 
     * @param addReturning 
     * @returns 
     */
    public delete(model: Object, addReturning: boolean = false): string {
        if (model.hasOwnProperty(this.NAME_TABLE)) {
            let sql = `DELETE FROM ${model[this.NAME_TABLE]}`;
            if (!this.hasProperties(model)) {
                return sql;
            }
            sql += ` WHERE ${this.organizeWhere(model)}`;
            if (addReturning) {
                sql += ` RETURNING *`;
            }
            return sql;
        }        
    }

    /**
     * Función que me permite actualizar un registro en base de datos
     * se le pasa como primer argumento el modeloWhere que se va a poner
     * en el where de la consulta y como segundo argumento se le pasa
     * el modelo set de la consulta, se tiene como tercer argumento
     * si se quiere devolver los registros que fueron actualizado
     * @param modelWhere 
     * @param modelSet 
     */
    public update(modelWhere: Object, modelSet: Object, addReturning: boolean = false): string {
        if (modelSet.hasOwnProperty(this.NAME_TABLE) && this.hasProperties(modelSet) && this.hasProperties(modelWhere)) {
            
            let sql = `UPDATE ${modelSet[this.NAME_TABLE]}`;
            sql += ` SET ${this.organizeWhere(modelSet).replaceAll('AND', ',')}`;
            sql += ` WHERE ${this.organizeWhere(modelWhere)}`;

            if (addReturning) {
                sql += ' RETURNING *';
            }

            return sql;
        }
    }

    /**
     * Esta Función se encarga de insertar un registro en la base de datos
     * se le pasa como primer argumento el modelo de la base de datos,
     * el se encarga de establecer los valores de la inserción y poner
     * los encabezados
     * @param model 
     * @returns 
     */
    public insert(model: Object): string {
        if (model.hasOwnProperty(this.NAME_TABLE)) {
            const [keysInsert, valuesInsert] = this.organizeInsert(model);
            return `INSERT INTO ${model[this.NAME_TABLE]} ${keysInsert} VALUES  ${valuesInsert} RETURNING *`;
        }
    }

    /**
     * Funcion para ejecutar una sql que genera un modelo
     * devuelve el resultado de la consulta
     * @param sql 
     * @returns 
     */
    public async executeQueryModel(sql: string) {
        try {
            const result = await this.client.query(sql);
            return result.rows;
        } catch(error) {
            this.logger.log(`Error execute query:${error.message}`);
            throw new HttpException(`Error execute query:${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        } 
    }

    /**
     * Inicia una transacción
     */
    public async beginTransaction() {
        await this.client.query('BEGIN');
    }

    /**
     * Confirma una transacción
     */
    public async commitTransaction() {
        await this.client.query('COMMIT');
    }

    /**
     * Revierte una transacción
     */
    public async rollbackTransaction() {
        await this.client.query('ROLLBACK');
    }


    /**
     * Ejecuta una consulta dentro de una transacción
     * @param sql 
     */
    public async executeQueryInTransaction(sql: string) {
        try {
            const result = await this.client.query(sql);
            return result.rows;
        } catch (error) {
            await this.rollbackTransaction();
            this.logger.error(`Error executing query in transaction: ${error.message}`);
            throw new HttpException(`Error executing query in transaction: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Ejecuta multiples consultas dentro de una
     * transacción
     * @param queries 
     * @returns 
     */
    public async executeMultipleTransaction(queries: string[]) {
        try {
            await this.beginTransaction();
            const results = [];
            for(const query of queries) {
                const result: any[] = (await this.client.query(query)).rows;
                results.push(result);
            }
            await this.commitTransaction();
            return results;
        } catch(error) {
            await this.rollbackTransaction();
            this.logger.error(`Transaction failed: ${error.message}`);
            throw new HttpException(`Transaction failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 
     * Función que permite leer un json de la carpeta
     * queries y hace el reemplazo de los parametros
     * @param nameJson 
     * @param params 
     */
    public queryStringJson(nameJson:string, params: JsonQueryInterface[]) {
        
        if (nameJson) {

            let evaluateJson = nameJson.split('.');
            let newJson = '';
            if (evaluateJson.length === 2) {
                const extension = evaluateJson[1].toLocaleLowerCase();
                if (extension !== 'json') {
                    this.logger.log(`The query ${nameJson} doesn't have .json extension`);
                    throw new HttpException('Invalid file extension', HttpStatus.BAD_REQUEST);
                }
                newJson = nameJson;
            } else {
                newJson = evaluateJson[0];
                newJson += '.json';
            }

            const filePath = join(this.PATH_QUERIES, `${newJson}`);

            if (!fs.existsSync(filePath)) {
                this.logger.log(`file ${newJson} does not exist`);
                throw new HttpException(`file ${newJson} does not exist`, HttpStatus.BAD_REQUEST);
            }

            try {
                
                const data = fs.readFileSync(filePath, 'utf8');
                const jsonData: JsonInterface = JSON.parse(data);

                const totalCharacterQuestion = [...jsonData.sql].filter((element: string) => element === '?').length;

                if (jsonData.params && totalCharacterQuestion <= 0 || jsonData.params && totalCharacterQuestion !== params.length) {
                    this.logger.log(`file ${newJson} check json because it is not complying with the internal rule`);
                    throw new HttpException(`file ${newJson} check json because it is not complying with the internal rule`, HttpStatus.BAD_REQUEST);
                }

                const searchKeyandYourValue = (key: string) => {
                    
                    let keysBase = [];
                    
                    for(const element of params) {
                        keysBase.push(element.name);
                    }

                    if (!keysBase.includes(key)) {
                        this.logger.log(`the key ${key} does not exist`);
                        throw new HttpException(`the key ${key} does not exist`, HttpStatus.BAD_REQUEST);
                    }

                    const valueList = params.filter((element) => element.name === key);

                    if (valueList.length > 1) {
                        this.logger.log(`the key ${key} is duplicate`);
                        throw new HttpException(`the key ${key} is duplicate`, HttpStatus.BAD_REQUEST);
                    }

                    const value = valueList[0].value;
                    const type = valueList[0].type;

                    if (type === TypeJson.STRING && typeof value === 'string') {
                        return `\'${value}\'`;
                    } else if (type === TypeJson.NUMBER && typeof value === 'number') {
                        return value;
                    } else if (type == TypeJson.BOOLEAN && typeof value === 'boolean') {
                        return value;
                    }

                    this.logger.log(`the value ${value} has the wrong data type`);
                    throw new HttpException(`the value ${value} has the wrong data type`, HttpStatus.BAD_REQUEST);
                };

                if (jsonData.params) {

                    let sqlParts = jsonData.sql.split("?");
                
                    for (const element of jsonData.params) {

                        const key = Object.keys(element)[0];
                        const value = searchKeyandYourValue(key);
                
                        const valueAsString = String(value);
                
                        if (sqlParts.length > 1) {
                            sqlParts[0] += valueAsString + sqlParts[1];
                            sqlParts.splice(1, 1);
                        }
                    }
                
                    jsonData.sql = sqlParts.join("");
                }
                return jsonData.sql;

            } catch(error) {
                this.logger.log(`Unable to read json file ${filePath}`);
                throw new HttpException('Unable to read json file', HttpStatus.BAD_REQUEST);
            }
        }
        throw new HttpException('must include the file name', HttpStatus.BAD_REQUEST);
    }
}
