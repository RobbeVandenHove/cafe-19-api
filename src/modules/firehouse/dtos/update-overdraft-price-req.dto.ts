import { IsNumber } from "class-validator";

export default class UpdateOverdraftPriceReqDTO {

    @IsNumber()
    public overdraft!: number;
}