import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

export function createAuthService(prisma: PrismaClient) {
  async function register(email: string, password: string, role: Role) {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.create({ data: { email, passwordHash, role } });
  }

  async function login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error('Invalid credentials');
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h',
    });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });
    return { accessToken, refreshToken, user };
  }

  return { register, login };
}
