import { IsString, IsUUID, Matches, MinLength } from "class-validator";

export default class ResetPwdReqDTO {

    @IsString()
    public resetToken!: string;

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message: 'Password must contain at least 8 characters, one uppercase letter, one number and one special character.',
    })
    public password!: string;
}