import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { sendMessageSchema, accountIdQuery, idParam } from '../validation/schemas';

async function getUserCabinetIds(prisma: PrismaClient, userId: number, role: Role): Promise<number[]> {
  if (role === Role.admin) {
    const cabinets = await prisma.cabinet.findMany({ select: { id: true } });
    return cabinets.map((c) => c.id);
  }
  const userCabinets = await prisma.userCabinet.findMany({
    where: { userId },
    select: { cabinetId: true },
  });
  return userCabinets.map((uc) => uc.cabinetId);
}

async function userCanAccessAccount(prisma: PrismaClient, userId: number, role: Role, accountId: number): Promise<boolean> {
  const cabinetIds = await getUserCabinetIds(prisma, userId, role);
  const account = await prisma.telegramAccount.findFirst({
    where: { id: accountId, cabinetId: { in: cabinetIds } },
  });
  return !!account;
}

export default function chatRouter(prisma: PrismaClient, telegramManager: ReturnType<typeof import('../telegram/telegramManager').createTelegramManager>) {
  const router = Router();

  router.use(authMiddleware.requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const parsed = accountIdQuery.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: 'accountId query parameter is required' });
      }
      const accountId = Number(parsed.data.accountId);
      const authReq = req as AuthRequest;
      if (!authReq.user) return res.status(401).json({ message: 'Unauthorized' });

      const hasAccess = await userCanAccessAccount(prisma, authReq.user.id, authReq.user.role, accountId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this account' });
      }

      const chats = await prisma.chat.findMany({ where: { telegramAccountId: accountId }, orderBy: { lastMessageAt: 'desc' } });
      res.json(chats);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/messages', async (req, res, next) => {
    try {
      const paramParsed = idParam.safeParse(req.params);
      if (!paramParsed.success) {
        return res.status(400).json({ message: 'Invalid chat id' });
      }
      const chatId = Number(paramParsed.data.id);
      const authReq = req as AuthRequest;
      if (!authReq.user) return res.status(401).json({ message: 'Unauthorized' });

      const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { telegramAccount: true } });
      if (!chat) return res.status(404).json({ message: 'Chat not found' });

      const hasAccess = await userCanAccessAccount(prisma, authReq.user.id, authReq.user.role, chat.telegramAccountId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this chat' });
      }

      const messages = await prisma.message.findMany({ where: { chatId }, orderBy: { sentAt: 'asc' } });
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/messages', async (req, res, next) => {
    try {
      const paramParsed = idParam.safeParse(req.params);
      const bodyParsed = sendMessageSchema.safeParse(req.body);
      if (!paramParsed.success || !bodyParsed.success) {
        return res.status(400).json({ message: 'Validation error' });
      }
      const authReq = req as AuthRequest;
      if (!authReq.user) return res.status(401).json({ message: 'Unauthorized' });

      const hasAccess = await userCanAccessAccount(prisma, authReq.user.id, authReq.user.role, bodyParsed.data.accountId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this account' });
      }

      const message = await telegramManager.sendMessage(bodyParsed.data.accountId, Number(paramParsed.data.id), bodyParsed.data.text);
      res.json(message);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
