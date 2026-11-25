import { IsString, IsNotEmpty } from "class-validator";

export default class UpdateFirehouseDTO {
    @IsString()
    @IsNotEmpty()
    public name!: string;

    @IsString()
    @IsNotEmpty()
    public address!: string;
}