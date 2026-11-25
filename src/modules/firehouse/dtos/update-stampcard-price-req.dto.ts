import { IsNumber } from "class-validator";

export default class UpdateStampcardPriceReqDTO {

    @IsNumber()
    public stampCardPrice!: number;
}