import Server from '../server';
import logger from './logger';

// ADD IMPORTS HERE FOR THE CONTROLLERS
// FOR EXAMPLE:
import AuthController from '../modules/auth/controllers/auth.controller';
import FirehouseController from '../modules/firehouse/controllers/firehouse.controller';
import TerminalController from '../modules/firehouse/controllers/terminal.controller';
import StockController from '../modules/stock/controllers/stock.controller';
import StampcardController from '../modules/stock/controllers/stampcard.controller';
import PosController from '../modules/pos/controllers/pos.controller';

export default class Routing {
    public initRoutes(): void {
        const server = Server.getInstance();

        // ADD ROUTES HERE FOR THE CONTROLLERS
        // FOR EXAMPLE:
        server.getServer().use('/api/v1/auth', new AuthController().registerRoutes());
        server.getServer().use('/api/v1/firehouse', new FirehouseController().registerRoutes());
        server.getServer().use('/api/v1/terminal', new TerminalController().registerRoutes());
        server.getServer().use('/api/v1/stock', new StockController().registerRoutes());
        server.getServer().use('/api/v1/stampcard', new StampcardController().registerRoutes());
        server.getServer().use('/api/v1/pos', new PosController().registerRoutes());

        logger.info('[INFO] Routes merged successfully');
    }
}
