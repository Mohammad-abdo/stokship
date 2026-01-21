const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding Trader Requests...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const traders = [
    {
      email: 'request1@example.com',
      name: 'Pending Trader One',
      companyName: 'Pending Corp 1',
      phone: '+966500000001',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      traderCode: `TRD-REQ-${Date.now()}-1`,
      isVerified: false,
      isActive: true,
    },
    {
      email: 'request2@example.com',
      name: 'Pending Trader Two',
      companyName: 'Pending Corp 2',
      phone: '+966500000002',
      country: 'Saudi Arabia',
      city: 'Jeddah',
      traderCode: `TRD-REQ-${Date.now()}-2`,
      isVerified: false,
      isActive: true,
    },
    {
      email: 'request3@example.com',
      name: 'Pending Trader Three',
      companyName: 'Pending Corp 3',
      phone: '+966500000003',
      country: 'Saudi Arabia',
      city: 'Dammam',
      traderCode: `TRD-REQ-${Date.now()}-3`,
      isVerified: false,
      isActive: true,
    }
  ];

  for (const t of traders) {
    const exists = await prisma.trader.findUnique({ where: { email: t.email } });
    if (!exists) {
      await prisma.trader.create({
        data: {
          ...t,
          password: hashedPassword,
        }
      });
      console.log(`Created trader request: ${t.email}`);
    } else {
      console.log(`Trader request already exists: ${t.email}`);
    }
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
