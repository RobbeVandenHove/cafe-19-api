import { Request, Response, Router } from "express";
import AbstractRouter from "../../../utils/abstract-router";
import PosService from "../services/pos.service";
import asyncHandler from "../../../utils/async-handler";
import { validateDTO } from "../../../utils/dto.validator";
import ValidateKeyReqDTO from "../dtos/validate-key-req.dto";
import { plainToInstance } from "class-transformer";
import ApiError from "../../../utils/api.error";
import PayementReqDTO from "../dtos/payement-req.dto";

export default class PosController extends AbstractRouter {
    private posService = new PosService();

    public registerRoutes(): Router {
        const router = Router();

        router.post('/validate-api-key', validateDTO(ValidateKeyReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const validateApiKeyDto = plainToInstance(ValidateKeyReqDTO, rawData);
            const terminal = await this.posService.coupleApiKey(validateApiKeyDto);
            res.status(200).json(terminal);
        }));

        router.get('/pos-items', asyncHandler(async (req: Request, res: Response) => {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) throw new ApiError(400, "Gelieve een geldige API Key mee te geven.");
            const beverages = await this.posService.getPosItems(apiKey as string);
            res.status(200).json(beverages);
        }));

        router.get('/pos-users', asyncHandler(async (req: Request, res: Response) => {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) throw new ApiError(400, "Gelieve een geldige API Key mee te geven.");
            const users = await this.posService.getPayementUsers(apiKey as string);
            res.status(200).json(users);
        }));

        router.post('/pay', validateDTO(PayementReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) throw new ApiError(400, "Gelieve een geldige API Key mee te geven.");
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const dto = plainToInstance(PayementReqDTO, rawData);
            await this.posService.pay(apiKey as string, dto);
            res.status(201).json({ message: "Betaling is gelukt." });
        }));

        return router;
    }
}