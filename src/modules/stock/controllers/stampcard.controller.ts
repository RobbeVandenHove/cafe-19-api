import { Request, Response, Router } from "express";
import AbstractRouter from "../../../utils/abstract-router";
import StampcardService from "../services/stampcard.service";
import authentication from "../../../middlewares/authentication.middleware";
import asyncHandler from "../../../utils/async-handler";
import ApiError from "../../../utils/api.error";

export default class StampcardController extends AbstractRouter {
    private stampcardService = new StampcardService();

    public registerRoutes(): Router {
        const router = Router();

        router.get('/listed-users', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const list = await this.stampcardService.getListedStampcards(userId);
            res.status(200).json(list);
        }));

        router.post('/create-stampcard/:id', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const id = req.params.id;
            if (!id) throw new ApiError(400, 'Gelieve een gebruiker mee te geven.');
            const stampcard = await this.stampcardService.createStampcard(userId, id);
            res.status(201).json(stampcard);
        }));

        router.put('/as-paid/:id', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const id = req.params.id;
            if (!id) throw new ApiError(400, 'Gelieve een drankkaart mee te geven.');
            await this.stampcardService.setPaid(userId, id);
            res.status(201).json({ message: 'Drankkaart is betaald.' });
        }));

        return router;
    }
}