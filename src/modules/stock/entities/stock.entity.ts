import { Collection, Entity, OneToMany, OneToOne, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import Beverage from "./beverage.entity";
import Firehouse from "../../firehouse/entities/firehouse.entity";

@Entity({ tableName: 'stock' })
export default class Stock extends CustomBaseEntity {

    @OneToOne(() => Firehouse, firehouse => firehouse.stock)
    public firehouse!: Firehouse;

    @OneToMany(() => Beverage, beverage => beverage.stock, { orphanRemoval: true })
    public beverages = new Collection<Beverage>(this);

    @Property({ type: 'float', default: 0 })
    public inventoryPrice!: number;
}