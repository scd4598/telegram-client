import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

type AuthRequest = Request & { user?: { id: number; role: Role } };

let prisma: PrismaClient;

export const authMiddleware = {
  configure(client: PrismaClient) {
    prisma = client;
  },
  requireAuth: async (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Missing auth header' });
    }
    const token = header.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: number;
        role: Role;
      };
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = { id: user.id, role: user.role };
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  },
  requireRole: (roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    };
  },
};

export type { AuthRequest };
