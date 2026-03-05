export interface User {
  id: number;
  email: string;
  role: 'admin' | 'manager';
}

export interface Cabinet {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  accounts?: TelegramAccount[];
}

export interface TelegramAccount {
  id: number;
  cabinetId: number;
  phone: string;
  telegramUserId?: string | null;
  displayName?: string | null;
  status: 'active' | 'paused' | 'risk' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: number;
  telegramAccountId: number;
  chatId: string;
  title?: string | null;
  isPrivate: boolean;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  chatStatus: 'not_contacted' | 'first_sent' | 'responded';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  telegramAccountId: number;
  chatId: number;
  direction: 'in' | 'out';
  telegramMessageId?: string | null;
  fromName?: string | null;
  text?: string | null;
  sentAt: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface NewMessageEvent {
  chatId: number;
  accountId: number;
  message: Message;
}
