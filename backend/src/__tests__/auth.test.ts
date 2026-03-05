import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from '../services/authService';

// Mock PrismaClient
function mockPrisma() {
  return {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  } as any;
}

// Mock config
vi.mock('../config', () => ({
  config: {
    jwtSecret: 'test-secret-key-for-testing-only',
  },
}));

describe('AuthService', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let authService: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    prisma = mockPrisma();
    authService = createAuthService(prisma);
  });

  describe('register', () => {
    it('should create a user with hashed password and manager role', async () => {
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role: 'manager',
        passwordHash: 'hashed',
      });

      const result = await authService.register('test@example.com', 'password123');
      expect(prisma.user.create).toHaveBeenCalledOnce();
      const callArgs = prisma.user.create.mock.calls[0][0];
      expect(callArgs.data.email).toBe('test@example.com');
      expect(callArgs.data.role).toBe('manager');
      // Password should be hashed, not plain
      expect(callArgs.data.passwordHash).not.toBe('password123');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should throw on invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('bad@example.com', 'pass')).rejects.toThrow('Invalid credentials');
    });

    it('should throw on wrong password', async () => {
      const bcrypt = await import('bcryptjs');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
        role: 'admin',
      });

      await expect(authService.login('test@example.com', 'wrong-password')).rejects.toThrow('Invalid credentials');
    });

    it('should return tokens and user on success', async () => {
      const bcrypt = await import('bcryptjs');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correct', 10),
        role: 'admin',
      });

      const result = await authService.login('test@example.com', 'correct');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(1);
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('refreshToken', () => {
    it('should throw on invalid token', async () => {
      await expect(authService.refreshToken('bad-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should return new tokens for valid refresh token', async () => {
      const bcrypt = await import('bcryptjs');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('pass', 10),
        role: 'admin',
      });

      // First login to get a refresh token
      const loginResult = await authService.login('test@example.com', 'pass');

      // Now refresh
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role: 'admin',
      });
      const refreshResult = await authService.refreshToken(loginResult.refreshToken);
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.user.id).toBe(1);
    });
  });
});
