export interface User {
  id: number;
  email: string;
  role: 'admin' | 'manager';
}

export interface Cabinet {
  id: number;
  name: string;
  accounts?: TelegramAccount[];
}

export type AccountStatus = 'active' | 'paused' | 'risk' | 'error';

export interface AccountDailyLimit {
  id: number;
  telegramAccountId: number;
  date: string;
  firstMessagesSent: number;
  maxFirstPerDay: number;
}

export interface TelegramAccount {
  id: number;
  cabinetId: number;
  phone: string;
  displayName?: string | null;
  status: AccountStatus;
  accountDailyLimits?: AccountDailyLimit[];
}

export interface Chat {
  id: number;
  telegramAccountId: number;
  chatId: string;
  title?: string | null;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  chatStatus: 'not_contacted' | 'first_sent' | 'responded';
}

export interface Message {
  id: number;
  telegramAccountId: number;
  chatId: number;
  direction: 'in' | 'out';
  text?: string | null;
  fromName?: string | null;
  sentAt: string;
}
