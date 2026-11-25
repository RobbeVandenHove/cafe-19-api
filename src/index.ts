import Server from './server';
import Routing from './utils/routing';

(async () => {
    const server = Server.getInstance();
    new Routing().initRoutes();
    server.startServer();
})();
