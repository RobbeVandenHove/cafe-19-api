import { Collection, Entity, ManyToOne, OneToMany, Property, Unique } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import Firehouse from "./firehouse.entity";
import ISpendable from "../../stock/interfaces/spendable.interface";
import StampCard from "../../stock/entities/stampcard.entity";

@Entity({ tableName: 'firefighters' })
@Unique({ properties: ['firehouse', 'email'] })
export default class Firefighter extends CustomBaseEntity implements ISpendable {

    @Property({ nullable: false })
    public firstName: string;

    @Property({ nullable: false })
    public lastName: string;

    @Property({ nullable: false })
    public email: string;

    @ManyToOne(() => Firehouse, { nullable: false })
    public firehouse!: Firehouse;

    @OneToMany(() => StampCard, stampcard => stampcard.firefighter)
    public stampcards = new Collection<StampCard>(this);

    @Property({ nullable: false, default: 0, type: 'float' })
    public budget = 0;

    public constructor(firstName: string, lastName: string, email: string, firehouse: Firehouse) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.firehouse = firehouse;
        this.budget = 0;
    }
}