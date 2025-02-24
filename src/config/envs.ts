import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT_APP: number;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    USER_MASTER: string;
    USER_MASTER_NAME: string,
    USER_MASTER_PASSWORD: string;
    USER_MASTER_EMAIL: string;
    USER_MASTER_TYPE_USER: string;
    USER_MASTER_PHONE: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    DAYS_ALLOWED_ON_APPOINTMENT: number;
}

const envsSchema = joi.object({
    PORT_APP: joi.number().required(),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRES_IN: joi.string().required(),
    DB_HOST: joi.string().required(),
    DB_PORT: joi.number().required(),
    DB_USER: joi.string().required(),
    DB_PASSWORD: joi.string().required(),
    DB_NAME: joi.string().required(),
    USER_MASTER: joi.string().required(),
    USER_MASTER_NAME: joi.string().required(),
    USER_MASTER_PASSWORD: joi.string().required(),
    USER_MASTER_EMAIL: joi.string().required(),
    USER_MASTER_TYPE_USER: joi.string().required(),
    USER_MASTER_PHONE: joi.string().required(),
    CLOUDINARY_CLOUD_NAME: joi.string().required(),
    CLOUDINARY_API_KEY: joi.string().required(),
    CLOUDINARY_API_SECRET: joi.string().required(),
    DAYS_ALLOWED_ON_APPOINTMENT: joi.string().required()
}).unknown(true);

const {error, value} = envsSchema.validate({
    ...process.env,
});

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    port_app: envVars.PORT_APP,
    jwt_secret: envVars.JWT_SECRET,
    jwt_expires_in: envVars.JWT_EXPIRES_IN,
    db_host: envVars.DB_HOST,
    db_port: envVars.DB_PORT,
    db_user: envVars.DB_USER,
    db_password: envVars.DB_PASSWORD,
    db_name: envVars.DB_NAME,
    user_master: envVars.USER_MASTER,
    user_master_name: envVars.USER_MASTER_NAME,
    user_master_password: envVars.USER_MASTER_PASSWORD,
    user_master_email: envVars.USER_MASTER_EMAIL,
    user_master_type_user: envVars.USER_MASTER_TYPE_USER,
    user_master_phone: envVars.USER_MASTER_PHONE,
    cloudinary_cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: envVars.CLOUDINARY_API_KEY,
    cloudinary_api_secret: envVars.CLOUDINARY_API_SECRET,
    days_allowed_on_appointment: envVars.DAYS_ALLOWED_ON_APPOINTMENT
};