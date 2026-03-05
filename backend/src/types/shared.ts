export interface ApiUser {
  id: number;
  email: string;
  role: 'admin' | 'manager';
}

export interface ApiCabinet {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  accounts?: ApiTelegramAccount[];
}

export interface ApiTelegramAccount {
  id: number;
  cabinetId: number;
  phone: string;
  telegramUserId?: string | null;
  displayName?: string | null;
  status: 'active' | 'paused' | 'risk' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface ApiChat {
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

export interface ApiMessage {
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
  user: ApiUser;
}

export interface NewMessageEvent {
  chatId: number;
  accountId: number;
  message: ApiMessage;
}
