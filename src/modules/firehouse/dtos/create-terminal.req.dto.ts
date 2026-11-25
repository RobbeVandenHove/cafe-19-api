import { IsNotEmpty, IsString } from "class-validator";
import Terminal from "../entities/terminal.entity";
import Firehouse from "../entities/firehouse.entity";

export default class CreateTerminalReqDTO {

    @IsString()
    @IsNotEmpty()
    public name!: string;

    @IsString()
    @IsNotEmpty()
    public device!: string;

    public toTerminal(number: number, apiKey: string, firehouse: Firehouse): Terminal {
        return new Terminal(number, this.name, this.device, apiKey, firehouse);
    }
}