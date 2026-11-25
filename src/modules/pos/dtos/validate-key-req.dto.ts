import { IsString, Length, Matches } from "class-validator";

export default class ValidateKeyReqDTO {

    @IsString()
    @Length(44, 44, { message: "Gelieve een geldig formaat in te geven." })
    @Matches(/^kzr_01_live_/, { message: "Gelieve een geldig formaat in te geven." })
    public apiKey!: string;
}