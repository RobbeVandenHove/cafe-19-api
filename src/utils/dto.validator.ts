import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const validateDTO = (dtoClass: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        let rawData = null;
        if (!req.body.data) {
            return res.status(400).json({ message: 'No data provided' });
        }
        if (typeof req.body.data === 'string') {
            rawData = JSON.parse(req.body.data);
        } else {
            rawData = req.body.data;
        }
        const dtoObject = plainToInstance(dtoClass, rawData, { enableImplicitConversion: true });
        const errors = await validate(dtoObject);
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Invalid properties',
                errors: errors.map((err) => ({
                    property: err.property,
                    constraints: err.constraints,
                })),
            });
        }
        next();
    };
};

export { validateDTO };
