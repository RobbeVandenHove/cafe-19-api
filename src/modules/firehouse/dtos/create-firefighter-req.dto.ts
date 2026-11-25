import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import Firehouse from "../entities/firehouse.entity";
import Firefighter from "../entities/firefighter.entity";

export default class CreateFirefighterReqDTO {

    @IsString()
    @IsNotEmpty()
    public firstName!: string;

    @IsString()
    @IsNotEmpty()
    public lastName!: string;

    @IsEmail()
    public email!: string;

    public static toDto(firstName: string, lastName: string, email: string): CreateFirefighterReqDTO {
        const dto = new CreateFirefighterReqDTO();
        dto.firstName = firstName;
        dto.lastName = lastName;
        dto.email = email;
        return dto;
    }

    public toFirefighter(firehouse: Firehouse): Firefighter {
        return new Firefighter(this.firstName, this.lastName, this.email, firehouse);
    }
}