import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getAccessibleCabinetIds(prisma: PrismaClient, req: AuthRequest) {
  if (req.user?.role === Role.admin) {
    const cabinets = await prisma.cabinet.findMany({ select: { id: true } });
    return cabinets.map((c) => c.id);
  }
  const memberships = await prisma.userCabinet.findMany({
    where: { userId: req.user?.id },
    select: { cabinetId: true },
  });
  return memberships.map((m) => m.cabinetId);
}

export async function ensureAccountAccess(prisma: PrismaClient, req: AuthRequest, accountId: number) {
  const cabinetIds = await getAccessibleCabinetIds(prisma, req);
  const account = await prisma.telegramAccount.findFirst({ where: { id: accountId, cabinetId: { in: cabinetIds } } });
  if (!account) {
    throw Object.assign(new Error('Account not found or forbidden'), { statusCode: 403 });
  }
  return account;
}

export async function ensureChatAccess(prisma: PrismaClient, req: AuthRequest, chatId: number) {
  const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { telegramAccount: true } });
  if (!chat) {
    throw Object.assign(new Error('Chat not found'), { statusCode: 404 });
  }
  await ensureAccountAccess(prisma, req, chat.telegramAccountId);
  return chat;
}
