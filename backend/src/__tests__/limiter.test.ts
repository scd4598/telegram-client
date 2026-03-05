import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLimiter } from '../services/limiterService';

function mockPrisma() {
  return {
    chat: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    accountDailyLimit: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  } as any;
}

describe('LimiterService', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let limiter: ReturnType<typeof createLimiter>;

  beforeEach(() => {
    prisma = mockPrisma();
    limiter = createLimiter(prisma);
  });

  describe('ensureCanSendFirstMessage', () => {
    it('should return not allowed if chat not found', async () => {
      prisma.chat.findUnique.mockResolvedValue(null);
      const result = await limiter.ensureCanSendFirstMessage(1, 999);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Chat not found');
    });

    it('should allow without limit check if chat is already responded', async () => {
      prisma.chat.findUnique.mockResolvedValue({
        id: 1,
        chatStatus: 'responded',
      });
      const result = await limiter.ensureCanSendFirstMessage(1, 1);
      expect(result.allowed).toBe(true);
      expect(result.isFirst).toBe(false);
    });

    it('should block if daily limit reached', async () => {
      prisma.chat.findUnique.mockResolvedValue({
        id: 1,
        chatStatus: 'not_contacted',
      });
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          accountDailyLimit: {
            upsert: vi.fn().mockResolvedValue({
              id: 1,
              firstMessagesSent: 20,
              maxFirstPerDay: 20,
            }),
            update: vi.fn(),
          },
          chat: { update: vi.fn() },
        });
      });

      const result = await limiter.ensureCanSendFirstMessage(1, 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Daily limit reached');
    });

    it('should allow and increment if under limit', async () => {
      prisma.chat.findUnique.mockResolvedValue({
        id: 1,
        chatStatus: 'not_contacted',
      });
      const mockUpdate = vi.fn();
      const mockChatUpdate = vi.fn();
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          accountDailyLimit: {
            upsert: vi.fn().mockResolvedValue({
              id: 1,
              firstMessagesSent: 5,
              maxFirstPerDay: 20,
            }),
            update: mockUpdate,
          },
          chat: { update: mockChatUpdate },
        });
      });

      const result = await limiter.ensureCanSendFirstMessage(1, 1);
      expect(result.allowed).toBe(true);
      expect(result.isFirst).toBe(true);
    });
  });

  describe('markResponded', () => {
    it('should update chat status to responded', async () => {
      prisma.chat.update.mockResolvedValue({});
      await limiter.markResponded(1);
      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { chatStatus: 'responded' },
      });
    });
  });
});
