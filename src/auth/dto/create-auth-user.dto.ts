import { IsEnum } from "class-validator";
import { CreateAuthBaseDto } from "./create-auth-base.dto";
import { TypeUser, TypeUserListUser } from "src/enum";


export class CreateAuthUserDto extends CreateAuthBaseDto {
    @IsEnum(TypeUser, {
        message: `Valida status are ${TypeUserListUser}`
    })
    tipo_usuario: TypeUser
}