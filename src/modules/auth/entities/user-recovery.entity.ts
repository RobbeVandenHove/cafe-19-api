import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import User from "./user.entity";
import bcrypt from 'bcrypt';
import ApiError from "../../../utils/api.error";
import { v4 } from "uuid";

@Entity({ tableName: 'user_recoveries' })
export default class UserRecovery extends CustomBaseEntity {

    @Property({ nullable: true, name: 'reset_token' })
    public resetToken?: string;

    @Property({ nullable: true, name: 'reset_token_attempts' })
    public resetTokenAttempts: number = 0;

    @Property({ nullable: true, name: 'reset_token_issued_at' })
    public resetTokenIssuedAt?: Date;

    @Property({ nullable: true, name: 'reset_token_used_at' })
    public resetTokenUsedAt?: Date;

    @ManyToOne(() => User, { nullable: false })
    public user!: User;

    public constructor(user: User) {
        super();
        this.user = user;
    }

    public async generateResetToken(): Promise<string> {
        const token = v4();
        this.resetTokenAttempts = 0;
        this.resetTokenIssuedAt = new Date();
        this.resetTokenUsedAt = undefined;
        this.resetToken = token;
        return token;
    }

    public async verifyResetToken(resetToken: string): Promise<boolean> {
        if (!this.resetToken || !this.resetTokenIssuedAt) return false;

        const tokenAge = Date.now() - this.resetTokenIssuedAt.getTime();
        if (tokenAge > 30 * 60 * 1000) {
            this.resetToken = undefined;
            this.resetTokenIssuedAt = undefined;
            return false;
        }

        this.resetTokenAttempts += 1;
        if (this.resetTokenAttempts > 5) throw new ApiError(429, 'Too many reset token attempts.');

        const isValid = resetToken === this.resetToken;
        if (isValid) {
            this.resetTokenUsedAt = new Date();
            this.resetToken = undefined;
            this.resetTokenIssuedAt = undefined;
        }

        return isValid;
    }
}