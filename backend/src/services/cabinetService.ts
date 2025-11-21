import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export function createCabinetService(prisma: PrismaClient) {
  async function listForUser(req: AuthRequest) {
    const includeConfig = { include: { accounts: { include: { accountDailyLimits: true } } } };
    if (req.user?.role === Role.admin) {
      return prisma.cabinet.findMany(includeConfig);
    }
    return prisma.cabinet.findMany({
      where: { userCabinets: { some: { userId: req.user?.id } } },
      ...includeConfig,
    });
  }

  async function createCabinet(name: string) {
    return prisma.cabinet.create({ data: { name } });
  }

  async function assignUser(cabinetId: number, userId: number) {
    return prisma.userCabinet.create({ data: { cabinetId, userId } });
  }

  return { listForUser, createCabinet, assignUser };
}
