import { Entity, OneToOne, Property } from "@mikro-orm/core";
import CustomBaseEntity from "../../../utils/custom-base-entity";
import User from "./user.entity";
import bcrypt from "bcrypt";
import ApiError from "../../../utils/api.error";

@Entity({ tableName: 'user_activations' })
export default class UserActivation extends CustomBaseEntity {
    @Property({ nullable: true, name: 'otp' })
    public otp?: string;

    @Property({ nullable: false, name: 'otp_attempt_count' })
    public otpAttemptCount: number = 0;

    @Property({ nullable: true, name: 'otp_issued_at' })
    public otpIssuedAt?: Date;

    @Property({ nullable: true, name: 'otp_used_at' })
    public otpUsedAt?: Date;

    @Property({ nullable: false, name: 'activation_attempt_count' })
    public activationAttemptCount: number = 0;

    @Property({ nullable: true, name: 'activation_token' })
    public activationToken?: string;

    @Property({ nullable: true, name: 'activation_token_expires_at' })
    public activationTokenExpiresAt?: Date;

    @OneToOne(() => User, { owner: true, nullable: false })
    public user!: User;

    public constructor(user: User) {
        super();
        this.user = user;
    }

    public async generateOtp(): Promise<string> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.otp = await bcrypt.hash(otp, 12);
        this.otpIssuedAt = new Date();
        this.otpAttemptCount = 0;
        this.activationAttemptCount = 0;
        this.activationToken = undefined;
        this.activationTokenExpiresAt = undefined;
        return otp;
    }

    public async verifyOtp(otp: string): Promise<string | boolean> {
        if (!this.otp) return false;
        this.otpAttemptCount += 1;
        if (this.otpAttemptCount > 5) throw new ApiError(429, 'Too many OTP attempts.');
        const isValid = await bcrypt.compare(otp, this.otp);
        let newToken = "";
        if (isValid) {
            this.otpUsedAt = new Date();
            this.otp = undefined;
            newToken = Math.floor(100000 + Math.random() * 900000).toString();
            this.activationToken = await bcrypt.hash(newToken, 12);
            this.activationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        }
        return newToken;
    }

    public async verifyActivationToken(token: string): Promise<boolean> {
        if (!this.activationToken || !this.activationTokenExpiresAt) return false;
        if (new Date() > this.activationTokenExpiresAt) return false;
        this.activationAttemptCount += 1;
        if (this.activationAttemptCount > 5) throw new ApiError(429, 'Too many activation token attempts.');
        const isValid = await bcrypt.compare(token, this.activationToken);
        if (isValid) {
            this.activationToken = undefined;
            this.activationTokenExpiresAt = undefined;
        }
        return isValid;
    }
}