import ApiError from "../../../utils/api.error";
import Database from "../../../utils/database";
import CreateUserReqDTO from "../../auth/dtos/create-user-req.dto";
import Role from "../../auth/entities/role.entity";
import User from "../../auth/entities/user.entity";
import AuthService from "../../auth/services/auth.service";
import StampCard from "../../stock/entities/stampcard.entity";
import CreateFirefighterReqDTO from "../dtos/create-firefighter-req.dto";
import CreateFirehouseReqDTO from "../dtos/create-firehouse-req.dto";
import FirefighterResDTO from "../dtos/firefighters-res.dto";
import UpdateFirefighterReqDTO from "../dtos/update-firefighter-req.dto";
import UpdateFirehouseDTO from "../dtos/update-firehouse-req.dto";
import UpdateOverdraftPriceReqDTO from "../dtos/update-overdraft-price-req.dto";
import UpdateStampcardPriceReqDTO from "../dtos/update-stampcard-price-req.dto";
import Firefighter from "../entities/firefighter.entity";
import Firehouse from "../entities/firehouse.entity";

export default class FirehouseService {

    public async createFirehouse(dto: CreateFirehouseReqDTO): Promise<Firehouse> {
        const em = Database.getEntityManager();
        const existingFirehouse = await em.findOne(Firehouse, { name: dto.name });
        if (existingFirehouse) throw new ApiError(400, "Deze naam bestaat al. Gelieve een andere naam te kiezen.");
        const admin = await em.findOne(User, { id: dto.adminId }, { populate: ['roles'] });
        if (!admin) throw new ApiError(400, "Gelieve een gebruiker mee te geven als ploegleider.");
        if (!admin.roles.getItems().some(role => role.name === 'client_admin') && admin.email !== process.env.SUPER_ADMIN_USERNAME) throw new ApiError(400, "De gebruiker moet een ploegleider zijn om een kazerne aan te kunnen maken.");
        const firehouse = dto.toFirehouse(admin);
        await em.persist(firehouse).flush();
        return firehouse;
    }

    public async getMyFirehouseDetails(userId: string): Promise<Firehouse> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        }, { populate: ['bookkeepers', 'admins', 'firefighters', 'leader'] });
        if (!firehouse) throw new ApiError(400, "De kazerne kon niet gevonden worden.");
        return firehouse;
    }

    public async updateFirehouse(userId: string, dto: UpdateFirehouseDTO): Promise<Firehouse> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        }, { populate: ['bookkeepers', 'admins', 'firefighters', 'leader'] });
        if (!firehouse) throw new ApiError(400, "De kazerne kon niet gevonden worden.");
        if (dto.name !== firehouse.name) {
            const existsAlready = await em.findOne(Firehouse, { name: dto.name });
            if (existsAlready) throw new ApiError(400, "Er bestaat al een kazerne met deze naam.");
        }
        firehouse.name = dto.name;
        firehouse.address = dto.address;
        await em.flush();
        return firehouse;
    }

    public async getAllFirefighters(userId: string): Promise<FirefighterResDTO[]> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        }, { populate: ['bookkeepers', 'admins', 'firefighters', 'leader'] });
        if (!firehouse) throw new ApiError(400, "De kazerne kon niet gevonden worden.");

        let res: FirefighterResDTO[] = [];
        const u = new FirefighterResDTO(
            firehouse.leader.id,
            `${firehouse.leader.firstName[0]}${firehouse.leader.lastName[0]}`,
            `${firehouse.leader.firstName} ${firehouse.leader.lastName}`,
            firehouse.leader.email ?? '',
            true, false, false
        );
        res.push(u);

        for (let i = 0; i < firehouse.admins.length; i++) {
            const u = new FirefighterResDTO(
                firehouse.admins.getItems()[i].id,
                `${firehouse.admins.getItems()[i].firstName[0]}${firehouse.admins.getItems()[i].lastName[0]}`,
                `${firehouse.admins.getItems()[i].firstName} ${firehouse.admins.getItems()[i].lastName}`,
                firehouse.admins.getItems()[i].email ?? '',
                false, true, false
            );
            res.push(u);
        }

        for (let i = 0; i < firehouse.bookkeepers.length; i++) {
            const u = new FirefighterResDTO(
                firehouse.bookkeepers.getItems()[i].id,
                `${firehouse.bookkeepers.getItems()[i].firstName[0]}${firehouse.bookkeepers.getItems()[i].lastName[0]}`,
                `${firehouse.bookkeepers.getItems()[i].firstName} ${firehouse.bookkeepers.getItems()[i].lastName}`,
                firehouse.bookkeepers.getItems()[i].email ?? '',
                false, false, true
            );
            res.push(u);
        }
        for (let i = 0; i < firehouse.firefighters.length; i++) {
            const u = new FirefighterResDTO(
                firehouse.firefighters.getItems()[i].id,
                `${firehouse.firefighters.getItems()[i].firstName[0]}${firehouse.firefighters.getItems()[i].lastName[0]}`,
                `${firehouse.firefighters.getItems()[i].firstName} ${firehouse.firefighters.getItems()[i].lastName}`,
                firehouse.firefighters.getItems()[i].email,
                false, false, false
            );
            res.push(u);
        }

        return res;
    }

    public async createFirefighter(dto: CreateFirefighterReqDTO, userId: string, stampcards?: StampCard[]): Promise<FirefighterResDTO> {
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        }, { populate: ['bookkeepers', 'admins', 'firefighters', 'leader'] });
        if (!firehouse) throw new ApiError(400, "De kazerne kon niet gevonden worden.");
        const firefighter = dto.toFirefighter(firehouse);
        if (stampcards) {
            stampcards.forEach(c => {
                c.firefighter = firefighter;
                firefighter.stampcards.add(c);
                firefighter.budget += c.budget;
            })
        }
        await em.persist(firefighter).flush();
        const u = new FirefighterResDTO(
            firefighter.id,
            `${firefighter.firstName[0]}${firefighter.lastName[0]}`,
            `${firefighter.firstName} ${firefighter.lastName}`,
            firefighter.email,
            false, false, false
        );
        return u;
    }

    public async updateFirefighter(dto: UpdateFirefighterReqDTO, userId: string): Promise<FirefighterResDTO> {
        const em = Database.getEntityManager();

        return em.transactional(async (tx) => {
            const toUpdateUserFirehouse = await tx.findOne(Firehouse, {
                $or: [
                    { admins: { $some: { id: dto.id } } },
                    { bookkeepers: { $some: { id: dto.id } } },
                    { leader: { id: dto.id } },
                    { firefighters: { $some: { id: dto.id } } }
                ]
            }, { populate: ['admins', 'firefighters', 'bookkeepers', 'leader'] });
            if (!toUpdateUserFirehouse) throw new ApiError(400, "Kan kazerne van de gebruiker niet vinden.");
            const adminFirehouse = await tx.findOne(Firehouse, {
                $or: [
                    { admins: { $some: { id: userId } } },
                    { bookkeepers: { $some: { id: userId } } },
                    { leader: { id: userId } }
                ]
            }, { populate: ['admins', 'firefighters', 'bookkeepers', 'leader'] });
            if (!adminFirehouse) throw new ApiError(400, "Kan kazerne van de gebruiker niet vinden. admin");
            if (toUpdateUserFirehouse.id !== adminFirehouse.id) throw new ApiError(400, "De gebruiker is niet aan jou kazerne gelinkt.");

            const isCurrentUser = await tx.findOne(User, { id: dto.id }, { populate: ['roles', 'mfa', 'recoveries', 'activation', 'stampcards'] });
            const isCurrentFirefighter = await tx.findOne(Firefighter, { id: dto.id }, { populate: ['stampcards'] });
            if (!isCurrentFirefighter && !isCurrentUser) throw new ApiError(400, "Deze gebruiker bestaat niet.");
            const needsRole = dto.additionalRole !== null || undefined ? true : false;

            if (isCurrentUser?.isFirehouseLeader && needsRole) throw new ApiError(400, "Ploegleider kan geen andere rol krijgen.");

            let res: FirefighterResDTO;

            if (isCurrentUser && needsRole) {
                let needRoleChange = true;
                for (let i = 0; i < isCurrentUser.roles.length; i++) {
                    if (isCurrentUser.roles.getItems()[i].name === dto.additionalRole) {
                        needRoleChange = false;
                    }
                }
                if (needRoleChange) {
                    const newRole = await tx.findOne(Role, { name: dto.additionalRole });
                    if (!newRole) throw new ApiError(400, "De naam van de nieuwe rol kon niet worden gevonden.");
                    adminFirehouse.admins.remove(isCurrentUser);
                    adminFirehouse.bookkeepers.remove(isCurrentUser);
                    isCurrentUser.roles.removeAll();
                    isCurrentUser.roles.add(newRole);
                    isCurrentUser.firstName = dto.firstName;
                    isCurrentUser.lastName = dto.lastName;
                    if (dto.email !== isCurrentUser.email) {
                        const existingEmailUser = await tx.findOne(User, { email: dto.email });
                        const existingEmailFirefighter = await tx.findOne(Firefighter, { email: dto.email });
                        if (existingEmailUser || existingEmailFirefighter) throw new ApiError(400, "Dit nieuwe emailadres is al in gebruik.");
                        isCurrentUser.email = dto.email;
                    }
                } else {
                    isCurrentUser.firstName = dto.firstName;
                    isCurrentUser.lastName = dto.lastName;
                    if (dto.email !== isCurrentUser.email) {
                        const existingEmailUser = await tx.findOne(User, { email: dto.email });
                        const existingEmailFirefighter = await tx.findOne(Firefighter, { email: dto.email });
                        if (existingEmailUser || existingEmailFirefighter) throw new ApiError(400, "Dit nieuwe emailadres is al in gebruik.");
                        isCurrentUser.email = dto.email;
                    }
                }
                const isAdmin = dto.additionalRole === 'client_admin';
                const isBookkeeper = dto.additionalRole === 'client_bookkeeper';
                if (isAdmin) {
                    adminFirehouse.admins.add(isCurrentUser);
                } else if (isBookkeeper) {
                    adminFirehouse.bookkeepers.add(isCurrentUser);
                }
                res = new FirefighterResDTO(
                    dto.id,
                    `${dto.firstName[0]}${dto.lastName[0]}`,
                    `${dto.firstName} ${dto.lastName}`,
                    dto.email,
                    false, isAdmin, isBookkeeper
                );
            } else if (isCurrentFirefighter && !needsRole) {
                isCurrentFirefighter.firstName = dto.firstName;
                isCurrentFirefighter.lastName = dto.lastName;
                if (dto.email !== isCurrentFirefighter.email) {
                    const existingEmailUser = await tx.findOne(User, { email: dto.email });
                    const existingEmailFirefighter = await tx.findOne(Firefighter, { email: dto.email });
                    if (existingEmailUser || existingEmailFirefighter) throw new ApiError(400, "Dit nieuwe emailadres is al in gebruik.");
                    isCurrentFirefighter.email = dto.email;
                }
                res = new FirefighterResDTO(
                    dto.id,
                    `${dto.firstName[0]}${dto.lastName[0]}`,
                    `${dto.firstName} ${dto.lastName}`,
                    dto.email,
                    false, false, false
                );
            } else if (isCurrentFirefighter && needsRole) {
                // TODO: Update budget of firefighter + stampcards
                const stampCards = isCurrentFirefighter.stampcards.getItems();
                tx.remove(isCurrentFirefighter);
                const authService = new AuthService();
                const createUserDto = CreateUserReqDTO.toDto(dto.firstName, dto.lastName, dto.email, dto.additionalRole!, true);
                res = await authService.createUser(createUserDto, userId, stampCards);
                tx.remove(isCurrentFirefighter);
                const isAdmin = dto.additionalRole === 'client_admin';
                const isBookkeeper = dto.additionalRole === 'client_bookkeeper';
                res = new FirefighterResDTO(
                    res.id,
                    `${dto.firstName[0]}${dto.lastName[0]}`,
                    `${dto.firstName} ${dto.lastName}`,
                    dto.email,
                    false, isAdmin, isBookkeeper
                );

            } else if (isCurrentUser && !needsRole) {
                // TODO: Update budget of user + stampcards
                const stampcards = isCurrentUser.stampcards.getItems();
                if (isCurrentUser.roles[0].name === 'client_admin') {
                    adminFirehouse.admins.remove(isCurrentUser);
                } else if (isCurrentUser.roles[0].name === 'client_bookkeeper') {
                    adminFirehouse.bookkeepers.remove(isCurrentUser);
                }
                if (isCurrentUser.activation) {
                    tx.remove(isCurrentUser.activation);
                }
                isCurrentUser.recoveries.removeAll();
                if (isCurrentUser.mfa) {
                    tx.remove(isCurrentUser.mfa);
                }
                tx.remove(isCurrentUser);
                const newFirefighterDto = CreateFirefighterReqDTO.toDto(dto.firstName, dto.lastName, dto.email);
                res = await this.createFirefighter(newFirefighterDto, userId, stampcards);
            }

            await tx.flush();
            return res!;
        });
    }

    public async deleteFirefighter(id: string, userId: string): Promise<void> {
        const em = Database.getEntityManager();

        await em.transactional(async (tx) => {
            const adminFirehouse = await tx.findOne(Firehouse, {
                $or: [
                    { admins: { $some: { id: userId } } },
                    { bookkeepers: { $some: { id: userId } } },
                    { leader: { id: userId } }
                ]
            });

            const toDeleteUserFirehouse = await tx.findOne(Firehouse, {
                $or: [
                    { admins: { $some: { id } } },
                    { bookkeepers: { $some: { id } } },
                    { leader: { id } },
                    { firefighters: { $some: { id } } }
                ]
            });

            if (!adminFirehouse) throw new ApiError(400, "We hebben uw kazerne niet gevonden.");
            if (!toDeleteUserFirehouse) throw new ApiError(400, "We konden de kazerne van de persoon die verwijderd moet worden niet vinden.");
            if (adminFirehouse.id !== toDeleteUserFirehouse.id) throw new ApiError(400, "Je kunt geen gebruikers van een andere kazerne verwijderen.");

            const userToDelete = await tx.findOne(User, { id }, {
                populate: ['mfa', 'recoveries', 'activation', 'stampcards']
            });

            const firefighterToDelete = await tx.findOne(Firefighter, { id }, {
                populate: ['stampcards']
            });

            if (userToDelete) {
                if (userToDelete.mfa) tx.remove(userToDelete.mfa);
                if (userToDelete.activation) tx.remove(userToDelete.activation);

                userToDelete.recoveries.removeAll();

                for (const stampcard of [...userToDelete.stampcards.getItems()]) {
                    tx.remove(stampcard);
                }

                tx.remove(userToDelete);
            } else if (firefighterToDelete) {
                for (const stampcard of [...firefighterToDelete.stampcards.getItems()]) {
                    tx.remove(stampcard);
                }

                tx.remove(firefighterToDelete);
            } else {
                throw new ApiError(404, "Deze gebruiker bestaat niet.");
            }

            await tx.flush();
        });
    }

    public async updateStampcardPrice(dto: UpdateStampcardPriceReqDTO, userId: string): Promise<number> {
        if (dto.stampCardPrice < 0) throw new ApiError(400, 'Gelieve een geldige prijs in te geven.');
        if (dto.stampCardPrice > 100) throw new ApiError(400, 'De maximale prijs voor een drankkaart is €100.');
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        });
        if (!firehouse) throw new ApiError(400, "We hebben uw kazerne niet gevonden.");
        firehouse.stampCardPrice = dto.stampCardPrice;
        await em.flush();
        return dto.stampCardPrice;
    }

    public async updateOverdraftPrice(dto: UpdateOverdraftPriceReqDTO, userId: string): Promise<number> {
        if (dto.overdraft > 0) throw new ApiError(400, 'Gelieve een geldige prijs in te geven.');
        if (dto.overdraft < -20) throw new ApiError(400, 'Een vrijwilliger kan maximaal €20 op de pof.');
        const em = Database.getEntityManager();
        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        });
        if (!firehouse) throw new ApiError(400, "We hebben uw kazerne niet gevonden.");
        if (dto.overdraft !== 0) firehouse.overdraftEnabled = true;
        else firehouse.overdraftEnabled = false;
        firehouse.overdraft = dto.overdraft;
        await em.flush();
        return dto.overdraft;
    }
}