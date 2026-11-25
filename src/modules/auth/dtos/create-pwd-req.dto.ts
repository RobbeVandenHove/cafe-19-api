import { IsString, IsUUID, Matches, MaxLength, MinLength } from "class-validator";

export default class CreatePwdReqDTO {

    @IsString()
    public userId!: string;

    @IsString()
    @MaxLength(6, { message: "Token must be at most 6 characters long." })
    @MinLength(6, { message: "Token must be at least 6 characters long." })
    public token!: string;

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message: 'Password must contain at least 8 characters, one uppercase letter, one number and one special character.',
    })
    public password!: string;
}