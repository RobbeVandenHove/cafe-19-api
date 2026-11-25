import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export default class CreateUserReqDTO {

    @IsString()
    @IsNotEmpty()
    public firstName!: string;

    @IsString()
    @IsNotEmpty()
    public lastName!: string;

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    public email!: string;

    @IsString()
    @IsNotEmpty()
    public role!: string;

    @IsBoolean()
    public hasExistingFirehouse?: boolean;

    public static toDto(firstName: string, lastName: string, email: string, role: string, hasExistingFirehouse: boolean): CreateUserReqDTO {
        const dto = new CreateUserReqDTO();
        dto.firstName = firstName;
        dto.lastName = lastName;
        dto.email = email;
        dto.role = role;
        dto.hasExistingFirehouse = hasExistingFirehouse;
        return dto;
    }
}