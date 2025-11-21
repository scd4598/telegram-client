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
    let record = await prisma.accountDailyLimit.findFirst({ where: { telegramAccountId, date: today } });
    if (!record) {
      record = await prisma.accountDailyLimit.create({
        data: { telegramAccountId, date: today, firstMessagesSent: 0 },
      });
    }
    if (record.firstMessagesSent >= record.maxFirstPerDay) {
      return { allowed: false, isFirst: true, reason: 'Daily limit reached' };
    }
    await prisma.accountDailyLimit.update({
      where: { id: record.id },
      data: { firstMessagesSent: { increment: 1 } },
    });
    await prisma.chat.update({ where: { id: chatId }, data: { chatStatus: ChatStatus.first_sent } });
    return { allowed: true, isFirst: true };
  }

  async function markResponded(chatId: number) {
    await prisma.chat.update({ where: { id: chatId }, data: { chatStatus: ChatStatus.responded } });
  }

  return { ensureCanSendFirstMessage, markResponded };
}
