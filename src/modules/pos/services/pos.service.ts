import ApiError from "../../../utils/api.error";
import Database from "../../../utils/database";
import User from "../../auth/entities/user.entity";
import Firefighter from "../../firehouse/entities/firefighter.entity";
import Firehouse from "../../firehouse/entities/firehouse.entity";
import Terminal from "../../firehouse/entities/terminal.entity";
import Beverage from "../../stock/entities/beverage.entity";
import StampCard from "../../stock/entities/stampcard.entity";
import BeverageType from "../../stock/enums/beverage-type.enum";
import PayementReqDTO from "../dtos/payement-req.dto";
import PayementUserDTO from "../dtos/payement-user-res.dto";
import ValidateKeyReqDTO from "../dtos/validate-key-req.dto";

export default class PosService {

    public async coupleApiKey(dto: ValidateKeyReqDTO): Promise<Terminal> {
        const em = Database.getEntityManager();
        const terminal = await em.findOne(Terminal, { apiKey: dto.apiKey });
        if (!terminal) throw new ApiError(400, 'Deze terminal is niet gevonden.');
        terminal.coupled = true;
        await em.flush();
        return terminal;
    }

    public async getPosItems(apiKey: string): Promise<Beverage[]> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, { terminals: { $some: { apiKey: apiKey } } }, { populate: ['stock', 'stock.beverages'] });
        if (!firehouse) throw new ApiError(400, "Kon de gekoppelde kazerne niet vinden.");

        const typeOrder = {
            [BeverageType.ALCOHOLIC]: 1,
            [BeverageType.NON_ALCOHOLIC]: 2,
            [BeverageType.SNACK]: 3
        };

        return firehouse.stock.beverages.getItems().sort((a, b) => {
            const typeDifference = typeOrder[a.type] - typeOrder[b.type];

            if (typeDifference !== 0) return typeDifference;

            return b.amount - a.amount;
        });
    }

    public async getPayementUsers(apiKey: string): Promise<PayementUserDTO[]> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, { terminals: { $some: { apiKey: apiKey } } }, { populate: ['stock', 'stock.beverages', 'leader', 'firefighters', 'bookkeepers', 'admins'] });
        if (!firehouse) throw new ApiError(400, "Kon de gekoppelde kazerne niet vinden.");
        const res: PayementUserDTO[] = [];

        const leader = new PayementUserDTO(
            firehouse.leader.id,
            `${firehouse.leader.firstName[0]}${firehouse.leader.lastName[0]}`,
            `${firehouse.leader.firstName} ${firehouse.leader.lastName}`,
            firehouse.leader.email ?? '',
            firehouse.leader.budget,
            firehouse.overdraft
        );
        res.push(leader);

        firehouse.firefighters.getItems().forEach(f => {
            const firefighter = new PayementUserDTO(
                f.id,
                `${f.firstName[0]}${f.lastName[0]}`,
                `${f.firstName} ${f.lastName}`,
                f.email ?? '',
                f.budget,
                firehouse.overdraft
            );
            res.push(firefighter);
        });

        firehouse.bookkeepers.getItems().forEach(b => {
            const firefighter = new PayementUserDTO(
                b.id,
                `${b.firstName[0]}${b.lastName[0]}`,
                `${b.firstName} ${b.lastName}`,
                b.email ?? '',
                b.budget,
                firehouse.overdraft
            );
            res.push(firefighter);
        });

        firehouse.admins.getItems().forEach(a => {
            const firefighter = new PayementUserDTO(
                a.id,
                `${a.firstName[0]}${a.lastName[0]}`,
                `${a.firstName} ${a.lastName}`,
                a.email ?? '',
                a.budget,
                firehouse.overdraft
            );
            res.push(firefighter);
        });

        return res;
    }

    public async pay(apiKey: string, dto: PayementReqDTO): Promise<void> {
        const em = Database.getEntityManager();

        await em.transactional(async em => {
            const firehouse = await em.findOne(Firehouse, {
                terminals: { $some: { apiKey: apiKey } }
            }, {
                populate: ['stock', 'stock.beverages']
            });

            if (!firehouse) throw new ApiError(400, "Kon de gekoppelde kazerne niet vinden.");

            const checkFirehouse = await em.findOne(Firehouse, {
                $or: [
                    { admins: { $some: { id: dto.userId } } },
                    { bookkeepers: { $some: { id: dto.userId } } },
                    { leader: { id: dto.userId } },
                    { firefighters: { $some: { id: dto.userId } } }
                ]
            });

            if (!checkFirehouse) throw new ApiError(400, "Deze gebruiker bestaat niet.");
            if (firehouse.id !== checkFirehouse.id) throw new ApiError(400, "Deze gebruiker is niet aan deze kazerne gekoppeld.");

            const user = await em.findOne(User, { id: dto.userId });
            const firefighter = user ? null : await em.findOne(Firefighter, { id: dto.userId });

            if (!user && !firefighter) throw new ApiError(400, "Gebruiker niet gevonden.");

            const customer = user ?? firefighter!;

            const beverages = firehouse.stock.beverages.getItems();
            const requestedBeverages = new Map<string, number>();

            for (const id of dto.beverageIds) {
                requestedBeverages.set(id, (requestedBeverages.get(id) ?? 0) + 1);
            }

            let totalPrice = 0;

            for (const [id, quantity] of requestedBeverages) {
                const beverage = beverages.find(b => b.id === id);

                if (!beverage) throw new ApiError(400, "Een of meerdere dranken zijn niet gevonden.");
                if (beverage.amount < quantity) throw new ApiError(400, `Onvoldoende voorraad voor ${beverage.name}.`);

                totalPrice += beverage.price * quantity;
            }

            totalPrice = Math.round(totalPrice * 100) / 100;

            if (customer.budget < totalPrice) {
                throw new ApiError(400, "Deze gebruiker heeft onvoldoende budget.");
            }

            // Fetch all stampcards with remaining budget, ordered by number
            const stampCards = await em.find(StampCard, {
                ...(user ? { user: user.id } : { firefighter: firefighter!.id }),
                budget: { $gt: 0 }
            }, {
                orderBy: { number: 'ASC' }
            });

            const availableBudget = stampCards.reduce(
                (total, stampCard) => total + Math.round(stampCard.budget * 100),
                0
            );

            if (availableBudget < Math.round(totalPrice * 100)) {
                throw new ApiError(400, "Onvoldoende budget op de drankkaarten.");
            }

            // Deduct the payment from the lowest numbered stampcards first
            let remainingPrice = Math.round(totalPrice * 100);

            for (const stampCard of stampCards) {
                if (remainingPrice <= 0) break;

                const stampCardBudget = Math.round(stampCard.budget * 100);
                const deduction = Math.min(stampCardBudget, remainingPrice);

                stampCard.budget = (stampCardBudget - deduction) / 100;
                remainingPrice -= deduction;
            }

            // Update the customer's total budget
            customer.budget = Math.round((customer.budget - totalPrice) * 100) / 100;

            // Update beverage stock
            for (const [id, quantity] of requestedBeverages) {
                const beverage = beverages.find(b => b.id === id)!;
                beverage.amount -= quantity;
            }

            await em.flush();
        });
    }
}