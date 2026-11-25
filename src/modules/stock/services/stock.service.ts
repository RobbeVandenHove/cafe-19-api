import ApiError from "../../../utils/api.error";
import Database from "../../../utils/database";
import Firehouse from "../../firehouse/entities/firehouse.entity";
import CreateBeverageReqDTO from "../dtos/create-beverage-req.dto";
import UpdateBeverageReqDTO from "../dtos/update-beverage-req.dto";
import Beverage from "../entities/beverage.entity";
import Stock from "../entities/stock.entity";
import BeverageType from "../enums/beverage-type.enum";

export default class StockService {

    public async getAllBeverages(userId: string): Promise<Beverage[]> {
        const stock = await this.getStock(userId);

        const typeOrder = {
            [BeverageType.ALCOHOLIC]: 1,
            [BeverageType.NON_ALCOHOLIC]: 2,
            [BeverageType.SNACK]: 3
        };

        return stock.beverages.getItems().sort((a, b) => {
            const typeDifference = typeOrder[a.type] - typeOrder[b.type];

            if (typeDifference !== 0) return typeDifference;

            return b.amount - a.amount;
        });
    }

    public async createBeverage(userId: string, dto: CreateBeverageReqDTO): Promise<Beverage> {
        const stock = await this.getStock(userId);
        if (stock.beverages.getItems().some(b => b.name.toLowerCase() === dto.name.toLowerCase())) {
            throw new ApiError(400, 'Er bestaat al een product met deze naam.');
        }
        const beverage = dto.toBeverage(stock);
        const em = Database.getEntityManager();
        await em.persist(beverage).flush();
        return beverage;
    }

    public async updateBeverage(userId: string, dto: UpdateBeverageReqDTO): Promise<Beverage> {
        const stock = await this.getStock(userId);
        const em = Database.getEntityManager();
        const beverage = stock.beverages.find(b => b.id === dto.id);
        if (!beverage) throw new ApiError(400, 'We kunnen je drank of snack niet vinden.');
        if (beverage.name !== dto.name) {
            if (stock.beverages.getItems().some(b => b.name.toLowerCase() === dto.name.toLowerCase())) {
                throw new ApiError(400, 'Er bestaat al een product met deze naam.');
            }
            beverage.name = dto.name;
        }
        beverage.type = dto.type;
        beverage.amount = dto.amount;
        beverage.price = dto.price;
        await em.flush();
        return beverage;
    }

    public async deleteBeverage(userId: string, beverageId: string): Promise<void> {
        const stock = await this.getStock(userId);
        const em = Database.getEntityManager();
        const beverage = stock.beverages.find(b => b.id === beverageId);
        if (!beverage) throw new ApiError(400, 'We kunnen je drank of snack niet vinden.');
        await em.remove(beverage).flush();
    }

    private async getStock(userId: string): Promise<Stock> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        }, { populate: ['stock', 'stock.beverages'] });
        if (!firehouse) throw new ApiError(400, "We kunnen je kazerne niet vinden.");
        return firehouse.stock;
    }
}