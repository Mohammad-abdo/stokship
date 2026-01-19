require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding Client -> Trader Requests...');

  const password = await bcrypt.hash('password123', 10);

  const requestData = [
    {
      email: 'client_req1@example.com',
      name: 'Client Requester One',
      phone: '+966511111111',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      companyName: 'Future Trade Corp',
      bankAccountName: 'Future Trade Corp',
      bankAccountNumber: 'SA1234567890',
      bankName: 'Al Rajhi Bank'
    },
    {
      email: 'client_req2@example.com',
      name: 'Client Requester Two',
      phone: '+966522222222',
      country: 'Saudi Arabia',
      city: 'Jeddah',
      companyName: 'Red Sea Traders',
      bankAccountName: 'Red Sea Traders',
      bankAccountNumber: 'SA0987654321',
      bankName: 'NCB'
    },
    {
      email: 'client_req3@example.com',
      name: 'Client Requester Three',
      phone: '+966533333333',
      country: 'Saudi Arabia',
      city: 'Dammam',
      companyName: 'Eastern Merchants',
      bankAccountName: 'Eastern Merchants',
      bankAccountNumber: 'SA1122334455',
      bankName: 'SAB'
    }
  ];

  for (const data of requestData) {
    // 1. Create Client
    let client = await prisma.client.findUnique({ where: { email: data.email } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          email: data.email,
          password: password,
          name: data.name,
          phone: data.phone,
          country: data.country,
          city: data.city,
          countryCode: 'SA',
          isActive: true,
          isEmailVerified: true
        }
      });
      console.log(`Created Client: ${client.email}`);
    } else {
      console.log(`Client already exists: ${client.email}`);
    }

    // 2. Create Trader Request (Unverified) linked to Client
    // Check if trader exists by email or client linking
    let trader = await prisma.trader.findFirst({
        where: {
            OR: [
                { email: data.email },
                { clientId: client.id }
            ]
        }
    });

    if (!trader) {
      const traderCode = `TRD-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
      
      trader = await prisma.trader.create({
        data: {
          email: client.email,
          password: client.password,
          name: client.name,
          phone: client.phone,
          country: client.country,
          city: client.city,
          countryCode: client.countryCode,
          
          companyName: data.companyName,
          companyAddress: `${data.city}, ${data.country}`,
          
          bankAccountName: data.bankAccountName,
          bankAccountNumber: data.bankAccountNumber,
          bankName: data.bankName,
          
          traderCode: traderCode,
          barcode: `${Date.now()}`,
          isActive: true,
          isVerified: false, // PENDING STATUS
          clientId: client.id
        }
      });
      console.log(`Created Pending Trader Request: ${trader.name} (${trader.traderCode})`);
      
      // Log activity
      await prisma.activityLog.create({
        data: {
            userType: 'CLIENT',
            action: 'TRADER_REGISTERED',
            entityType: 'TRADER',
            traderId: trader.id,
            clientId: client.id,
            description: `Seeded trader request for ${client.name}`
        }
      });

    } else {
      console.log(`Trader request already exists for: ${client.email}`);
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
