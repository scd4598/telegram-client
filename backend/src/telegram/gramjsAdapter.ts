import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { computeCheck } from 'telegram/Password';
import { config } from '../config';

export interface GramJSClientWrapper {
  client: TelegramClient;
  accountId: number;
}

export type IncomingMessageHandler = (
  accountId: number,
  payload: { chatId: string; text?: string; fromName?: string; telegramMessageId?: string }
) => Promise<unknown>;

const activeClients = new Map<number, TelegramClient>();

export async function createClient(sessionString: string): Promise<TelegramClient> {
  const session = new StringSession(sessionString);
  const client = new TelegramClient(session, config.telegramApiId, config.telegramApiHash, {
    connectionRetries: 5,
  });
  await client.connect();
  return client;
}

export async function startAuth(phone: string, existingSession?: string | null): Promise<{ client: TelegramClient; phoneCodeHash: string }> {
  const session = new StringSession(existingSession || '');
  const client = new TelegramClient(session, config.telegramApiId, config.telegramApiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  const result = await client.invoke(
    new Api.auth.SendCode({
      phoneNumber: phone,
      apiId: config.telegramApiId,
      apiHash: config.telegramApiHash,
      settings: new Api.CodeSettings({}),
    })
  );

  // Handle both SentCode and SentCodeSuccess union types
  const phoneCodeHash = (result as any).phoneCodeHash as string;
  return { client, phoneCodeHash };
}

export async function confirmAuth(
  client: TelegramClient,
  phone: string,
  code: string,
  phoneCodeHash: string
): Promise<{ sessionString: string; user: Api.User }> {
  const result = await client.invoke(
    new Api.auth.SignIn({
      phoneNumber: phone,
      phoneCodeHash,
      phoneCode: code,
    })
  );

  const user = (result as Api.auth.Authorization).user as Api.User;
  const sessionString = (client.session as StringSession).save();
  return { sessionString, user };
}

export async function confirmPassword(
  client: TelegramClient,
  password: string
): Promise<{ sessionString: string; user: Api.User }> {
  const passwordResult = await client.invoke(new Api.account.GetPassword());
  const srpPassword = await computeCheck(passwordResult, password);
  const result = await client.invoke(
    new Api.auth.CheckPassword({ password: srpPassword })
  );

  const user = (result as Api.auth.Authorization).user as Api.User;
  const sessionString = (client.session as StringSession).save();
  return { sessionString, user };
}

export async function sendTelegramMessage(
  client: TelegramClient,
  peer: string,
  text: string
): Promise<Api.Message> {
  const result = await client.sendMessage(peer, { message: text });
  return result;
}

export async function getDialogs(client: TelegramClient, limit = 100) {
  const dialogs = await client.getDialogs({ limit });
  return dialogs.map((d) => ({
    id: d.id?.toString() || '',
    title: d.title || '',
    isPrivate: d.isUser,
    lastMessage: d.message?.message || '',
    lastMessageDate: d.message?.date ? new Date(d.message.date * 1000) : null,
  }));
}

export async function getMessageHistory(client: TelegramClient, peer: string, limit = 50) {
  const messages = await client.getMessages(peer, { limit });
  return messages.map((m) => ({
    id: m.id.toString(),
    text: m.message || '',
    fromName: m.sender && 'firstName' in m.sender ? (m.sender as Api.User).firstName || '' : '',
    date: m.date ? new Date(m.date * 1000) : new Date(),
    out: m.out || false,
  }));
}

export function listenForUpdates(
  accountId: number,
  client: TelegramClient,
  handler: IncomingMessageHandler
) {
  activeClients.set(accountId, client);

  client.addEventHandler(async (event: NewMessageEvent) => {
    const message = event.message;
    if (message.out) return;

    const chatId = message.chatId?.toString() || message.peerId?.toString() || '';
    let fromName = '';
    if (message.sender && 'firstName' in message.sender) {
      const sender = message.sender as Api.User;
      fromName = [sender.firstName, sender.lastName].filter(Boolean).join(' ');
    }

    await handler(accountId, {
      chatId,
      text: message.message || '',
      fromName,
      telegramMessageId: message.id.toString(),
    });
  }, new NewMessage({}));
}

export async function disconnectClient(accountId: number) {
  const client = activeClients.get(accountId);
  if (client) {
    await client.disconnect();
    activeClients.delete(accountId);
  }
}

export async function disconnectAllClients() {
  for (const [id, client] of activeClients) {
    try {
      await client.disconnect();
    } catch {
      // ignore disconnect errors during shutdown
    }
    activeClients.delete(id);
  }
}
