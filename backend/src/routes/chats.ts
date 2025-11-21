import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { ensureAccountAccess, ensureChatAccess } from '../utils/access';

export default function chatRouter(
  prisma: PrismaClient,
  telegramManager: ReturnType<typeof import('../telegram/telegramManager').createTelegramManager>,
) {
  const router = Router();

  router.use(authMiddleware.requireAuth);

  router.get('/', async (req: AuthRequest, res, next) => {
    try {
      const { accountId } = req.query;
      if (!accountId) throw Object.assign(new Error('Missing accountId'), { statusCode: 400 });
      await ensureAccountAccess(prisma, req, Number(accountId));
      const chats = await prisma.chat.findMany({
        where: { telegramAccountId: Number(accountId) },
        orderBy: { lastMessageAt: 'desc' },
      });
      res.json(chats);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/messages', async (req: AuthRequest, res, next) => {
    try {
      const chat = await ensureChatAccess(prisma, req, Number(req.params.id));
      const messages = await prisma.message.findMany({ where: { chatId: chat.id }, orderBy: { sentAt: 'asc' } });
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/messages', async (req: AuthRequest, res, next) => {
    try {
      const { accountId, text } = req.body;
      if (!accountId || !text) throw Object.assign(new Error('Missing accountId or text'), { statusCode: 400 });
      await ensureAccountAccess(prisma, req, Number(accountId));
      const message = await telegramManager.sendMessage(Number(accountId), Number(req.params.id), text);
      res.json(message);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
