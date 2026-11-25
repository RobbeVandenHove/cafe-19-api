import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import User from "../../auth/entities/user.entity";
import Firehouse from "../entities/firehouse.entity";

export default class CreateFirehouseReqDTO {

    @IsString()
    @IsNotEmpty()
    public name!: string;

    @IsString()
    @IsNotEmpty()
    public address!: string;

    @IsString()
    public adminId!: string;

    public toFirehouse(admin: User): Firehouse {
        return new Firehouse(this.name, this.address, admin);
    }
}