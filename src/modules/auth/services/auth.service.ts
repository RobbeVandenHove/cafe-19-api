import ApiError from "../../../utils/api.error";
import Database from "../../../utils/database";
import CreateUserReqDTO from "../dtos/create-user-req.dto";
import LoginReqDTO from "../dtos/login-req.dto";
import User from "../entities/user.entity";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Role from "../entities/role.entity";
import UserActivation from "../entities/user-activation.entity";
import MailerService from "./mail.service";
import { generateVerificationEmail } from "../templates/otp.template";
import AcceptOtpReqDTO from "../dtos/accept-otp-req.dto";
import CreatePwdReqDTO from "../dtos/create-pwd-req.dto";
import UserRecovery from "../entities/user-recovery.entity";
import { generateResetEmail } from "../templates/reset.template";
import ResetPwdReqDTO from "../dtos/reset-pwd-req.dto";
import AuthMeRes from "../dtos/auth-me-res.dto";
import Firehouse from "../../firehouse/entities/firehouse.entity";
import FirefighterResDTO from "../../firehouse/dtos/firefighters-res.dto";
import StampCard from "../../stock/entities/stampcard.entity";

export default class AuthService {
    private mailerService = new MailerService();

    public async validateLoginAttempt(loginDTO: LoginReqDTO): Promise<{
        status: 'MFA_SETUP_REQUIRED' | 'MFA_VERIFICATION_REQUIRED';
        userId: string;
    }> {
        const em = Database.getEntityManager();

        const user = await em.findOne(
            User,
            { email: loginDTO.email },
            { populate: ['roles', 'mfa'] }
        );

        if (!user) {
            throw new ApiError(401, 'Ongeldig emailadres of wachtwoord.');
        }

        if (user.blockedUntil && user.blockedUntil > new Date()) {
            throw new ApiError(429, 'U heeft te vaak geprobeerd. Probeer later opnieuw.');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDTO.password,
            user.password || ''
        );

        if (!isPasswordValid) {
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

            throw new ApiError(401, 'Ongeldig emailadres of wachtwoord.');
        }

        user.failedLoginAttempts = 0;
        user.blockedUntil = undefined;

        await em.flush();

        if (!user.mfa?.enabled) {
            return {
                status: 'MFA_SETUP_REQUIRED',
                userId: user.id
            };
        }

        return {
            status: 'MFA_VERIFICATION_REQUIRED',
            userId: user.id
        };
    }

    public async refreshAccessToken(userId: string, oldRefreshToken: string): Promise<{ token: string, refreshToken: string }> {
        const em = Database.getEntityManager();
        const user = await em.findOne(User, { id: userId });
        if (!user) throw new ApiError(404, 'User not found');
        const isRefreshTokenValid = user && user.refreshToken ? await bcrypt.compare(oldRefreshToken, user.refreshToken) : false;
        if (!isRefreshTokenValid) throw new ApiError(401, 'Invalid refresh token');
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "30d" });
        user.refreshToken = await bcrypt.hash(refreshToken, 12);

        await em.flush();

        return { token, refreshToken };
    }

    public async createUser(createUserDTO: CreateUserReqDTO, userId: string, stampCards?: StampCard[]): Promise<FirefighterResDTO> {
        const em = Database.getEntityManager();
        const email = createUserDTO.email.trim().toLowerCase();

        try {
            const { user, activation, otp } = await em.transactional(async (tx) => {
                const existingUser = await tx.findOne(User, { email });
                if (existingUser) throw new ApiError(409, "Er bestaat al een gebruiker met dit emailadres.");
                const role = await tx.findOne(Role, { name: createUserDTO.role });
                if (!role) throw new ApiError(404, "Rol niet gevonden.");

                const user = new User(createUserDTO.firstName, createUserDTO.lastName);
                user.email = email;
                user.roles.add(role);
                if (stampCards) {
                    stampCards.forEach(c => {
                        c.user = user;
                        user.stampcards.add(c);
                        user.budget += c.budget;
                    });
                }
                if (createUserDTO.hasExistingFirehouse) {
                    const firehouse = await em.findOne(Firehouse, {
                        $or: [
                            { admins: { $some: { id: userId } } },
                            { bookkeepers: { $some: { id: userId } } },
                            { leader: { id: userId } }
                        ]
                    }, { populate: ['bookkeepers', 'admins', 'firefighters', 'leader'] });
                    if (!firehouse) throw new ApiError(400, "De kazerne kon niet gevonden worden.");
                    if (createUserDTO.role === 'client_bookkeeper') {
                        firehouse.bookkeepers.add(user);
                    } else if (createUserDTO.role === 'client_admin') {
                        firehouse.admins.add(user);
                    }
                } else {
                    user.isFirehouseLeader = true;
                }

                const activation = new UserActivation(user);
                const otp = await activation.generateOtp();

                tx.persist([user, activation]);

                return { user, activation, otp };
            });

            await this.mailerService.sendEmail(
                email,
                "Account aangemaakt bij café 38",
                generateVerificationEmail(
                    otp,
                    `${process.env.FRONTEND_URL}/auth/otp-login?token=${user.id}`,
                ),
            );

            const isLeader = createUserDTO.hasExistingFirehouse === false ? true : false;
            let isAdmin = false;
            if (createUserDTO.hasExistingFirehouse === false && createUserDTO.role === 'client_admin') {
                isAdmin = true;
            }
            const isBookkeeper = createUserDTO.role === 'client_bookkeeper';

            const u = new FirefighterResDTO(
                user.id,
                `${user.firstName[0]}${user.lastName[0]}`,
                `${user.firstName} ${user.lastName}`,
                user.email ?? '',
                isLeader, isAdmin, isBookkeeper
            );
            return u;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw error;
        }
    }

    public async acceptOtp(acceptOtpDTO: AcceptOtpReqDTO): Promise<string> {
        const em = Database.getEntityManager();
        const user = await em.findOne(User, { id: acceptOtpDTO.userId }, { populate: ['activation'] });
        if (!user) throw new ApiError(404, 'Gebruiker niet gevonden.');
        if (!user.activation) throw new ApiError(400, 'Gebruiker activatie niet gevonden.');

        const isOtpValid = await user.activation.verifyOtp(acceptOtpDTO.otp);
        if (!isOtpValid) throw new ApiError(401, 'Ongeldige OTP.');

        user.isActive = true;
        await em.flush();
        return isOtpValid as string;
    }

    public async createPassword(createPwdDTO: CreatePwdReqDTO): Promise<void> {
        const em = Database.getEntityManager();
        const user = await em.findOne(User, { id: createPwdDTO.userId }, { populate: ['activation'] });
        if (!user) throw new ApiError(404, 'User not found');
        if (!user.activation) throw new ApiError(400, 'Gebruiker activatie niet gevonden');

        const isTokenValid = await user.activation.verifyActivationToken(createPwdDTO.token);
        if (!isTokenValid) throw new ApiError(401, 'Activatiecode is ongeldig of is verlopen.');

        user.password = await bcrypt.hash(createPwdDTO.password, 12);
        await em.flush();
    }

    public async resendOtp(userId: string): Promise<void> {
        const em = Database.getEntityManager();
        const user = await em.findOne(User, { id: userId }, { populate: ['activation'] });
        if (!user) throw new ApiError(404, 'User not found');
        if (!user.activation) throw new ApiError(400, 'Gebruiker is niet gevonden.');
        if (user.activation.otpUsedAt) throw new ApiError(400, 'Gebruiker is al geactiveerd.');

        const otp = await user.activation.generateOtp();
        await em.flush();

        await this.mailerService.sendEmail(
            user.email!,
            "Nieuw OTP voor accountactivatie",
            generateVerificationEmail(
                otp,
                `${process.env.FRONTEND_URL}/auth/otp-login?token=${user.id}`,
            ),
        );
    }

    public async createRecovery(email: string): Promise<void> {
        const em = Database.getEntityManager();

        const user = await em.findOne(User, { email });
        if (!user) throw new ApiError(200, 'Als er een account bestaat is er een email verstuurd.');

        const recovery = new UserRecovery(user);
        const resetToken = await recovery.generateResetToken();

        user.recoveries.add(recovery);

        await em.persist(user).flush();

        await this.mailerService.sendEmail(
            user.email!,
            'Reset je wachtwoord bij Café 38',
            generateResetEmail(
                `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`,
            ),
        );
    }

    public async finishRecovery(resetDto: ResetPwdReqDTO): Promise<boolean> {
        const em = Database.getEntityManager();
        const recovery = await em.findOne(UserRecovery, { resetToken: resetDto.resetToken }, { populate: ['user'] });
        if (!recovery) throw new ApiError(404, 'Recovery not found');
        if (await recovery.verifyResetToken(resetDto.resetToken)) {
            recovery.user.password = await bcrypt.hash(resetDto.password, 12);
            await em.flush();
            return true;
        }
        return false;
    }

    public async getCurrentUser(userId: string): Promise<AuthMeRes> {
        const em = Database.getEntityManager();
        const user = await em.findOne(User, { id: userId }, { populate: ['roles'] });
        if (!user) throw new ApiError(400, 'Gebruiker is niet gevonden');
        const res = new AuthMeRes(user.firstName, user.lastName, user.email ?? '', user.roles.getItems());
        return res;
    }
}