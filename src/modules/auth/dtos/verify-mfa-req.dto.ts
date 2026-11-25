import { IsNotEmpty, IsString, IsUUID, Matches } from "class-validator";

export default class VerifyMfaReqDTO {

    @IsString()
    public userId!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/, {
        message: "MFA code must contain exactly 6 digits."
    })
    public code!: string;
}