import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";
import BeverageType from "../enums/beverage-type.enum";

export default class UpdateBeverageReqDTO {

    @IsUUID()
    public id!: string;

    @IsString()
    @IsNotEmpty()
    public name!: string;

    @IsNumber()
    @Min(0)
    public price!: number;

    @IsNumber()
    @Min(0)
    public amount!: number;

    @IsEnum(BeverageType)
    public type!: BeverageType;
}