import { Collection, Entity, ManyToMany, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import User from "./user.entity";

@Entity({ tableName: 'roles' })
export default class Role extends CustomBaseEntity {

    @Property({ nullable: false })
    public name!: string;

    @ManyToMany(() => User, user => user.roles)
    public users = new Collection<User>(this);

    public constructor(name: string) {
        super();
        this.name = name;
    }
}