
import { generateSecret, generateURI, verify } from "otplib";
import ApiError from "../../../utils/api.error";
import Database from "../../../utils/database";
import User from "../entities/user.entity";
import UserMfa from "../entities/user-mfa.entity";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Firehouse from "../../firehouse/entities/firehouse.entity";
import { Response } from "express";

export default class MfaService {

    public async setupMfaForUser(userId: string): Promise<{ qrCode: string, secret: string }> {
        const em = Database.getEntityManager();
        const user = await em.findOne(User, { id: userId }, { populate: ['mfa'] });

        if (!user) throw new ApiError(404, 'Gebruiker is niet gevonden.');
        if (user.mfa?.enabled) throw new ApiError(409, 'MFA is al geactiveerd voor deze gebruiker.');

        const secret = generateSecret();
        const uri = generateURI({ issuer: "Café 38", label: user.email!, secret });
        const qrCode = await QRCode.toDataURL(uri);

        if (user.mfa) {
            user.mfa.secret = secret;
            user.mfa.type = 'TOTP';
        } else {
            em.persist(new UserMfa(user, secret, false, 'TOTP'));
        }

        await em.flush();

        return { qrCode, secret };
    }

    public async verifyMfa(userId: string, code: string): Promise<void> {
        const em = Database.getEntityManager();
        const mfa = await em.findOne(UserMfa, { user: userId });

        if (!mfa) throw new ApiError(404, "MFA activatie was niet gevonden.");
        if (mfa.enabled) throw new ApiError(409, "MFA is al geactiveerd voor deze gebruiker.");

        const result = await verify({ secret: mfa.secret, token: code, epochTolerance: 30 });

        if (!result.valid) throw new ApiError(400, "Ongeldige MFA verificatie code.");

        mfa.enabled = true;
        mfa.enabledAt = new Date();

        await em.flush();
    }

    public async verifyMfaLogin(
        userId: string,
        code: string,
        res: Response
    ): Promise<{ token: string, refreshToken: string }> {
        const em = Database.getEntityManager();

        const user = await em.findOne(
            User,
            { id: userId },
            { populate: ['roles', 'mfa'] }
        );

        if (!user || !user.mfa?.enabled) {
            throw new ApiError(401, 'Ongeldige MFA verificatie.');
        }

        if (user.blockedUntil && user.blockedUntil > new Date()) {
            throw new ApiError(429, 'U heeft te vaak geprobeerd. Probeer later opnieuw.');
        }

        const result = await verify({
            secret: user.mfa.secret,
            token: code,
            epochTolerance: 30
        });

        if (!result.valid) {
            user.failedLoginAttempts += 1;

            if (user.failedLoginAttempts > 5) {
                let blockDuration: number;

                if (user.failedLoginAttempts <= 9) {
                    blockDuration = 30 * 1000;
                } else if (user.failedLoginAttempts <= 14) {
                    blockDuration = 60 * 1000;
                } else if (user.failedLoginAttempts <= 19) {
                    blockDuration = 2 * 60 * 1000;
                } else {
                    blockDuration = 5 * 60 * 1000;
                }

                user.blockedUntil = new Date(Date.now() + blockDuration);
            }

            await em.flush();

            throw new ApiError(401, 'Ongeldige MFA verificatie.');
        }

        user.failedLoginAttempts = 0;
        user.blockedUntil = undefined;


        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        );
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '30d' }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        user.refreshToken = await bcrypt.hash(refreshToken, 12);

        const firehouse = await em.findOne(Firehouse, {
            $or: [
                { admins: { $some: { id: userId } } },
                { bookkeepers: { $some: { id: userId } } },
                { leader: { id: userId } }
            ]
        }, { populate: ['bookkeepers', 'admins', 'firefighters', 'leader'] });
        if (!firehouse) throw new ApiError(301, "Koppel een kazerne aan je account");

        await em.flush();

        return { token, refreshToken };
    }
}
