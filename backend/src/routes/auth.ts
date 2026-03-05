import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthService } from '../services/authService';
import { registerSchema, loginSchema } from '../validation/schemas';

export default function authRouter(prisma: PrismaClient) {
  const router = Router();
  const authService = createAuthService(prisma);

  router.post('/register', async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      }
      const created = await authService.register(parsed.data.email, parsed.data.password);
      res.json({ id: created.id, email: created.email, role: created.role });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      }
      const tokens = await authService.login(parsed.data.email, parsed.data.password);
      res.json(tokens);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
