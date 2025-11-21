import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export function createCabinetService(prisma: PrismaClient) {
  async function listForUser(req: AuthRequest) {
    if (req.user?.role === Role.admin) {
      return prisma.cabinet.findMany({ include: { accounts: true } });
    }
    return prisma.cabinet.findMany({
      where: { userCabinets: { some: { userId: req.user?.id } } },
      include: { accounts: true },
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
