import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { config } from '../config';

export function createAuthService(prisma: PrismaClient) {
  async function register(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.create({ data: { email, passwordHash, role: Role.manager } });
  }

  function generateTokens(userId: number, role: Role) {
    const accessToken = jwt.sign({ userId, role }, config.jwtSecret, {
      expiresIn: '1h',
    });
    const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwtSecret, {
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  async function login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error('Invalid credentials');
    const tokens = generateTokens(user.id, user.role);
    return { ...tokens, user: { id: user.id, email: user.email, role: user.role } };
  }

  async function refreshToken(token: string) {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: number; type?: string };
      if (payload.type !== 'refresh') throw new Error('Invalid token type');
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) throw new Error('User not found');
      const tokens = generateTokens(user.id, user.role);
      return { ...tokens, user: { id: user.id, email: user.email, role: user.role } };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  return { register, login, refreshToken };
}
