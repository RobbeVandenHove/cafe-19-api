
import { Collection, Entity, ManyToMany, OneToMany, OneToOne, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import User from "../../auth/entities/user.entity";
import Terminal from "./terminal.entity";
import Firefighter from "./firefighter.entity";
import Stock from "../../stock/entities/stock.entity";

@Entity({ tableName: 'firehouses' })
export default class Firehouse extends CustomBaseEntity {

    @Property({ nullable: false })
    public name!: string;

    @Property({ nullable: false })
    public address!: string;

    @Property({ type: 'float', default: 35 })
    public stampCardPrice!: number;

    @Property({ type: 'float', default: 0 })
    public overdraft!: number;

    @Property({ default: false })
    public overdraftEnabled!: boolean;

    @OneToOne(() => User, { nullable: false })
    public leader!: User;

    @OneToMany(() => User, user => user.adminFirehouse)
    public admins = new Collection<User>(this);

    @ManyToMany(() => User)
    public bookkeepers = new Collection<User>(this);

    @OneToMany(() => Terminal, terminal => terminal.firehouse)
    public terminals = new Collection<Terminal>(this);

    @OneToMany(() => Firefighter, firefighter => firefighter.firehouse)
    public firefighters = new Collection<Firefighter>(this);

    @OneToOne(() => Stock, { nullable: false })
    public stock!: Stock;

    public constructor(name: string, address: string, admin: User) {
        super();
        this.name = name;
        this.address = address;
        this.stampCardPrice = 35;
        this.overdraft = 0;
        this.overdraftEnabled = false;
        this.leader = admin;
        this.stock = new Stock();
    }
}
