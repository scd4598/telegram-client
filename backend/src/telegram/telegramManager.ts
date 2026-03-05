import { PrismaClient, AccountStatus, MessageDirection } from '@prisma/client';
import { TelegramClient } from 'telegram';
import { Server } from 'socket.io';
import { ChatLimiter } from '../types/limits';
import { createLimiter } from '../services/limiterService';
import { createCrmIntegrationService } from '../services/crmIntegrationService';
import * as gramjs from './gramjsAdapter';

interface PendingAuth {
  client: TelegramClient;
  phoneCodeHash: string;
}

export function createTelegramManager(prisma: PrismaClient, io: Server) {
  const limiter: ChatLimiter = createLimiter(prisma);
  const crmIntegration = createCrmIntegrationService(prisma);
  const connectedClients = new Map<number, TelegramClient>();
  const pendingAuths = new Map<number, PendingAuth>();

  async function emitToCabinet(cabinetId: number, event: string, data: unknown) {
    io.to(`cabinet:${cabinetId}`).emit(event, data);
  }

  async function handleIncomingUpdate(
    accountId: number,
    payload: { chatId: string; text?: string; fromName?: string; telegramMessageId?: string }
  ) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) return;

    let chat = await prisma.chat.findFirst({ where: { telegramAccountId: accountId, chatId: payload.chatId } });
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          telegramAccountId: accountId,
          chatId: payload.chatId,
          title: payload.fromName,
          chatStatus: 'responded',
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
        telegramMessageId: payload.telegramMessageId,
        sentAt: new Date(),
      },
    });
    await prisma.chat.update({
      where: { id: chat.id },
      data: { lastMessageText: payload.text, lastMessageAt: message.sentAt, chatStatus: 'responded' },
    });
    await emitToCabinet(account.cabinetId, 'new_message', { chatId: chat.id, accountId, message });
    await limiter.markResponded(chat.id);
    await crmIntegration.onIncomingMessage(message);
    return message;
  }

  async function connectAccount(accountId: number, sessionData: string) {
    try {
      const client = await gramjs.createClient(sessionData);
      connectedClients.set(accountId, client);
      gramjs.listenForUpdates(accountId, client, handleIncomingUpdate);
      console.log(`[Telegram] Account ${accountId} connected`);
    } catch (err) {
      console.error(`[Telegram] Failed to connect account ${accountId}:`, err);
      await prisma.telegramAccount.update({
        where: { id: accountId },
        data: { status: AccountStatus.error },
      });
    }
  }

  async function bootstrapActiveAccounts() {
    const accounts = await prisma.telegramAccount.findMany({
      where: { status: AccountStatus.active, sessionData: { not: null } },
    });
    console.log(`[Telegram] Bootstrapping ${accounts.length} active accounts...`);
    for (const account of accounts) {
      if (account.sessionData) {
        await connectAccount(account.id, account.sessionData);
      }
    }
  }

  async function startLoginFlow(accountId: number) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    try {
      const { client, phoneCodeHash } = await gramjs.startAuth(account.phone, account.sessionData);
      pendingAuths.set(accountId, { client, phoneCodeHash });
      return { codeSent: true, phone: account.phone };
    } catch (err: any) {
      if (err.message?.includes('FLOOD')) {
        throw new Error('Flood wait');
      }
      throw err;
    }
  }

  async function confirmCode(accountId: number, code: string) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const pending = pendingAuths.get(accountId);
    if (!pending) throw new Error('No pending auth. Call send-code first.');

    try {
      const { sessionString, user } = await gramjs.confirmAuth(
        pending.client,
        account.phone,
        code,
        pending.phoneCodeHash
      );

      await prisma.telegramAccount.update({
        where: { id: accountId },
        data: {
          sessionData: sessionString,
          status: AccountStatus.active,
          telegramUserId: user.id.toString(),
          displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
        },
      });

      connectedClients.set(accountId, pending.client);
      gramjs.listenForUpdates(accountId, pending.client, handleIncomingUpdate);
      pendingAuths.delete(accountId);

      return { success: true };
    } catch (err: any) {
      if (err.message?.includes('PHONE_CODE_EXPIRED')) {
        throw new Error('Phone code expired');
      }
      if (err.message?.includes('PHONE_CODE_INVALID')) {
        throw new Error('Phone code invalid');
      }
      if (err.message?.includes('SESSION_PASSWORD_NEEDED')) {
        return { needsPassword: true };
      }
      throw err;
    }
  }

  async function confirmPassword(accountId: number, password: string) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const pending = pendingAuths.get(accountId);
    if (!pending) throw new Error('No pending auth');

    const { sessionString, user } = await gramjs.confirmPassword(pending.client, password);

    await prisma.telegramAccount.update({
      where: { id: accountId },
      data: {
        sessionData: sessionString,
        status: AccountStatus.active,
        telegramUserId: user.id.toString(),
        displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      },
    });

    connectedClients.set(accountId, pending.client);
    gramjs.listenForUpdates(accountId, pending.client, handleIncomingUpdate);
    pendingAuths.delete(accountId);

    return { success: true };
  }

  async function sendMessage(accountId: number, chatId: number, text: string) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new Error('Chat not found');

    const limitOk = await limiter.ensureCanSendFirstMessage(accountId, chatId);
    if (!limitOk.allowed) {
      throw new Error(limitOk.reason || 'Limit exceeded');
    }

    // Send via Telegram
    const client = connectedClients.get(accountId);
    let telegramMessageId: string | undefined;
    if (client) {
      try {
        const tgMsg = await gramjs.sendTelegramMessage(client, chat.chatId, text);
        telegramMessageId = tgMsg.id.toString();
      } catch (err) {
        console.error(`[Telegram] Failed to send message for account ${accountId}:`, err);
        throw new Error('Failed to send Telegram message');
      }
    }

    const message = await prisma.message.create({
      data: {
        telegramAccountId: accountId,
        chatId,
        direction: MessageDirection.out,
        text,
        telegramMessageId,
        sentAt: new Date(),
        fromName: account.displayName || account.phone,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageText: text, lastMessageAt: message.sentAt, chatStatus: limitOk.isFirst ? 'first_sent' : undefined },
    });

    await emitToCabinet(account.cabinetId, 'new_message', { chatId, accountId, message });
    await crmIntegration.onOutgoingMessage(message);
    return message;
  }

  async function syncDialogs(accountId: number) {
    const account = await prisma.telegramAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const client = connectedClients.get(accountId);
    if (!client) throw new Error('Account not connected');

    const dialogs = await gramjs.getDialogs(client);

    for (const dialog of dialogs) {
      await prisma.chat.upsert({
        where: { telegramAccountId_chatId: { telegramAccountId: accountId, chatId: dialog.id } },
        create: {
          telegramAccountId: accountId,
          chatId: dialog.id,
          title: dialog.title,
          isPrivate: dialog.isPrivate,
          lastMessageText: dialog.lastMessage,
          lastMessageAt: dialog.lastMessageDate,
        },
        update: {
          title: dialog.title,
          lastMessageText: dialog.lastMessage,
          lastMessageAt: dialog.lastMessageDate,
        },
      });
    }

    return dialogs.length;
  }

  async function syncMessages(accountId: number, chatDbId: number) {
    const chat = await prisma.chat.findUnique({ where: { id: chatDbId } });
    if (!chat) throw new Error('Chat not found');

    const client = connectedClients.get(accountId);
    if (!client) throw new Error('Account not connected');

    const messages = await gramjs.getMessageHistory(client, chat.chatId);

    for (const msg of messages) {
      const existing = await prisma.message.findFirst({
        where: { telegramAccountId: accountId, chatId: chatDbId, telegramMessageId: msg.id },
      });
      if (!existing) {
        await prisma.message.create({
          data: {
            telegramAccountId: accountId,
            chatId: chatDbId,
            direction: msg.out ? MessageDirection.out : MessageDirection.in,
            text: msg.text,
            fromName: msg.fromName,
            telegramMessageId: msg.id,
            sentAt: msg.date,
          },
        });
      }
    }
  }

  async function disconnectAll() {
    await gramjs.disconnectAllClients();
    connectedClients.clear();
    pendingAuths.clear();
  }

  return {
    bootstrapActiveAccounts,
    sendMessage,
    handleIncomingUpdate,
    startLoginFlow,
    confirmCode,
    confirmPassword,
    syncDialogs,
    syncMessages,
    disconnectAll,
  };
}
