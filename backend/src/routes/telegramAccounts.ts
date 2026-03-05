import { Router } from 'express';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { createCabinetService } from '../services/cabinetService';
import { createAccountSchema, confirmCodeSchema, confirmPasswordSchema, idParam } from '../validation/schemas';

export default function telegramAccountsRouter(prisma: PrismaClient, telegramManager: ReturnType<typeof import('../telegram/telegramManager').createTelegramManager>) {
  const router = Router();
  const cabinetService = createCabinetService(prisma);

  router.use(authMiddleware.requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const cabinets = await cabinetService.listForUser(req as AuthRequest);
      const cabinetIds = cabinets.map((c) => c.id);
      const accounts = await prisma.telegramAccount.findMany({ where: { cabinetId: { in: cabinetIds } } });
      res.json(accounts);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const parsed = createAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      }
      const created = await prisma.telegramAccount.create({
        data: { phone: parsed.data.phone, cabinetId: parsed.data.cabinetId, displayName: parsed.data.displayName, status: AccountStatus.paused },
      });
      res.json(created);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/send-code', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const paramParsed = idParam.safeParse(req.params);
      if (!paramParsed.success) {
        return res.status(400).json({ message: 'Invalid account id' });
      }
      const result = await telegramManager.startLoginFlow(Number(paramParsed.data.id));
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/confirm-code', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const paramParsed = idParam.safeParse(req.params);
      const bodyParsed = confirmCodeSchema.safeParse(req.body);
      if (!paramParsed.success || !bodyParsed.success) {
        return res.status(400).json({ message: 'Validation error' });
      }
      const result = await telegramManager.confirmCode(Number(paramParsed.data.id), bodyParsed.data.code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/confirm-password', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const paramParsed = idParam.safeParse(req.params);
      const bodyParsed = confirmPasswordSchema.safeParse(req.body);
      if (!paramParsed.success || !bodyParsed.success) {
        return res.status(400).json({ message: 'Validation error' });
      }
      const result = await telegramManager.confirmPassword(Number(paramParsed.data.id), bodyParsed.data.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/sync-dialogs', authMiddleware.requireRole([Role.admin]), async (req, res, next) => {
    try {
      const paramParsed = idParam.safeParse(req.params);
      if (!paramParsed.success) {
        return res.status(400).json({ message: 'Invalid account id' });
      }
      const count = await telegramManager.syncDialogs(Number(paramParsed.data.id));
      res.json({ synced: count });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
