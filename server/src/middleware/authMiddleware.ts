import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase.js';

// Extend Express Request to include authenticated user info
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: {
        uid: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication Middleware
 * Verifies Firebase JWT token from Authorization header.
 * Attaches decoded user info to req.firebaseUser.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase token
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    // Attach user info to request
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };

    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Token verification failed:', error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }

    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Ownership Middleware
 * Verifies that the authenticated user is accessing their own resources.
 * Checks that :userId param matches the Firebase UID from the token.
 */
export const ownershipMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const paramUserId = req.params.userId;
  const tokenUid = req.firebaseUser?.uid;

  if (paramUserId && tokenUid && paramUserId !== tokenUid) {
    return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
  }

  next();
};
