import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export default class AcceptOtpReqDTO {

    @IsString()
    public userId!: string;

    @IsString()
    @MaxLength(6, { message: "OTP must be at most 6 characters long." })
    @MinLength(6, { message: "OTP must be at least 6 characters long." })
    public otp!: string;
}