export interface LimitResult {
  allowed: boolean;
  reason?: string;
  isFirst: boolean;
}

export interface ChatLimiter {
  ensureCanSendFirstMessage: (telegramAccountId: number, chatId: number) => Promise<LimitResult>;
  markResponded: (chatId: number) => Promise<void>;
}
