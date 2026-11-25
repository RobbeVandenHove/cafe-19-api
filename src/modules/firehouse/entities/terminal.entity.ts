import { Entity, ManyToOne, Property, Unique } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import Firehouse from "./firehouse.entity";

@Entity({ tableName: 'terminals' })
@Unique({ properties: ['firehouse', 'number'] })
export default class Terminal extends CustomBaseEntity {

    @Property({ nullable: false })
    public number!: number;

    @Property({ nullable: false })
    public name!: string;

    @Property({ nullable: false })
    public device!: string;

    @Property({ nullable: false, unique: true })
    public apiKey!: string;

    @Property({ nullable: false, default: false })
    public coupled = false;

    @ManyToOne(() => Firehouse, { nullable: false })
    public firehouse!: Firehouse;

    public constructor(number: number, name: string, device: string, apiKey: string, firehouse: Firehouse) {
        super();
        this.number = number;
        this.name = name;
        this.device = device;
        this.apiKey = apiKey;
        this.firehouse = firehouse;
    }
}