import { Application, Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
const secret: string = process.env.JWTLOGINSECRET as string;

declare module 'express-serve-static-core' {
    interface Request {
        userId: string;
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { authorization } = req.headers;
    if (!authorization) {
        console.log('auth fired');
        return res
            .status(401)
            .json({ error: 'Access denied. No token provided.' });
    }

    const token = authorization.split(' ')[1];
    try {
        // Decode the JWT and extract the user ID
        const decoded: { _id: string } = jwt.verify(token, secret) as {
            _id: string;
        };
        const userId = decoded._id;
        console.log("userId", userId);
        if (!userId) {
            return res.status(400).json({ error: 'Invalid Token' });
        }
        req.userId = userId;
        next();
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};
