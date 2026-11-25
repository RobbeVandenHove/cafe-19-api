
import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import Firefighter from "../../firehouse/entities/firefighter.entity";
import User from "../../auth/entities/user.entity";

@Entity({ tableName: 'stampcards' })
export default class StampCard extends CustomBaseEntity {

    @Property()
    public number!: number;

    @Property({ type: 'float' })
    public budget!: number;

    @Property({ default: false })
    public isPaid = false;

    @Property({ type: 'float' })
    public price!: number;

    @ManyToOne(() => User, { nullable: true })
    public user?: User;

    @ManyToOne(() => Firefighter, { nullable: true })
    public firefighter?: Firefighter;

    public constructor(number: number, budget: number, price: number, user?: User, firefighter?: Firefighter) {
        super();
        this.number = number;
        this.budget = budget;
        this.price = price;
        this.user = user;
        this.firefighter = firefighter;
    }
}
