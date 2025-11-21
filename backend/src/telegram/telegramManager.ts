import { PrismaClient, AccountStatus, MessageDirection, ChatStatus } from '@prisma/client';
import { Server } from 'socket.io';
import { ChatLimiter } from '../types/limits';
import { createLimiter } from '../services/limiterService';
import { createCrmIntegrationService } from '../services/crmIntegrationService';

interface TelegramAccountRuntime {
  accountId: number;
  sessionData?: string | null;
}

export function createTelegramManager(prisma: PrismaClient, io: Server) {
  const limiter: ChatLimiter = createLimiter(prisma);
  const crmIntegration = createCrmIntegrationService(prisma);
  const activeAccounts = new Map<number, TelegramAccountRuntime>();

  async function bootstrapActiveAccounts() {
    const accounts = await prisma.telegramAccount.findMany({ where: { status: AccountStatus.active } });
    accounts.forEach((account) => {
      activeAccounts.set(account.id, { accountId: account.id, sessionData: account.sessionData });
    });
  }

  async function sendMessage(accountId: number, chatId: number, text: string) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new Error('Chat not found');

    const limitOk = await limiter.ensureCanSendFirstMessage(accountId, chatId);
    if (!limitOk.allowed) {
      throw Object.assign(new Error(limitOk.reason || 'Limit exceeded'), { statusCode: 429 });
    }

    const message = await prisma.message.create({
      data: {
        telegramAccountId: accountId,
        chatId,
        direction: MessageDirection.out,
        text,
        sentAt: new Date(),
        fromName: account.displayName || account.phone,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessageText: text,
        lastMessageAt: message.sentAt,
        chatStatus: limitOk.isFirst ? ChatStatus.first_sent : undefined,
      },
    });

    io.emit('new_message', { chatId, accountId, message });
    await crmIntegration.onOutgoingMessage(message);
    return message;
  }

  async function handleIncomingUpdate(accountId: number, payload: { chatId: string; text?: string; fromName?: string }) {
    let chat = await prisma.chat.findFirst({ where: { telegramAccountId: accountId, chatId: payload.chatId } });
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          telegramAccountId: accountId,
          chatId: payload.chatId,
          title: payload.fromName,
          chatStatus: ChatStatus.responded,
        },
      });
    }
    const message = await prisma.message.create({
      data: {
        telegramAccountId: accountId,
        chatId: chat.id,
        direction: MessageDirection.in,
        text: payload.text,
        fromName: payload.fromName,
        sentAt: new Date(),
      },
    });
    await prisma.chat.update({
      where: { id: chat.id },
      data: { lastMessageText: payload.text, lastMessageAt: message.sentAt, chatStatus: ChatStatus.responded },
    });
    io.emit('new_message', { chatId: chat.id, accountId, message });
    await limiter.markResponded(chat.id);
    await crmIntegration.onIncomingMessage(message);
    return message;
  }

  async function startLoginFlow(accountId: number) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');
    activeAccounts.set(accountId, { accountId });
    return { codeSent: true, phone: account.phone };
  }

  async function confirmCode(accountId: number, code: string) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');
    const sessionData = `mock-session-${code}`;
    await prisma.telegramAccount.update({ where: { id: accountId }, data: { sessionData, status: AccountStatus.active } });
    activeAccounts.set(accountId, { accountId, sessionData });
    return { sessionData };
  }

  return { bootstrapActiveAccounts, sendMessage, handleIncomingUpdate, startLoginFlow, confirmCode };
}
