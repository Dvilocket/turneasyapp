import { IsEnum } from "class-validator";
import { CreateAuthBaseDto } from "./create-auth-base.dto";
import { TypeUserGeneral, TypeUserListGeneral } from "src/enum";

export class CreateAuthGeneralDto extends CreateAuthBaseDto {
    @IsEnum(TypeUserGeneral, {
        message: `Valida status are ${TypeUserListGeneral}`
    })
    tipo_usuario: TypeUserGeneral
}