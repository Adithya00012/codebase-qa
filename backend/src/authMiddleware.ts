import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
    userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "missing token" });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET) as unknown as { userId: string };
        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ error: "invalid token" });
    }
}