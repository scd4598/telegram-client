import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';

export default function chatRouter(prisma: PrismaClient, telegramManager: ReturnType<typeof import('../telegram/telegramManager').createTelegramManager>) {
  const router = Router();

  router.use(authMiddleware.requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const { accountId } = req.query;
      const chats = await prisma.chat.findMany({ where: { telegramAccountId: Number(accountId) }, orderBy: { lastMessageAt: 'desc' } });
      res.json(chats);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/messages', async (req, res, next) => {
    try {
      const messages = await prisma.message.findMany({ where: { chatId: Number(req.params.id) }, orderBy: { sentAt: 'asc' } });
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/messages', async (req, res, next) => {
    try {
      const { accountId, text } = req.body;
      const message = await telegramManager.sendMessage(Number(accountId), Number(req.params.id), text);
      res.json(message);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
