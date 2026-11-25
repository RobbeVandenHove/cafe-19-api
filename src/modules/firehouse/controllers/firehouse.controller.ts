import { Router, Request, Response } from "express";
import AbstractRouter from "../../../utils/abstract-router";
import { validateDTO } from "../../../utils/dto.validator";
import CreateFirehouseReqDTO from "../dtos/create-firehouse-req.dto";
import authentication from "../../../middlewares/authentication.middleware";
import asyncHandler from "../../../utils/async-handler";
import { plainToInstance } from "class-transformer";
import FirehouseService from "../services/firehouse.service";
import CreateFirefighterReqDTO from "../dtos/create-firefighter-req.dto";
import UpdateFirefighterReqDTO from "../dtos/update-firefighter-req.dto";
import ApiError from "../../../utils/api.error";
import UpdateFirehouseDTO from "../dtos/update-firehouse-req.dto";
import UpdateStampcardPriceReqDTO from "../dtos/update-stampcard-price-req.dto";
import UpdateOverdraftPriceReqDTO from "../dtos/update-overdraft-price-req.dto";

export default class FirehouseController extends AbstractRouter {
    private firehouseService = new FirehouseService();

    public registerRoutes(): Router {
        const router = Router();

        router.post('/create-firehouse', validateDTO(CreateFirehouseReqDTO), authentication(['service_owner', 'client_admin']), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const createFirehouseDto = plainToInstance(CreateFirehouseReqDTO, rawData);
            const firehouse = await this.firehouseService.createFirehouse(createFirehouseDto);
            res.status(201).json(firehouse);
        }));

        router.get('/my-firehouse', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const firehouse = await this.firehouseService.getMyFirehouseDetails(userId);
            res.status(201).json({ name: firehouse.name, address: firehouse.address, stampCardPrice: firehouse.stampCardPrice, overdraft: firehouse.overdraft });
        }));

        router.put('/update-firehouse', authentication(['service_owner', 'client_admin']), validateDTO(UpdateFirehouseDTO), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const updateFirehouseDto = plainToInstance(UpdateFirehouseDTO, rawData);
            const firehouse = await this.firehouseService.updateFirehouse(userId, updateFirehouseDto);
            res.status(201).json(firehouse);
        }));

        router.put('/update-stampcardprice', authentication(['service_owner', 'client_admin']), validateDTO(UpdateStampcardPriceReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const updateStampcarPriceDto = plainToInstance(UpdateStampcardPriceReqDTO, rawData);
            const price = await this.firehouseService.updateStampcardPrice(updateStampcarPriceDto, userId);
            res.status(201).json(price);
        }));

        router.put('/update-overdraft', authentication(['service_owner', 'client_admin']), validateDTO(UpdateOverdraftPriceReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const updateOverdraftPriceDto = plainToInstance(UpdateOverdraftPriceReqDTO, rawData);
            const price = await this.firehouseService.updateOverdraftPrice(updateOverdraftPriceDto, userId);
            res.status(201).json(price);
        }));

        router.get('/all-firefighters', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const firefighters = await this.firehouseService.getAllFirefighters(userId);
            res.status(201).json(firefighters);
        }));

        router.post('/create-firefighter', authentication(['service_owner', 'client_admin']), validateDTO(CreateFirefighterReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const createFirefighterDto = plainToInstance(CreateFirefighterReqDTO, rawData);
            const userId = (req as any).user.userId;
            const firefighter = await this.firehouseService.createFirefighter(createFirefighterDto, userId);
            res.status(201).json(firefighter);
        }));

        router.put('/update-firefighter', authentication(['service_owner', 'client_admin']), validateDTO(UpdateFirefighterReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const dto = plainToInstance(UpdateFirefighterReqDTO, rawData);
            const userId = (req as any).user.userId;

            const firefighter = await this.firehouseService.updateFirefighter(dto, userId);

            res.status(200).json(firefighter);
        }));

        router.delete('/delete-firefighter/:id', authentication(['service_owner', 'client_admin']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const id = req.params.id;
            if (!id) throw new ApiError(400, "Gelieve een id mee te geven.");
            await this.firehouseService.deleteFirefighter(id, userId);
            res.status(200).json({ message: "Vrijwilliger is succesvol verwijderd." });
        }))

        return router;
    }
}