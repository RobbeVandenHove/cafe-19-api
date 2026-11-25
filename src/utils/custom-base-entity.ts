import { PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";

export default abstract class CustomBaseEntity {
    @PrimaryKey({ type: 'uuid' })
    public id: string = v4();

    @Property({ hidden: true })
    public createdAt = new Date();

    @Property({ onUpdate: () => new Date(), hidden: true })
    public updatedAt = new Date();
}
