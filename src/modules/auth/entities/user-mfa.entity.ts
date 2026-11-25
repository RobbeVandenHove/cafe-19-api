import { Entity, OneToOne, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import User from "./user.entity";

@Entity({ tableName: 'user_mfas' })
export default class UserMfa extends CustomBaseEntity {

    @Property()
    public type!: string;

    @Property({ hidden: true })
    public secret!: string;

    @Property({ default: false })
    public enabled: boolean = false;

    @Property({ nullable: true })
    public enabledAt?: Date;

    @OneToOne(() => User, { owner: true, nullable: false })
    public user!: User;

    public constructor(user: User, secret: string, enabled: boolean, type: string) {
        super();
        this.user = user;
        this.enabled = enabled;
        this.secret = secret;
        this.type = type;
    }
}