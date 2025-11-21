import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { createAuthService } from '../services/authService';

export default function authRouter(prisma: PrismaClient) {
  const router = Router();
  const authService = createAuthService(prisma);

  router.post('/register', async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const created = await authService.register(email, password, role as Role);
      res.json(created);
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const tokens = await authService.login(email, password);
      res.json(tokens);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
