import { Router } from 'express';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { createCabinetService } from '../services/cabinetService';

export default function telegramAccountsRouter(prisma: PrismaClient, telegramManager: ReturnType<typeof import('../telegram/telegramManager').createTelegramManager>) {
  const router = Router();
  const cabinetService = createCabinetService(prisma);

  router.use(authMiddleware.requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const cabinets = await cabinetService.listForUser(req as any);
      const cabinetIds = cabinets.map((c) => c.id);
      const accounts = await prisma.telegramAccount.findMany({ where: { cabinetId: { in: cabinetIds } }, include: { accountDailyLimits: true } });
      res.json(accounts);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const { phone, cabinetId, displayName } = req.body;
      const created = await prisma.telegramAccount.create({ data: { phone, cabinetId, displayName, status: AccountStatus.paused } });
      res.json(created);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/send-code', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const result = await telegramManager.startLoginFlow(Number(req.params.id));
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/confirm-code', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const { code } = req.body;
      const result = await telegramManager.confirmCode(Number(req.params.id), code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
