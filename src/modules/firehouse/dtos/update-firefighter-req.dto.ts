import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export default class UpdateFirefighterReqDTO {

    @IsString()
    @IsNotEmpty()
    public id!: string;

    @IsString()
    @IsNotEmpty()
    public firstName!: string;

    @IsString()
    @IsNotEmpty()
    public lastName!: string;

    @IsEmail()
    public email!: string;

    @IsOptional()
    @IsIn(['client_admin', 'client_bookkeeper', null])
    public additionalRole?: 'client_admin' | 'client_bookkeeper' | null | undefined;
}