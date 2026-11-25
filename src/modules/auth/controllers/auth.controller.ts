import { Router, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import AbstractRouter from "../../../utils/abstract-router";
import asyncHandler from "../../../utils/async-handler";
import { validateDTO } from "../../../utils/dto.validator";
import AuthService from "../services/auth.service";
import MfaService from "../services/mfa.service";
import LoginReqDTO from "../dtos/login-req.dto";
import VerifyMfaReqDTO from "../dtos/verify-mfa-req.dto";
import authentication from "../../../middlewares/authentication.middleware";
import CreateUserReqDTO from "../dtos/create-user-req.dto";
import AcceptOtpReqDTO from "../dtos/accept-otp-req.dto";
import CreatePwdReqDTO from "../dtos/create-pwd-req.dto";
import ResetPwdReqDTO from "../dtos/reset-pwd-req.dto";

export default class AuthController extends AbstractRouter {
    private authService = new AuthService();
    private mfaService = new MfaService();

    public registerRoutes(): Router {
        const router = Router();

        router.post('/login', validateDTO(LoginReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const loginDTO = plainToInstance(LoginReqDTO, rawData);
            const { status, userId } = await this.authService.validateLoginAttempt(loginDTO);

            if (status === 'MFA_SETUP_REQUIRED') {
                return res.status(200).json({ requiresMfaSetup: true, message: 'MFA setup is verplicht.', userId });
            }

            return res.status(200).json({ requiresMfaVerification: true, message: 'MFA verification is verplicht.', userId });
        }));

        router.post('/mfa/setup', asyncHandler(async (req: Request, res: Response) => {
            const userId = req.body.data.userId;
            const result = await this.mfaService.setupMfaForUser(userId);

            return res.status(200).json({
                message: "Scan the QR code with your authenticator app.",
                qrCode: result.qrCode
            });
        }));

        router.post('/mfa/verify-setup', validateDTO(VerifyMfaReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const verifyMfaDTO = plainToInstance(VerifyMfaReqDTO, rawData);

            await this.mfaService.verifyMfa(verifyMfaDTO.userId, verifyMfaDTO.code);

            return res.status(200).json({ message: 'MFA code is geverifieerd.' });
        }));

        router.post('/mfa/verify', validateDTO(VerifyMfaReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const verifyMfaDTO = plainToInstance(VerifyMfaReqDTO, rawData);
            const { token, refreshToken } = await this.mfaService.verifyMfaLogin(verifyMfaDTO.userId, verifyMfaDTO.code, res);
            return res.status(200).json({ message: "Succesvol ingelogd." });
        }));

        router.post('/refresh-token', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const oldRefreshToken = req.cookies.refreshToken;
            if (!oldRefreshToken) return res.status(401).json({ message: "Refresh token is missing." });
            const { token, refreshToken } = await this.authService.refreshAccessToken(userId, oldRefreshToken);

            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 15 * 60 * 1000
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({ message: "Access token refreshed successfully." });
        }));

        router.post('/logout', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            res.clearCookie("token", {
                httpOnly: true,
                secure: false,
                sameSite: "lax"
            });

            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: false,
                sameSite: "lax"
            });

            return res.status(200).json({ message: "Successfully logged out." });
        }));

        router.post('/create-client-admin', authentication(['service_owner', 'client_admin']), validateDTO(CreateUserReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const createUserDTO = plainToInstance(CreateUserReqDTO, rawData);
            const userId = (req as any).user.userId;
            const user = await this.authService.createUser(createUserDTO, userId);

            return res.status(201).json(user);
        }));

        router.post('/client/accept-otp', validateDTO(AcceptOtpReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const acceptOtpDTO = plainToInstance(AcceptOtpReqDTO, rawData);
            const newToken = await this.authService.acceptOtp(acceptOtpDTO);

            return res.status(200).json({ token: newToken });
        }));

        router.post('/user/create-password', validateDTO(CreatePwdReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const createPwdDTO = plainToInstance(CreatePwdReqDTO, rawData);
            await this.authService.createPassword(createPwdDTO);

            return res.status(200).json({ message: "Password created successfully." });
        }));

        router.post('/user/resend-otp/:id', asyncHandler(async (req: Request, res: Response) => {
            const userId = req.params.id;
            if (!userId) return res.status(400).json({ message: "User ID is required." });
            await this.authService.resendOtp(userId);

            return res.status(200).json({ message: "OTP resent successfully." });
        }));

        router.post('/create-bookkeeper', authentication(['service_owner', 'client_admin']), validateDTO(CreateUserReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const createUserDTO = plainToInstance(CreateUserReqDTO, rawData);
            const userId = (req as any).user.userId;
            const user = await this.authService.createUser(createUserDTO, userId);

            return res.status(201).json(user);
        }));

        router.post('/user/forgot-password', asyncHandler(async (req: Request, res: Response) => {
            const email = req.body.data?.email;
            if (!email) return res.status(404).json({ message: "Emailadres is verplicht." });
            await this.authService.createRecovery(email);

            return res.status(200).json({ message: "Als er een account bestaat is er een email verstuurd." });
        }));

        router.post('/user/reset-password', validateDTO(ResetPwdReqDTO), asyncHandler(async (req: Request, res: Response) => {
            const rawData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
            const resetPwdDto = plainToInstance(ResetPwdReqDTO, rawData);
            const succes = await this.authService.finishRecovery(resetPwdDto);
            if (succes) {
                return res.status(200).json({ message: "Password has been resetted." });
            } else {
                return res.status(400).json({ message: "Ongeldige reset token." });
            }
        }));

        router.get('/me', authentication(['*']), asyncHandler(async (req: Request, res: Response) => {
            const userId = (req as any).user.userId;
            const me = await this.authService.getCurrentUser(userId);
            return res.status(200).json(me);
        }));

        return router;
    }
}
