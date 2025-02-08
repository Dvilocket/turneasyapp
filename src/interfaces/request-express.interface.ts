import { Request as ExpressRequest} from 'express';
import { TypeUser, TypeUserGeneral } from 'src/enum';


export interface RequesExpressInterface extends ExpressRequest {
    user: {
        id: number;
        user: string;
        email: string;
        phone: string | null;
        type_user: TypeUserGeneral | TypeUser;
        iat: number;
        exp: number;
    };
}