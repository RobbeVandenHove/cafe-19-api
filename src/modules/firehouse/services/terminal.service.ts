import { randomBytes } from "crypto";
import ApiError from "../../../utils/api.error";
import Database from "../../../utils/database";
import CreateTerminalReqDTO from "../dtos/create-terminal.req.dto";
import Firehouse from "../entities/firehouse.entity";
import Terminal from "../entities/terminal.entity";

export default class TerminalService {

    public async getAllTerminals(userId: string): Promise<Terminal[]> {
        const firehouse = await this.getMyFirehouse(userId);
        return firehouse.terminals.getItems().sort((a, b) => a.number - b.number);
    }

    public async createTerminal(userId: string, dto: CreateTerminalReqDTO): Promise<Terminal> {
        const em = Database.getEntityManager();
        const firehouse = await this.getMyFirehouse(userId);
        if (firehouse.terminals.length >= 2) throw new ApiError(400, "Je kunt maximaal 2 terminals koppelen.");
        const terminal = dto.toTerminal(firehouse.terminals.length + 1, this.generateRandomApiKey(), firehouse);
        await em.persist(terminal).flush();
        return terminal;
    }

    public async deleteTerminal(userId: string, terminalId: string): Promise<void> {
        const em = Database.getEntityManager();
        const firehouse = await this.getMyFirehouse(userId);

        const terminal = firehouse.terminals.getItems().find(t => t.id === terminalId);

        if (!terminal) {
            throw new Error('Terminal niet gevonden.');
        }

        if (terminal.number === 1) {
            const secondTerminal = firehouse.terminals.getItems().find(t => t.number === 2);

            if (secondTerminal) {
                secondTerminal.number = 1;
            }
        }

        em.remove(terminal);
        firehouse.terminals.remove(terminal);

        await em.flush();
    }

    private generateRandomApiKey(): string {
        return `kzr_01_live_${randomBytes(16).toString('hex')}`;
    }

    private async getMyFirehouse(userId: string): Promise<Firehouse> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        }, { populate: ['terminals'] });
        if (!firehouse) throw new ApiError(400, "We kunnen je kazerne niet vinden.");
        return firehouse;
    }
}