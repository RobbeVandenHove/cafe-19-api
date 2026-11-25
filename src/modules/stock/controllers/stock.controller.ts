import { Request, Response, Router } from "express";
import AbstractRouter from "../../../utils/abstract-router";
import StockService from "../services/stock.service";
import authentication from "../../../middlewares/authentication.middleware";
import { validateDTO } from "../../../utils/dto.validator";
import CreateBeverageReqDTO from "../dtos/create-beverage-req.dto";
import asyncHandler from "../../../utils/async-handler";
import { plainToInstance } from "class-transformer";
import UpdateBeverageReqDTO from "../dtos/update-beverage-req.dto";
import ApiError from "../../../utils/api.error";

export default class StockController extends AbstractRouter {
    private stockService = new StockService();

    public registerRoutes(): Router {
        const router = Router();

        router.get('/all-beverages', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const beverages = await this.stockService.getAllBeverages(userId);
            res.status(200).json(beverages);
        }));

        router.post('/create-beverage', authentication(['*']), validateDTO(CreateBeverageReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const createBeverageDto = plainToInstance(CreateBeverageReqDTO, rawData);
            const beverage = await this.stockService.createBeverage(userId, createBeverageDto);
            res.status(201).json(beverage);
        }));

        router.put('/update-beverage', authentication(['*']), validateDTO(UpdateBeverageReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const updateBeverageDto = plainToInstance(UpdateBeverageReqDTO, rawData);
            const beverage = await this.stockService.updateBeverage(userId, updateBeverageDto);
            res.status(201).json(beverage);
        }));

        router.delete('/delete-beverage/:id', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const beverageId = req.params.id;
            if (!beverageId) throw new ApiError(400, 'Gelieve een drankje of snack mee te geven.');
            await this.stockService.deleteBeverage(userId, beverageId);
            res.status(201).json({ message: 'Drankje of snack is succesvol verwijderd.' });
        }))

        return router;
    }
}