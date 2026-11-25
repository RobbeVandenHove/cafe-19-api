import { Request, Response, Router } from "express";
import AbstractRouter from "../../../utils/abstract-router";
import TerminalService from "../services/terminal.service";
import authentication from "../../../middlewares/authentication.middleware";
import asyncHandler from "../../../utils/async-handler";
import { validateDTO } from "../../../utils/dto.validator";
import CreateTerminalReqDTO from "../dtos/create-terminal.req.dto";
import { plainToInstance } from "class-transformer";
import ApiError from "../../../utils/api.error";

export default class TerminalController extends AbstractRouter {
    private terminalService = new TerminalService();

    public registerRoutes(): Router {
        const router = Router();

        router.get('/all', authentication(['service_owner', 'client_admin']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const terminals = await this.terminalService.getAllTerminals(userId);
            res.status(200).json(terminals);
        }));

        router.post('/new-terminal', authentication(['service_owner', 'client_admin']), validateDTO(CreateTerminalReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const createTerminalDto = plainToInstance(CreateTerminalReqDTO, rawData);
            const terminal = await this.terminalService.createTerminal(userId, createTerminalDto);
            res.status(201).json(terminal);
        }));

        router.delete('/:id', authentication(['service_owner', 'client_admin']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const terminalId = req.params.id;
            if (!terminalId) throw new ApiError(400, "Gelieve een terminal mee te geven.");
            await this.terminalService.deleteTerminal(userId, terminalId);
            res.status(201).json({ message: "Terminal is verwijderd van de kazerne." });
        }))

        return router;
    }
}