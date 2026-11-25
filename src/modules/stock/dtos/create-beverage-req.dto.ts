import { IsNotEmpty, IsNumber, IsEnum, IsString, Min } from "class-validator";
import BeverageType from "../enums/beverage-type.enum";
import Stock from "../entities/stock.entity";
import Beverage from "../entities/beverage.entity";

export default class CreateBeverageReqDTO {

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

    public toBeverage(stock: Stock): Beverage {
        return new Beverage(this.name, stock, this.type, this.price, this.amount);
    }
}