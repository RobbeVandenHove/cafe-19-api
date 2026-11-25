
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Database from "../utils/database";
import User from "../modules/auth/entities/user.entity";

type AllowedRole = "client_bookkeeper" | "client_admin" | "service_owner" | "*";

export default function authentication(allowedRoles: AllowedRole[]) {
    return async function (req: Request, res: Response, next: NextFunction) {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET!, {
                algorithms: ["HS256"]
            }) as jwt.JwtPayload;

            if (typeof payload.userId !== "string" || !payload.userId) {
                return res.status(401).json({
                    message: "Invalid token payload."
                });
            }

            const em = Database.getEntityManager();

            const currentUser = await em.findOne(
                User,
                { id: payload.userId },
                { populate: ["roles"] }
            );

            if (!currentUser) {
                return res.status(401).json({
                    message: "User does not exist."
                });
            }

            if (!allowedRoles.includes("*")) {
                const currentUserHasAccess = currentUser.roles.toArray().some(role =>
                    allowedRoles.includes(role.name as AllowedRole)
                );

                if (!currentUserHasAccess) {
                    return res.status(403).json({
                        message: "User does not have permission for this operation."
                    });
                }
            }

            (req as any).user = payload;

            return next();

        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json({
                    message: "Token expired."
                });
            }

            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({
                    message: "Invalid token."
                });
            }

            console.error("Authentication error:", error);

            return res.status(500).json({
                message: "Internal server error."
            });
        }
    };
}
