import { HttpException, HttpStatus, Injectable} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from 'src/config';
import { DbService } from 'src/db/db.service';
import { User } from './entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(private readonly dbService: DbService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: envs.jwt_secret,
        })
    }

    /**
     * Función que recibe el payload y se hace las verificaciones pertinentes
     * @param payload 
     * @returns 
     */
    async validate(payload: any) {
       
        const sql = this.dbService.selectOne({
            id_usuario: payload.id,
            nombreTabla: 'usuario'
        }, true);

        const response = await this.dbService.executeQueryModel(sql);

        if (response.length < 0) {
            throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
        }

        if (new User(response[0]).fecha_eliminacion !== null) {
            throw new HttpException('Unauthorized user', HttpStatus.UNAUTHORIZED);
        }

        return payload;
    }
}