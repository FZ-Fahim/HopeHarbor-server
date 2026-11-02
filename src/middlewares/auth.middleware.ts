import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../config/auth.js';
import { AuthUser } from '../types/express.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // 1. Try resolving via Better Auth session from headers/cookies
    if (auth) {
      try {
        const session = await auth.api.getSession({
          headers: req.headers as HeadersInit,
        });

        if (session && session.user) {
          req.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image ?? undefined,
          };
          return next();
        }
      } catch (err) {
        // Fall back to token verification if direct session check fails
      }
    }

    // 2. Try verifying standalone Bearer JWT Token
    if (token) {
      const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || 'secret';
      const decoded = jwt.verify(token, secret) as any;

      if (decoded && (decoded.email || decoded.sub)) {
        req.user = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          name: decoded.name || 'Community Member',
          image: decoded.image || decoded.picture,
        };
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token or session is missing or invalid',
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
    });
  }
}