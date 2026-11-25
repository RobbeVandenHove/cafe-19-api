import ApiError from "../../../utils/api.error";
import Database from "../../../utils/database";
import User from "../../auth/entities/user.entity";
import Firefighter from "../../firehouse/entities/firefighter.entity";
import Firehouse from "../../firehouse/entities/firehouse.entity";
import UserStampcardHistoryListResDTO from "../dtos/user-stampcard-history-list-res.dto";
import UserStampcardListResDTO from "../dtos/user-stampcard-list-res.dto";
import StampCard from "../entities/stampcard.entity";

export default class StampcardService {

    public async getListedStampcards(userId: string): Promise<UserStampcardListResDTO[]> {
        const myFirehouse = await this.getFirehouse(userId);

        const spendables = [
            ...myFirehouse.admins.getItems(),
            ...myFirehouse.bookkeepers.getItems(),
            ...(myFirehouse.leader ? [myFirehouse.leader] : []),
            ...myFirehouse.firefighters.getItems()
        ];

        const uniqueSpendables = [...new Map(
            spendables.map(spendable => [spendable.id, spendable])
        ).values()];

        return uniqueSpendables
            .map(spendable => new UserStampcardListResDTO(
                spendable.id,
                `${spendable.firstName} ${spendable.lastName}`,
                spendable.email ?? '',
                spendable.budget,
                spendable.stampcards.getItems().sort((a, b) => b.number - a.number).map(stampcard =>
                    new UserStampcardHistoryListResDTO(
                        stampcard.id,
                        stampcard.number,
                        stampcard.createdAt,
                        stampcard.isPaid,
                        stampcard.budget,
                        stampcard.price
                    )
                )
            ));
    }

    public async createStampcard(userId: string, id: string): Promise<StampCard> {
        const em = Database.getEntityManager();
        const myFirehouse = await this.getFirehouse(userId);
        const userFirehouse = await this.getFirehouse(id);
        if (myFirehouse.id !== userFirehouse.id) throw new ApiError(400, 'Je kunt enkel drankkaarten aanmaken voor je eigen vrijwilligers.');
        return em.transactional(async (tx) => {
            const isCurrentUser = await tx.findOne(User, { id: id }, { populate: ['stampcards'] });
            const isCurrentFirefighter = await tx.findOne(Firefighter, { id: id }, { populate: ['stampcards'] });
            if (!isCurrentFirefighter && !isCurrentUser) throw new ApiError(400, "Deze gebruiker bestaat niet.");
            if (isCurrentUser) {
                const newCardNumber = isCurrentUser.stampcards.count() + 1;
                const stampcard = new StampCard(newCardNumber, userFirehouse.stampCardPrice, userFirehouse.stampCardPrice, isCurrentUser, undefined);
                isCurrentUser.stampcards.add(stampcard);
                isCurrentUser.budget += userFirehouse.stampCardPrice;
                await tx.persist(stampcard).flush();
                return stampcard;
            }
            if (isCurrentFirefighter) {
                const newCardNumber = isCurrentFirefighter.stampcards.count() + 1;
                const stampcard = new StampCard(newCardNumber, userFirehouse.stampCardPrice, userFirehouse.stampCardPrice, undefined, isCurrentFirefighter);
                isCurrentFirefighter.stampcards.add(stampcard);
                isCurrentFirefighter.budget += userFirehouse.stampCardPrice;
                await tx.persist(stampcard).flush();
                return stampcard;
            }
            throw new ApiError(400, 'Er is iets fout gegaan.');
        })
    }

    public async setPaid(userId: string, stampcardId: string): Promise<void> {
        const em = Database.getEntityManager();
        const myFirehouse = await this.getFirehouse(userId);

        const stampcard = await em.findOne(StampCard, {
            id: stampcardId
        }, {
            populate: ['user', 'firefighter']
        });

        if (!stampcard) throw new ApiError(404, 'Deze drankkaart bestaat niet.');

        const belongsToFirehouse = [
            ...myFirehouse.admins.getItems(),
            ...myFirehouse.bookkeepers.getItems(),
            ...(myFirehouse.leader ? [myFirehouse.leader] : []),
            ...myFirehouse.firefighters.getItems()
        ].some(member =>
            member.id === stampcard.user?.id ||
            member.id === stampcard.firefighter?.id
        );

        if (!belongsToFirehouse) {
            throw new ApiError(400, 'Deze drankkaart behoort niet tot je eigen kazerne.');
        }

        stampcard.isPaid = true;
        await em.flush();
    }


    private async getFirehouse(userId: string): Promise<Firehouse> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } },
                { firefighters: { $some: { id: userId } } }
            ]
        }, { populate: ['admins', 'bookkeepers', 'leader', 'firefighters', 'admins.stampcards', 'bookkeepers.stampcards', 'leader.stampcards', 'firefighters.stampcards'] });
        if (!firehouse) throw new ApiError(400, "We kunnen je kazerne niet vinden.");
        return firehouse;
    }
}