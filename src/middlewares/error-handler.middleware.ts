import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/api.error';

export default function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof ApiError) {
        res.status(error.status).json({
            message: error.message,
        });
        return;
    }

    console.error(error);

    res.status(500).json({
        message: 'Er is iets misgegaan.',
    });
}