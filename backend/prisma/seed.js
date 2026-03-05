// Production-compatible seed script (plain JS, no ts-node needed)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@local.dev';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
  });

  const cabinet = await prisma.cabinet.create({
    data: { name: 'Default Cabinet' },
  });

  await prisma.userCabinet.create({
    data: { userId: admin.id, cabinetId: cabinet.id },
  });

  console.log(`Seeded admin user: ${adminEmail} / admin123`);
  console.log(`Seeded cabinet: ${cabinet.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
