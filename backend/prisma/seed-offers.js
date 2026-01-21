const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding offers...');

  // 1. Create or connect to a Trader
  const traderEmail = 'trader@stokship.com';
  const trader = await prisma.trader.upsert({
    where: { email: traderEmail },
    update: {},
    create: {
      email: traderEmail,
      password: '$2a$10$YourHashedPasswordHere', // Use a real hash or simple placeholder if dev
      name: 'Test Trader',
      companyName: 'Global Trading Co.',
      traderCode: 'TRD-TEST-001',
      barcode: 'TRD-QR-001',
      phone: '+966500000000',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      isActive: true,
      isVerified: true
    },
  });

  console.log(`Created/Found Trader: ${trader.companyName} (${trader.id})`);

  // 2. Create Offers
  const offersData = [
    {
      title: 'High Quality Furniture Set',
      description: 'Luxury bedroom furniture set with king size bed and wardrobe.',
      status: 'ACTIVE',
      totalCartons: 50,
      totalCBM: 10.5,
      acceptsNegotiation: true,
      country: 'Saudi Arabia',
      city: 'Jeddah',
      items: [
        {
          productName: 'King Size Bed Frame',
          description: 'Solid oak wood frame',
          quantity: 50,
          unit: 'SET',
          unitPrice: 1500,
          amount: 75000,
          currency: 'SAR'
        },
        {
          productName: 'Nightstand',
          description: 'Matching oak nightstand',
          quantity: 100,
          unit: 'PCS',
          unitPrice: 300,
          amount: 30000,
          currency: 'SAR'
        }
      ]
    },
    {
      title: 'Bulk Electronics - Wireless Headphones',
      description: 'Noise cancelling wireless headphones, bulk order surplus.',
      status: 'ACTIVE',
      totalCartons: 100,
      totalCBM: 5.0,
      acceptsNegotiation: true,
      country: 'UAE',
      city: 'Dubai',
      items: [
        {
          productName: 'Wireless Headphone Model X',
          description: 'Bluetooth 5.0, 20h battery',
          quantity: 1000,
          unit: 'PCS',
          unitPrice: 50,
          amount: 50000,
          currency: 'USD'
        }
      ]
    }
  ];

  for (const offerData of offersData) {
    const { items, ...offerDetails } = offerData;
    
    const offer = await prisma.offer.create({
      data: {
        ...offerDetails,
        traderId: trader.id,
        items: {
          create: items.map(item => ({
            ...item,
            cartons: 0,
            cbm: 0,
            totalCBM: 0 // Mock values
          }))
        }
      }
    });
    
    console.log(`Created Offer: ${offer.title} (${offer.id})`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
