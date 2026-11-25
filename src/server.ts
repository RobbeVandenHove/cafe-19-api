import dotenv from 'dotenv';
import express, { Application } from 'express';
import 'reflect-metadata';
import logger from './utils/logger';
import Database from './utils/database';
import errorHandler from './middlewares/error-handler.middleware';
import cookieParser from "cookie-parser";

dotenv.config();
var cors = require('cors');

export default class Server {
    private static _instance: Server;
    private _app: Application;
    private _serverInstance: any;

    private constructor() {
        this._app = express();
        this._app.use(express.json());
        this._app.use(express.urlencoded({ extended: true }));
        this._app.use('/uploads', express.static('uploads'));
        this._app.use(cors({
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://your-frontend-domain.com'
            ],
            credentials: true
        }));
        this._app.use(cookieParser());
    }

    public static getInstance(): Server {
        if (this._instance == null) {
            this._instance = new Server();
        }
        return this._instance;
    }

    public async startServer(): Promise<void> {
        try {
            this._app.use(errorHandler);
            Database.getInstance();
            await Database.initORM();
            const port = Number(process.env.SERVER_LISTENING_PORT) || 3000;
            this._serverInstance = this._app.listen(port, '0.0.0.0', () => {
                logger.info(`[INFO] SERVER STARTED: LISTENING ON PORT ${port}`);
            });
        } catch (err) {
            logger.info(err);
        }
    }

    public async stopServer(): Promise<void> {
        if (this._serverInstance) {
            await new Promise<void>((resolve, reject) => {
                this._serverInstance.close((err: any) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            logger.info('[INFO] SERVER STOPPED');
        }
    }

    public getServer(): Application {
        return this._app;
    }
}
