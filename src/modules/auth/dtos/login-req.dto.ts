import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export default class LoginReqDTO {

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    public email!: string;

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message: 'Password must contain at least 8 characters, one uppercase letter, one number and one special character.',
    })
    public password!: string;
}