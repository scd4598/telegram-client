import { PrismaClient, ChatStatus } from '@prisma/client';
import { ChatLimiter, LimitResult } from '../types/limits';

export function createLimiter(prisma: PrismaClient): ChatLimiter {
  async function ensureCanSendFirstMessage(telegramAccountId: number, chatId: number): Promise<LimitResult> {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      return { allowed: false, reason: 'Chat not found', isFirst: false };
    }
    const hasIncoming = chat.chatStatus === ChatStatus.responded;
    if (hasIncoming) {
      return { allowed: true, isFirst: false };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Use transaction to atomically check and increment limit
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.accountDailyLimit.upsert({
        where: { telegramAccountId_date: { telegramAccountId, date: today } },
        create: { telegramAccountId, date: today, firstMessagesSent: 0 },
        update: {},
      });

      if (record.firstMessagesSent >= record.maxFirstPerDay) {
        return { allowed: false as const, isFirst: true as const, reason: 'Daily limit reached' };
      }

      await tx.accountDailyLimit.update({
        where: { id: record.id },
        data: { firstMessagesSent: { increment: 1 } },
      });
      await tx.chat.update({ where: { id: chatId }, data: { chatStatus: ChatStatus.first_sent } });
      return { allowed: true as const, isFirst: true as const };
    });

    return result;
  }

  async function markResponded(chatId: number) {
    await prisma.chat.update({ where: { id: chatId }, data: { chatStatus: ChatStatus.responded } });
  }

  return { ensureCanSendFirstMessage, markResponded };
}
