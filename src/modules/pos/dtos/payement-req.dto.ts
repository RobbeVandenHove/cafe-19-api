import { IsArray, IsUUID } from "class-validator";

export default class PayementReqDTO {

    @IsUUID()
    public userId!: string;

    @IsArray()
    @IsUUID('4', { each: true })
    public beverageIds!: string[];
}