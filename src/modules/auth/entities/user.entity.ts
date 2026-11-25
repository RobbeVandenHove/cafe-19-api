
import { Collection, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import Role from "./role.entity";
import UserRecovery from "./user-recovery.entity";
import UserActivation from "./user-activation.entity";
import UserMfa from "./user-mfa.entity";
import Firehouse from "../../firehouse/entities/firehouse.entity";
import ISpendable from "../../stock/interfaces/spendable.interface";
import StampCard from "../../stock/entities/stampcard.entity";

@Entity({ tableName: 'users' })
export default class User extends CustomBaseEntity implements ISpendable {

    @Property({ nullable: false, name: 'first_name' })
    public firstName!: string;

    @Property({ nullable: false, name: 'last_name' })
    public lastName!: string;

    @Property({ nullable: true, name: 'email' })
    public email?: string;

    @Property({ nullable: true, name: 'password', hidden: true })
    public password?: string;

    @Property({ nullable: false, name: 'is_active', hidden: true })
    public isActive!: boolean;

    @Property({ nullable: true, name: 'refresh_token', hidden: true })
    public refreshToken?: string;

    @Property({ nullable: false, default: 0, name: 'failed_login_attempts', hidden: true })
    public failedLoginAttempts = 0;

    @Property({ nullable: true, name: 'blocked_until', hidden: true })
    public blockedUntil?: Date;

    @OneToMany(() => StampCard, stampcard => stampcard.user)
    public stampcards = new Collection<StampCard>(this);

    @Property({ nullable: false, default: 0, type: 'float' })
    public budget = 0;

    @ManyToMany(() => Role, role => role.users, {
        owner: true,
        pivotTable: 'user_roles',
        joinColumn: 'fk_user_id',
        inverseJoinColumn: 'fk_role_id'
    })
    public roles = new Collection<Role>(this);

    @OneToMany(() => UserRecovery, recovery => recovery.user, {
        joinColumn: 'fk_user_id',
        hidden: true
    })
    public recoveries = new Collection<UserRecovery>(this);

    @OneToOne(() => UserActivation, activation => activation.user, { hidden: true })
    public activation?: UserActivation;

    @OneToOne(() => UserMfa, mfa => mfa.user, { hidden: true })
    public mfa?: UserMfa;

    @ManyToOne(() => Firehouse, {
        nullable: true,
        fieldName: 'fk_firehouse_id'
    })
    public adminFirehouse?: Firehouse;

    @Property({ default: false, nullable: false })
    public isFirehouseLeader: boolean = false;

    public constructor(firstName: string, lastName: string) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.isActive = false;
    }
}
