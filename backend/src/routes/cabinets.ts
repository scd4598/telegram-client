import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { createCabinetService } from '../services/cabinetService';
import { createCabinetSchema, assignUserSchema, idParam } from '../validation/schemas';

export default function cabinetRouter(prisma: PrismaClient) {
  const router = Router();
  const service = createCabinetService(prisma);

  router.use(authMiddleware.requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const items = await service.listForUser(req as AuthRequest);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const parsed = createCabinetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      }
      const created = await service.createCabinet(parsed.data.name);
      res.json(created);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/users', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const paramParsed = idParam.safeParse(req.params);
      const bodyParsed = assignUserSchema.safeParse(req.body);
      if (!paramParsed.success || !bodyParsed.success) {
        return res.status(400).json({ message: 'Validation error' });
      }
      const created = await service.assignUser(Number(paramParsed.data.id), bodyParsed.data.userId);
      res.json(created);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
