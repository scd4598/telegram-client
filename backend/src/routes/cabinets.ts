import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { createCabinetService } from '../services/cabinetService';

export default function cabinetRouter(prisma: PrismaClient) {
  const router = Router();
  const service = createCabinetService(prisma);

  router.use(authMiddleware.requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const items = await service.listForUser(req as any);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const { name } = req.body;
      const created = await service.createCabinet(name);
      res.json(created);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/users', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const { userId } = req.body;
      const created = await service.assignUser(Number(req.params.id), userId);
      res.json(created);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
