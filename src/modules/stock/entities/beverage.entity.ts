import { Entity, ManyToOne, Property, Enum } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import Stock from "./stock.entity";
import BeverageType from "../enums/beverage-type.enum";

@Entity({ tableName: 'beverages' })
export default class Beverage extends CustomBaseEntity {

    @Property({ nullable: false })
    public name!: string;

    @ManyToOne(() => Stock, { nullable: false })
    public stock!: Stock;

    @Enum(() => BeverageType)
    public type!: BeverageType;

    @Property({ type: 'float', default: 0 })
    public price!: number;

    @Property({ type: 'integer', default: 0 })
    public amount!: number;

    public constructor(name: string, stock: Stock, type: BeverageType, price: number, amount: number) {
        super();
        this.name = name;
        this.stock = stock;
        this.type = type;
        this.price = price;
        this.amount = amount;
    }
}