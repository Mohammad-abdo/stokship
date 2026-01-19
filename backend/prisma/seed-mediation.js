/**
 * Mediation Platform Seed File
 * Seeds the database with initial data for the mediation platform
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting mediation platform seed...');

  // ============================================
  // 1. CREATE ADMIN
  // ============================================
  console.log('📝 Creating admin...');
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@stokship.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@stokship.com',
      password: adminPassword,
      name: 'Platform Admin',
      role: 'admin',
      isActive: true,
      isSuperAdmin: true
    }
  });
  console.log('✅ Created admin:', admin.email);

  // ============================================
  // 1.5. CREATE MODERATORS
  // ============================================
  console.log('🛡️ Creating moderators...');
  const moderatorPassword = await bcrypt.hash('moderator123', 10);
  const moderators = await Promise.all([
    prisma.moderator.upsert({
      where: { email: 'moderator1@stokship.com' },
      update: {},
      create: {
        email: 'moderator1@stokship.com',
        password: moderatorPassword,
        name: 'Senior Moderator',
        role: 'moderator',
        isActive: true
      }
    }),
    prisma.moderator.upsert({
      where: { email: 'moderator2@stokship.com' },
      update: {},
      create: {
        email: 'moderator2@stokship.com',
        password: moderatorPassword,
        name: 'Junior Moderator',
        role: 'moderator',
        isActive: true
      }
    })
  ]);
  console.log(`✅ Created ${moderators.length} moderators`);

  // ============================================
  // 2. CREATE EMPLOYEES
  // ============================================
  console.log('👔 Creating employees...');
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { email: 'employee1@stokship.com' },
      update: {},
      create: {
        email: 'employee1@stokship.com',
        password: employeePassword,
        name: 'Ahmed Mediator',
        phone: '+966501234567',
        employeeCode: 'EMP-001',
        commissionRate: 1.0,
        createdBy: admin.id,
        isActive: true
      }
    }),
    prisma.employee.upsert({
      where: { email: 'employee2@stokship.com' },
      update: {},
      create: {
        email: 'employee2@stokship.com',
        password: employeePassword,
        name: 'Mohammed Guarantor',
        phone: '+966502345678',
        employeeCode: 'EMP-002',
        commissionRate: 1.5,
        createdBy: admin.id,
        isActive: true
      }
    })
  ]);
  console.log(`✅ Created ${employees.length} employees`);

  // ============================================
  // 3. CREATE CLIENTS (before traders for linking)
  // ============================================
  console.log('👤 Creating clients...');
  const clientPassword = await bcrypt.hash('client123', 10);
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'client1@stokship.com' },
      update: {},
      create: {
        email: 'client1@stokship.com',
        password: clientPassword,
        name: 'Client One',
        phone: '+966503456789',
        countryCode: '+966',
        country: 'Saudi Arabia',
        city: 'Riyadh',
        isActive: true,
        isEmailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        language: 'ar'
      }
    }),
    prisma.client.upsert({
      where: { email: 'client2@stokship.com' },
      update: {},
      create: {
        email: 'client2@stokship.com',
        password: clientPassword,
        name: 'Client Two',
        phone: '+966504567890',
        countryCode: '+966',
        country: 'Saudi Arabia',
        city: 'Jeddah',
        isActive: true,
        isEmailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        language: 'ar'
      }
    }),
    prisma.client.upsert({
      where: { email: 'client3@stokship.com' },
      update: {},
      create: {
        email: 'client3@stokship.com',
        password: clientPassword,
        name: 'Client Three',
        phone: '+201234567890',
        countryCode: '+20',
        country: 'Egypt',
        city: 'Cairo',
        isActive: true,
        isEmailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        language: 'en'
      }
    }),
    // Create a client that will be linked to a trader (same email) - DUAL PROFILE EXAMPLE 1
    prisma.client.upsert({
      where: { email: 'dualprofile@stokship.com' },
      update: {},
      create: {
        email: 'dualprofile@stokship.com',
        password: clientPassword, // Same password for linked profiles
        name: 'Dual Profile User',
        phone: '+966509876543',
        countryCode: '+966',
        country: 'Saudi Arabia',
        city: 'Riyadh',
        isActive: true,
        isEmailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        language: 'ar'
      }
    }),
    // Create another client that will be linked to a trader (same email) - DUAL PROFILE EXAMPLE 2
    prisma.client.upsert({
      where: { email: 'merchant@stokship.com' },
      update: {},
      create: {
        email: 'merchant@stokship.com',
        password: clientPassword, // Same password for linked profiles
        name: 'Merchant User',
        phone: '+966501111222',
        countryCode: '+966',
        country: 'Saudi Arabia',
        city: 'Jeddah',
        isActive: true,
        isEmailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        language: 'ar'
      }
    })
  ]);
  console.log(`✅ Created ${clients.length} clients`);

  // ============================================
  // 4. CREATE TRADERS (some linked to clients, some standalone)
  // ============================================
  console.log('🏢 Creating traders...');
  const traderPassword = await bcrypt.hash('trader123', 10);
  
  // ============================================
  // CREATE LINKED TRADERS (Dual Profile Examples)
  // These traders share the same email with clients, demonstrating dual profile feature
  // ============================================
  
  // ============================================
  // HELPER: Get next available trader code
  // This function queries the database each time to get fresh data
  // Works correctly with sequential creation (each call sees previously created traders)
  // ============================================
  const getNextAvailableTraderCode = async (preferredCode = null, checkEmail = null) => {
    // Always query fresh data from database to see latest traders
    const existingTraders = await prisma.trader.findMany({
      select: { traderCode: true, email: true }
    });
    const usedCodes = new Set(existingTraders.map(t => t.traderCode));

    // If preferred code is provided, check if it's available or belongs to the same email
    if (preferredCode) {
      const existingWithCode = existingTraders.find(t => t.traderCode === preferredCode);
      if (!existingWithCode) {
        return preferredCode; // Code is available - return immediately
      }
      // If code exists but email matches (upsert case - trader exists with this email), use it
      if (checkEmail && existingWithCode.email === checkEmail) {
        return preferredCode;
      }
      // Code exists with different email - need to find next available
    }

    // Find next available code starting from preferred code (or 1 if no preference)
    let codeIndex = preferredCode ? parseInt(preferredCode.replace('TRD-', '')) : 1;
    // Keep incrementing until we find an available code
    while (usedCodes.has(`TRD-${String(codeIndex).padStart(3, '0')}`)) {
      codeIndex++;
      // Safety check: prevent infinite loop (shouldn't happen in practice)
      if (codeIndex > 9999) {
        throw new Error('Unable to find available trader code (max limit reached)');
      }
    }
    const availableCode = `TRD-${String(codeIndex).padStart(3, '0')}`;
    
    // If we had to change from preferred code, log it
    if (preferredCode && availableCode !== preferredCode) {
      console.log(`⚠️  Trader code ${preferredCode} already exists, using ${availableCode} instead`);
    }
    
    return availableCode;
  };

  // Example 1: Dual Profile User (client + trader with same email)
  const linkedClient1 = clients.find(c => c.email === 'dualprofile@stokship.com');
  if (!linkedClient1) {
    throw new Error('Linked client 1 not found. Ensure client is created before trader.');
  }
  
  // Check if trader already exists by email (before generating code)
  const existingLinkedTrader1 = await prisma.trader.findUnique({
    where: { email: 'dualprofile@stokship.com' }
  });

  // Get available trader code - if trader exists, use existing code; otherwise get next available
  const traderCode1 = existingLinkedTrader1 
    ? existingLinkedTrader1.traderCode 
    : await getNextAvailableTraderCode('TRD-001', 'dualprofile@stokship.com');
  const barcode1 = existingLinkedTrader1?.barcode || `BAR-${traderCode1}-${Date.now()}`;
  
  // Generate QR code for linked trader (only if trader doesn't exist or QR code is missing)
  let qrCodeUrl1 = existingLinkedTrader1?.qrCodeUrl || null;
  if (!qrCodeUrl1) {
    try {
      const qrCodeData = JSON.stringify({
        type: 'TRADER',
        traderCode: traderCode1,
        barcode: barcode1
      });
      const qrCodeDataUrl1 = await QRCode.toDataURL(qrCodeData);
      qrCodeUrl1 = qrCodeDataUrl1;
    } catch (error) {
      console.warn(`Failed to generate QR code for ${traderCode1}:`, error.message);
    }
  }

  // Use upsert to handle both create and update scenarios
  const linkedTrader1 = await prisma.trader.upsert({
    where: { email: 'dualprofile@stokship.com' },
    update: {
      // Update fields to match latest schema
      password: clientPassword, // Ensure same password as client
      qrCodeUrl: qrCodeUrl1 || existingLinkedTrader1?.qrCodeUrl,
      barcode: barcode1 || existingLinkedTrader1?.barcode
      // Don't update traderCode - keep existing one if trader already exists
    },
    create: {
      email: 'dualprofile@stokship.com',
      password: clientPassword, // Same password as client for linked profile
      name: 'Dual Profile Trader',
      companyName: 'Dual Profile Trading Co.',
      phone: '+966509876543',
      countryCode: '+966',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      traderCode: traderCode1, // Use available trader code
      barcode: barcode1,
      qrCodeUrl: qrCodeUrl1,
      employeeId: employees[0].id,
      isActive: true,
      isVerified: true,
      verifiedAt: new Date()
    }
  });
  console.log(`✅ Created/Updated linked trader 1 (email: ${linkedTrader1.email}, traderCode: ${linkedTrader1.traderCode})`);

  // Example 2: Merchant User (another dual profile example)
  const linkedClient2 = clients.find(c => c.email === 'merchant@stokship.com');
  if (!linkedClient2) {
    throw new Error('Linked client 2 not found. Ensure client is created before trader.');
  }
  
  // Check if trader already exists by email (before generating code)
  const existingLinkedTrader2 = await prisma.trader.findUnique({
    where: { email: 'merchant@stokship.com' }
  });

  // Get available trader code - if trader exists, use existing code; otherwise get next available
  const traderCode2 = existingLinkedTrader2 
    ? existingLinkedTrader2.traderCode 
    : await getNextAvailableTraderCode('TRD-002', 'merchant@stokship.com');
  const barcode2 = existingLinkedTrader2?.barcode || `BAR-${traderCode2}-${Date.now()}`;
  
  // Generate QR code for second linked trader (only if trader doesn't exist or QR code is missing)
  let qrCodeUrl2 = existingLinkedTrader2?.qrCodeUrl || null;
  if (!qrCodeUrl2) {
    try {
      const qrCodeData2 = JSON.stringify({
        type: 'TRADER',
        traderCode: traderCode2,
        barcode: barcode2,
        clientId: linkedClient2.id
      });
      const qrCodeDataUrl2 = await QRCode.toDataURL(qrCodeData2);
      qrCodeUrl2 = qrCodeDataUrl2;
    } catch (error) {
      console.warn(`Failed to generate QR code for ${traderCode2}:`, error.message);
    }
  }

  // Use upsert to handle both create and update scenarios
  const linkedTrader2 = await prisma.trader.upsert({
    where: { email: 'merchant@stokship.com' },
    update: {
      // Update fields to match latest schema
      password: clientPassword, // Ensure same password as client
      qrCodeUrl: qrCodeUrl2 || existingLinkedTrader2?.qrCodeUrl,
      barcode: barcode2 || existingLinkedTrader2?.barcode
      // Don't update traderCode - keep existing one if trader already exists
    },
    create: {
      email: 'merchant@stokship.com',
      password: clientPassword, // Same password as client
      name: 'Merchant Trader',
      companyName: 'Merchant Trading LLC',
      phone: '+966501111222',
      countryCode: '+966',
      country: 'Saudi Arabia',
      city: 'Jeddah',
      traderCode: traderCode2, // Use available trader code
      barcode: barcode2,
      qrCodeUrl: qrCodeUrl2,
      employeeId: employees.length > 1 ? employees[1].id : employees[0].id, // Link to second employee or first
      isActive: true,
      isVerified: true,
      verifiedAt: new Date()
    }
  });
  console.log(`✅ Created/Updated linked trader 2 (email: ${linkedTrader2.email}, traderCode: ${linkedTrader2.traderCode})`);

  // Store all linked traders
  const linkedTraders = [linkedTrader1, linkedTrader2];

  // Create standalone traders (not linked to any client - single profile traders)
  // IMPORTANT: Create sequentially to avoid unique constraint violations on traderCode
  const standaloneTraders = [];
  for (let index = 0; index < employees.length; index++) {
    const employee = employees[index];
    
    // Check if trader already exists by email
    const existingStandaloneTrader = await prisma.trader.findUnique({
      where: { email: `trader${index + 1}@stokship.com` }
    });

    // Get available trader code - if trader exists, use existing code; otherwise get next available
    // IMPORTANT: We check for existing trader first, then get code - this ensures we use existing code if trader exists
    // Start from TRD-003 (after linked traders TRD-001 and TRD-002)
    const preferredCode = `TRD-${String(index + 3).padStart(3, '0')}`;
    let traderCode = existingStandaloneTrader 
      ? existingStandaloneTrader.traderCode 
      : await getNextAvailableTraderCode(preferredCode);
    let barcode = existingStandaloneTrader?.barcode || `BAR-${traderCode}-${Date.now()}`;
    
    // Generate QR code (only if trader doesn't exist or QR code is missing)
    let qrCodeUrl = existingStandaloneTrader?.qrCodeUrl || null;
    if (!qrCodeUrl) {
      try {
        const qrCodeData = JSON.stringify({
          type: 'TRADER',
          traderCode: traderCode,
          barcode: barcode
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);
        qrCodeUrl = qrCodeDataUrl;
      } catch (error) {
        console.warn(`Failed to generate QR code for ${traderCode}:`, error.message);
      }
    }

    // Use upsert to create or update trader with retry logic for unique constraint violations
    let standaloneTrader;
    let attempts = 0;
    let maxAttempts = 5;
    let currentTraderCode = traderCode;
    let currentBarcode = barcode;
    let currentQrCodeUrl = qrCodeUrl;
    
    while (attempts < maxAttempts) {
      try {
        // Double-check if trader exists by email right before upsert (fresh query)
        const freshCheck = await prisma.trader.findUnique({
          where: { email: `trader${index + 1}@stokship.com` }
        });
        
        // If trader exists, use existing code; otherwise use generated code
        const finalTraderCode = freshCheck ? freshCheck.traderCode : currentTraderCode;
        
        standaloneTrader = await prisma.trader.upsert({
          where: { email: `trader${index + 1}@stokship.com` },
          update: {
            password: traderPassword,
            qrCodeUrl: currentQrCodeUrl || freshCheck?.qrCodeUrl,
            barcode: currentBarcode || freshCheck?.barcode
            // Don't update traderCode - keep existing one if trader already exists
          },
          create: {
            email: `trader${index + 1}@stokship.com`,
            password: traderPassword,
            name: `Trader ${index + 1} Contact`,
            companyName: `Trading Company ${index + 1}`,
            phone: `+96650${index + 1}000000`,
            countryCode: '+966',
            country: 'Saudi Arabia',
            city: index === 0 ? 'Riyadh' : 'Jeddah',
            traderCode: finalTraderCode, // Use final trader code (existing or new)
            barcode: currentBarcode,
            qrCodeUrl: currentQrCodeUrl,
            isVerified: index === 0, // First trader is verified
            verifiedAt: index === 0 ? new Date() : null,
            // Only assign an employee to the verified trader
            employeeId: index === 0 ? employee.id : null,
          }
        });
        break; // Success - exit retry loop
      } catch (error) {
        // If unique constraint violation on traderCode, get next available code and retry
        if (error.code === 'P2002' && error.meta?.target?.includes('traderCode')) {
          attempts++;
          console.warn(`⚠️  Trader code ${currentTraderCode} is already taken, getting next available code (attempt ${attempts}/${maxAttempts})...`);
          // Get next available code (query fresh to see all traders including just-created ones)
          currentTraderCode = await getNextAvailableTraderCode();
          // Regenerate barcode and QR code with new trader code
          currentBarcode = `BAR-${currentTraderCode}-${Date.now()}`;
          try {
            const qrCodeData = JSON.stringify({
              type: 'TRADER',
              traderCode: currentTraderCode,
              barcode: currentBarcode
            });
            currentQrCodeUrl = await QRCode.toDataURL(qrCodeData);
          } catch (qrError) {
            console.warn(`Failed to regenerate QR code for ${currentTraderCode}:`, qrError.message);
            currentQrCodeUrl = null;
          }
        } else {
          // If it's a different error, throw it
          throw error;
        }
      }
    }
    
    if (!standaloneTrader) {
      throw new Error(`Failed to create standalone trader ${index + 1} after ${maxAttempts} attempts. Last attempted code: ${currentTraderCode}`);
    }
    
    standaloneTraders.push(standaloneTrader);
    console.log(`✅ Created/Updated standalone trader ${index + 1} (email: ${standaloneTrader.email}, traderCode: ${standaloneTrader.traderCode})`);
  }
  
  // Combine all traders: linked traders first, then standalone traders
  const traders = [...linkedTraders, ...standaloneTraders];
  const linkedCount = traders.filter(t => t.clientId !== null).length;
  console.log(`✅ Created ${traders.length} traders:`);
  console.log(`   - ${linkedCount} linked to clients (dual profiles: Client & Trader with same email)`);
  console.log(`   - ${traders.length - linkedCount} standalone traders`);

  // ============================================
  // Note: Clients are now created before traders (section 3 above)
  // This ensures we can link traders to existing clients
  // ============================================

  // ============================================
  // 5. CREATE CATEGORIES
  // ============================================
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { nameKey: 'category.electronics' },
      update: {},
      create: {
        nameKey: 'category.electronics',
        descriptionKey: 'category.electronics.description',
        slug: 'electronics',
        isActive: true,
        isFeatured: true,
        displayOrder: 1,
        level: 0,
        productCount: 0
      }
    }),
    prisma.category.upsert({
      where: { nameKey: 'category.clothing' },
      update: {},
      create: {
        nameKey: 'category.clothing',
        descriptionKey: 'category.clothing.description',
        slug: 'clothing',
        isActive: true,
        isFeatured: true,
        displayOrder: 2,
        level: 0,
        productCount: 0
      }
    }),
    prisma.category.upsert({
      where: { nameKey: 'category.food' },
      update: {},
      create: {
        nameKey: 'category.food',
        descriptionKey: 'category.food.description',
        slug: 'food',
        isActive: true,
        isFeatured: true,
        displayOrder: 3,
        level: 0,
        productCount: 0
      }
    }),
    prisma.category.upsert({
      where: { nameKey: 'category.home' },
      update: {},
      create: {
        nameKey: 'category.home',
        descriptionKey: 'category.home.description',
        slug: 'home',
        isActive: true,
        isFeatured: false,
        displayOrder: 4,
        level: 0,
        productCount: 0
      }
    }),
    prisma.category.upsert({
      where: { nameKey: 'category.automotive' },
      update: {},
      create: {
        nameKey: 'category.automotive',
        descriptionKey: 'category.automotive.description',
        slug: 'automotive',
        isActive: true,
        isFeatured: false,
        displayOrder: 5,
        level: 0,
        productCount: 0
      }
    })
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // ============================================
  // 6. CREATE OFFERS
  // ============================================
  console.log('📦 Creating offers...');
  // Create offers for all traders (including linked trader)
  const offers = await Promise.all(
    traders.map(async (trader, index) => {
      // Assign category based on index (cycle through categories)
      const category = categories[index % categories.length];
      
      const offer = await prisma.offer.create({
        data: {
          traderId: trader.id,
          title: `Sample Offer ${index + 1} - ${trader.companyName}`,
          description: `This is a sample offer from ${trader.companyName} containing various products for wholesale purchase.`,
          status: index === 0 ? 'ACTIVE' : (index === 1 ? 'ACTIVE' : 'PENDING_VALIDATION'),
          totalCartons: 100 + (index * 50),
          totalCBM: (25.5 + (index * 10)).toString(), // Convert to string for Decimal type
          // Category relation
          categoryId: category.id,
          category: category.nameKey, // Legacy field for backward compatibility
          acceptsNegotiation: index % 2 === 0, // Alternate between true and false
          country: trader.country || 'Saudi Arabia',
          city: trader.city || 'Riyadh',
          // Excel metadata fields
          companyName: trader.companyName,
          proformaInvoiceNo: `PI-${trader.traderCode}-${index + 1}-${new Date().getFullYear()}`,
          excelDate: new Date(),
          excelFileUrl: null, // Would be URL in production
          excelFileName: `offer_${trader.traderCode}_${index + 1}.xlsx`,
          excelFileSize: 102400, // 100KB sample size
          validatedBy: (index === 0 || index === 1) ? employees[0].id : null,
          validatedAt: (index === 0 || index === 1) ? new Date() : null,
          validationNotes: (index === 0 || index === 1) ? 'Offer validated and approved' : null,
          items: {
            create: [
              {
                productName: `Product A ${index + 1}`,
                description: 'High quality product A',
                quantity: 1000,
                cartons: 50,
                // Excel-based fields
                itemNo: `ITEM-A${index + 1}-001`,
                colour: 'Red',
                spec: 'Premium Quality',
                unit: 'SET',
                unitPrice: 12.00.toString(),
                currency: 'USD',
                amount: 12000.00.toString(),
                packing: 'Box',
                packageQuantity: 1,
                unitGW: 0.5.toString(),
                totalGW: 500.0.toString(),
                cartonLength: 30.5.toString(),
                cartonWidth: 25.0.toString(),
                cartonHeight: 20.0.toString(),
                totalCBM: 15.3.toString(),
                images: JSON.stringify([]),
                // Legacy fields (for backward compatibility)
                length: 30.5.toString(),
                width: 25.0.toString(),
                height: 20.0.toString(),
                cbm: 15.3.toString(),
                weight: 500.0.toString(),
                country: 'Saudi Arabia',
                city: trader.city,
                displayOrder: 1
              },
              {
                productName: `Product B ${index + 1}`,
                description: 'Premium product B',
                quantity: 500,
                cartons: 25,
                // Excel-based fields
                itemNo: `ITEM-B${index + 1}-002`,
                colour: 'Blue',
                spec: 'Standard Quality',
                unit: 'PCS',
                unitPrice: 77.00.toString(),
                currency: 'USD',
                amount: 38500.00.toString(),
                packing: 'Carton',
                packageQuantity: 7,
                unitGW: 1.0.toString(),
                totalGW: 750.0.toString(),
                cartonLength: 40.0.toString(),
                cartonWidth: 30.0.toString(),
                cartonHeight: 25.0.toString(),
                totalCBM: 30.0.toString(),
                images: JSON.stringify([]),
                // Legacy fields
                length: 40.0.toString(),
                width: 30.0.toString(),
                height: 25.0.toString(),
                cbm: 30.0.toString(),
                weight: 750.0.toString(),
                country: 'Saudi Arabia',
                city: trader.city,
                displayOrder: 2
              },
              {
                productName: `Product C ${index + 1}`,
                description: 'Standard product C',
                quantity: 2000,
                cartons: 100,
                // Excel-based fields
                itemNo: `ITEM-C${index + 1}-003`,
                colour: 'Green',
                spec: 'Basic Quality',
                unit: 'SET',
                unitPrice: 15.00.toString(),
                currency: 'SR',
                amount: 30000.00.toString(),
                packing: 'Box',
                packageQuantity: 1,
                unitGW: 0.2.toString(),
                totalGW: 200.0.toString(),
                cartonLength: 20.0.toString(),
                cartonWidth: 15.0.toString(),
                cartonHeight: 10.0.toString(),
                totalCBM: 3.0.toString(),
                images: JSON.stringify([]),
                // Legacy fields
                length: 20.0.toString(),
                width: 15.0.toString(),
                height: 10.0.toString(),
                cbm: 3.0.toString(),
                weight: 200.0.toString(),
                country: 'Saudi Arabia',
                city: trader.city,
                displayOrder: 3
              }
            ]
          }
        }
      });

      // Update total CBM from items
      const items = await prisma.offerItem.findMany({
        where: { offerId: offer.id }
      });
      const totalCBM = items.reduce((sum, item) => sum + parseFloat(item.totalCBM || item.cbm || 0), 0);
      const totalCartons = items.reduce((sum, item) => sum + item.cartons, 0);

      return prisma.offer.update({
        where: { id: offer.id },
        data: {
          totalCBM: totalCBM.toString(), // Convert to string for Decimal type
          totalCartons: totalCartons
        }
      });
    })
  );
  console.log(`✅ Created ${offers.length} offers with items`);

  // ============================================
  // 7. CREATE DEALS
  // ============================================
  console.log('🤝 Creating deals...');
  const dealCount = await prisma.deal.count();
  const dealNumber1 = `DEAL-${new Date().getFullYear()}-${String(dealCount + 1).padStart(6, '0')}`;
  const dealNumber2 = `DEAL-${new Date().getFullYear()}-${String(dealCount + 2).padStart(6, '0')}`;
  const dealNumber3 = `DEAL-${new Date().getFullYear()}-${String(dealCount + 3).padStart(6, '0')}`;

  // Get offer items for deals - offers are created in same order as traders array
  // offers[0] belongs to traders[0] (linkedTrader1)
  // offers[1] belongs to traders[1] (linkedTrader2)
  // offers[2] belongs to traders[2] (first standalone trader)
  // offers[3] belongs to traders[3] (second standalone trader) if exists

  // Get offer items for standalone trader offers
  const standaloneTraderOffer = offers[2]; // First standalone trader's offer
  const standaloneTraderOfferItems = await prisma.offerItem.findMany({ 
    where: { offerId: standaloneTraderOffer.id }, 
    orderBy: { displayOrder: 'asc' } 
  });

  // Get offer items for linked trader offer
  const linkedTraderOffer = offers[0]; // First linked trader's offer (traders[0])
  const linkedTraderOfferItems = await prisma.offerItem.findMany({ 
    where: { offerId: linkedTraderOffer.id }, 
    orderBy: { displayOrder: 'asc' } 
  });

  const deals = await Promise.all([
    // Deal 1: Regular client and standalone trader
    prisma.deal.create({
      data: {
        dealNumber: dealNumber1,
        offerId: standaloneTraderOffer.id, // Use offer from first standalone trader (offers[2])
        traderId: traders[2].id, // First standalone trader (traders[0] and [1] are linked, [2] is first standalone)
        clientId: clients[0].id, // First standalone client
        employeeId: employees[0].id,
        status: 'NEGOTIATION',
        totalCartons: 50,
        totalCBM: '15.3', // Convert to string for Decimal type
        items: {
          create: [
            {
              offerItemId: standaloneTraderOfferItems[0].id,
              quantity: 1000,
              cartons: 50,
              cbm: '15.3' // Convert to string for Decimal type
            }
          ]
        }
      }
    }),
    // Deal 2: Regular client and standalone trader
    prisma.deal.create({
      data: {
        dealNumber: dealNumber2,
        offerId: standaloneTraderOffer.id, // Use offer from first standalone trader (offers[2])
        traderId: traders[2].id, // First standalone trader
        clientId: clients[1].id, // Second standalone client
        employeeId: employees[0].id,
        status: 'APPROVED',
        negotiatedAmount: '50000.00', // Convert to string for Decimal type
        totalCartons: 25,
        totalCBM: '30.0', // Convert to string for Decimal type
        items: {
          create: [
            {
              offerItemId: standaloneTraderOfferItems[1].id,
              quantity: 500,
              cartons: 25,
              cbm: '30.0' // Convert to string for Decimal type
            }
          ]
        }
      }
    }),
    // Deal 3: Dual Profile Deal (demonstrates linked profiles feature)
    // This deal uses the same user with dual profile (Client & Trader with same email)
    // Note: traderId and clientId reference the same person but different roles/profiles
    prisma.deal.create({
      data: {
        dealNumber: dealNumber3,
        offerId: linkedTraderOffer.id, // Offer from linked trader (offers[0] = traders[0])
        traderId: traders[0].id, // Linked trader 1 (dual profile - traders[0])
        clientId: linkedClient1.id, // Same user, client profile (linked via clientId)
        employeeId: employees[0].id,
        status: 'NEGOTIATION',
        totalCartons: 50,
        totalCBM: '15.3', // Convert to string for Decimal type
        items: {
          create: [
            {
              offerItemId: linkedTraderOfferItems[0].id,
              quantity: 1000,
              cartons: 50,
              cbm: '15.3' // Convert to string for Decimal type
            }
          ]
        }
      }
    })
  ]);
  console.log(`✅ Created ${deals.length} deals (1 demonstrates dual profile - same user as Client & Trader)`);

  // ============================================
  // 8. CREATE NEGOTIATION MESSAGES
  // ============================================
  console.log('💬 Creating negotiation messages...');
  await prisma.dealNegotiation.createMany({
    data: [
      // Negotiation messages for Deal 1 (standalone client and trader)
      {
        dealId: deals[0].id,
        clientId: clients[0].id, // First standalone client
        traderId: traders[2].id, // First standalone trader (deal[0] uses traders[2])
        messageType: 'TEXT',
        message: 'Hello, I am interested in this offer. Can we discuss the price?',
        isRead: false
      },
      {
        dealId: deals[0].id,
        clientId: clients[0].id,
        traderId: traders[2].id,
        messageType: 'PRICE_PROPOSAL',
        message: 'I propose $45,000 for this quantity',
        proposedPrice: 45000.00,
        isRead: false
      },
      {
        dealId: deals[0].id,
        clientId: clients[0].id,
        traderId: traders[2].id, // First standalone trader
        messageType: 'TEXT',
        message: 'Thank you for your interest. We can offer $48,000 for this quantity.',
        isRead: false
      },
      // Negotiation messages for Deal 3 (dual profile - same user as Client & Trader)
      {
        dealId: deals[2].id,
        clientId: linkedClient1.id, // Linked client profile
        traderId: traders[0].id, // Linked trader profile (same user, different role)
        messageType: 'TEXT',
        message: 'This is a negotiation message demonstrating dual profile feature - same user can be both Client and Trader',
        isRead: false
      },
      {
        dealId: deals[2].id,
        clientId: linkedClient1.id,
        traderId: traders[0].id,
        messageType: 'PRICE_PROPOSAL',
        message: 'As a client, I propose $40,000 for this quantity',
        proposedPrice: 40000.00,
        isRead: false
      }
    ]
  });
  console.log(`✅ Created negotiation messages (including messages for linked profile deal)`);

  // ============================================
  // 9. CREATE PAYMENTS
  // ============================================
  console.log('💳 Creating payments...');
  const payments = await Promise.all([
    prisma.payment.create({
      data:       {
        dealId: deals[1].id,
        clientId: clients[1].id,
        amount: '50000.00', // Convert to string for Decimal type
        method: 'BANK_TRANSFER',
        status: 'COMPLETED',
        transactionId: `TXN-${Date.now()}-1`,
        receiptUrl: null,
        verifiedAt: new Date(),
        verifiedBy: employees[0].id
      }
    })
  ]);
  console.log(`✅ Created ${payments.length} payments`);

  // Update deal status to PAID
  await prisma.deal.update({
    where: { id: deals[1].id },
    data: {
      status: 'PAID',
      paidAt: new Date()
    }
  });

  // ============================================
  // 10. CREATE FINANCIAL TRANSACTIONS
  // ============================================
  console.log('💰 Creating financial transactions...');
  const baseAmount = 50000.00;
  const platformCommission = baseAmount * 0.025; // 2.5%
  const employeeCommission = baseAmount * 0.01; // 1.0%
  const traderAmount = baseAmount - platformCommission - employeeCommission;

  await prisma.financialTransaction.createMany({
    data: [
      {
        dealId: deals[1].id,
        type: 'DEPOSIT',
        amount: baseAmount.toString(), // Convert to string for Decimal type
        status: 'COMPLETED',
        description: 'Client payment received'
      },
      {
        dealId: deals[1].id,
        type: 'COMMISSION',
        amount: platformCommission.toString(), // Convert to string for Decimal type
        status: 'COMPLETED',
        description: 'Platform commission',
        platformCommission: platformCommission.toString() // Convert to string for Decimal type
      },
      {
        dealId: deals[1].id,
        employeeId: employees[0].id,
        type: 'EMPLOYEE_COMMISSION',
        amount: employeeCommission.toString(), // Convert to string for Decimal type
        status: 'COMPLETED',
        description: 'Employee commission',
        employeeCommission: employeeCommission.toString() // Convert to string for Decimal type
      },
      {
        dealId: deals[1].id,
        traderId: traders[2].id, // Use standalone trader for this deal (traders[2] is first standalone)
        type: 'TRADER_PAYOUT',
        amount: traderAmount.toString(), // Convert to string for Decimal type
        status: 'COMPLETED',
        description: 'Trader payout',
        traderAmount: traderAmount.toString() // Convert to string for Decimal type
      }
    ]
  });
  console.log('✅ Created financial transactions');

  // ============================================
  // 11. CREATE LEDGER ENTRIES
  // ============================================
  console.log('📊 Creating ledger entries...');
  // Get the financial transactions we just created
  const transactions = await prisma.financialTransaction.findMany({
    where: { dealId: deals[1].id }
  });
  
  await prisma.financialLedger.createMany({
    data: [
      {
        transactionId: transactions.find(t => t.type === 'DEPOSIT')?.id || transactions[0].id,
        entryType: 'CREDIT',
        accountType: 'PLATFORM',
        accountId: null,
        amount: baseAmount.toString(), // Convert to string for Decimal type
        balanceBefore: '0',
        balanceAfter: baseAmount.toString(), // Convert to string for Decimal type
        description: 'Client payment received',
        reference: deals[1].dealNumber
      },
      {
        transactionId: transactions.find(t => t.type === 'COMMISSION')?.id || transactions[1].id,
        entryType: 'DEBIT',
        accountType: 'PLATFORM',
        accountId: null,
        amount: platformCommission.toString(), // Convert to string for Decimal type
        balanceBefore: baseAmount.toString(), // Convert to string for Decimal type
        balanceAfter: (baseAmount - platformCommission).toString(), // Convert to string for Decimal type
        description: 'Platform commission deducted',
        reference: deals[1].dealNumber
      },
      {
        transactionId: transactions.find(t => t.type === 'EMPLOYEE_COMMISSION')?.id || transactions[2].id,
        entryType: 'CREDIT',
        accountType: 'EMPLOYEE',
        accountId: employees[0].id,
        amount: employeeCommission.toString(), // Convert to string for Decimal type
        balanceBefore: '0',
        balanceAfter: employeeCommission.toString(), // Convert to string for Decimal type
        description: 'Employee commission credited',
        reference: deals[1].dealNumber
      },
      {
        transactionId: transactions.find(t => t.type === 'TRADER_PAYOUT')?.id || transactions[3].id,
        entryType: 'CREDIT',
        accountType: 'TRADER',
        accountId: traders[2].id, // Use standalone trader for this deal (traders[2] is first standalone)
        amount: traderAmount.toString(), // Convert to string for Decimal type
        balanceBefore: '0',
        balanceAfter: traderAmount.toString(), // Convert to string for Decimal type
        description: 'Trader payout credited',
        reference: deals[1].dealNumber
      }
    ]
  });
  console.log('✅ Created ledger entries');

  // ============================================
  // 12. CREATE ACTIVITY LOGS
  // ============================================
  console.log('📝 Creating activity logs...');
  // Temporarily disable foreign key checks due to polymorphic relations
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
  
  await prisma.$executeRaw`
    INSERT INTO ActivityLog (userId, userType, action, entityType, entityId, description, ipAddress, userAgent, createdAt)
    VALUES (${clients[0].id}, 'CLIENT', 'DEAL_CREATED', 'DEAL', ${deals[0].id}, 'Client requested negotiation', '192.168.1.1', 'Mozilla/5.0', NOW())
  `;
  
  await prisma.$executeRaw`
    INSERT INTO ActivityLog (userId, userType, action, entityType, entityId, description, ipAddress, userAgent, createdAt)
    VALUES (${traders[2].id}, 'TRADER', 'DEAL_APPROVED', 'DEAL', ${deals[1].id}, 'Trader approved deal', '192.168.1.2', 'Mozilla/5.0', NOW())
  `;
  
  await prisma.$executeRaw`
    INSERT INTO ActivityLog (userId, userType, action, entityType, entityId, description, ipAddress, userAgent, createdAt)
    VALUES (${employees[0].id}, 'EMPLOYEE', 'OFFER_VALIDATED', 'OFFER', ${offers[0].id}, 'Employee validated offer', '192.168.1.3', 'Mozilla/5.0', NOW())
  `;
  
  // Add activity logs for linked profile deal (dual profile example - same user as Client & Trader)
  await prisma.$executeRaw`
    INSERT INTO ActivityLog (userId, userType, action, entityType, entityId, description, ipAddress, userAgent, createdAt)
    VALUES (${linkedClient1.id}, 'CLIENT', 'DEAL_CREATED', 'DEAL', ${deals[2].id}, 'Client with linked trader profile (dual profile) created deal - same user as trader', '192.168.1.4', 'Mozilla/5.0', NOW())
  `;
  
  // Add activity log as trader for the same user (dual profile - demonstrates switching between roles)
  await prisma.$executeRaw`
    INSERT INTO ActivityLog (userId, userType, action, entityType, entityId, description, ipAddress, userAgent, createdAt)
    VALUES (${traders[0].id}, 'TRADER', 'DEAL_CREATED', 'DEAL', ${deals[2].id}, 'Trader with linked client profile (dual profile) - same user as client, different role', '192.168.1.4', 'Mozilla/5.0', NOW())
  `;
  
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  console.log('✅ Created activity logs');

  // ============================================
  // 13. CREATE AUDIT TRAILS
  // ============================================
  console.log('🔍 Creating audit trails...');
  // Temporarily disable foreign key checks due to polymorphic relations
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
  
  const deal1Json = JSON.stringify({ dealNumber: deals[0].dealNumber, offerId: offers[0].id });
  const oldValueJson = JSON.stringify({ status: 'NEGOTIATION' });
  const newValueJson = JSON.stringify({ status: 'APPROVED', negotiatedAmount: 50000.00 });
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO AuditTrail (userId, userType, action, entityType, entityId, oldValue, newValue, reason, ipAddress, userAgent, success, createdAt)
    VALUES (${clients[0].id}, 'CLIENT', 'DEAL_CREATED', 'DEAL', ${deals[0].id}, NULL, ?, 'Deal created by client', '192.168.1.1', 'Mozilla/5.0', TRUE, NOW())
  `, deal1Json);
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO AuditTrail (userId, userType, action, entityType, entityId, oldValue, newValue, reason, ipAddress, userAgent, success, createdAt)
    VALUES (${traders[2].id}, 'TRADER', 'DEAL_APPROVED', 'DEAL', ${deals[1].id}, ?, ?, 'Deal approved by trader', '192.168.1.2', 'Mozilla/5.0', TRUE, NOW())
  `, oldValueJson, newValueJson);
  
  // Add audit trail for linked profile deal (dual profile example)
  const deal3Json = JSON.stringify({ 
    dealNumber: deals[2].dealNumber, 
    offerId: deals[2].offerId,
    traderId: deals[2].traderId,
    clientId: deals[2].clientId,
    note: 'Dual profile deal - same user as both Client and Trader'
  });
  await prisma.$executeRawUnsafe(`
    INSERT INTO AuditTrail (userId, userType, action, entityType, entityId, oldValue, newValue, reason, ipAddress, userAgent, success, createdAt)
    VALUES (${linkedClient1.id}, 'CLIENT', 'DEAL_CREATED', 'DEAL', ${deals[2].id}, NULL, ?, 'Deal created by client with linked trader profile (dual profile feature)', '192.168.1.4', 'Mozilla/5.0', TRUE, NOW())
  `, deal3Json);
  
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  console.log('✅ Created audit trails');

  console.log('\n🎉 Mediation platform seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Admin: 1`);
  console.log(`   - Employees: ${employees.length}`);
  console.log(`   - Clients: ${clients.length} (${linkedCount} have linked trader profiles)`);
  console.log(`   - Traders: ${traders.length} (${linkedCount} linked to clients - dual profiles)`);
  console.log(`   - Linked Profiles (Dual Profile): ${linkedCount} pairs (Client & Trader with same email)`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Offers: ${offers.length} (all linked to categories)`);
  console.log(`   - Deals: ${deals.length} (1 demonstrates dual profile feature)`);
  console.log(`   - Payments: ${payments.length}`);
  console.log(`   - Financial Transactions: 4`);
  console.log(`   - Ledger Entries: 4`);
  console.log(`   - Activity Logs: 5 (including dual profile deal from both Client and Trader perspectives)`);
  console.log(`   - Audit Trails: 3 (including dual profile deal)`);
  console.log('\n💡 Test Accounts (Dual Profile Feature):');
  console.log(`   ┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`   │ DUAL PROFILE EXAMPLES (Same email, same password, 2 roles)     │`);
  console.log(`   ├─────────────────────────────────────────────────────────────────┤`);
  console.log(`   │ • dualprofile@stokship.com / client123                         │`);
  console.log(`   │   → Can login as both CLIENT and TRADER                       │`);
  console.log(`   │   → Client ID: ${linkedClient1.id}, Trader ID: ${traders[0].id} │`);
  console.log(`   │   → Linked via clientId: ${traders[0].clientId}               │`);
  console.log(`   │                                                               │`);
  console.log(`   │ • merchant@stokship.com / client123                           │`);
  console.log(`   │   → Can login as both CLIENT and TRADER                       │`);
  console.log(`   │   → Client ID: ${linkedClient2.id}, Trader ID: ${traders[1].id} │`);
  console.log(`   │   → Linked via clientId: ${traders[1].clientId}               │`);
  console.log(`   └─────────────────────────────────────────────────────────────────┘`);
  console.log(`\n   Standalone Accounts (Single Profile):`);
  console.log(`   • Client: client1@stokship.com / client123`);
  console.log(`   • Trader: trader1@stokship.com / trader123`);
  console.log(`   • Employee: employee1@stokship.com / employee123`);
  console.log(`   • Admin: ${process.env.ADMIN_EMAIL || 'admin@stokship.com'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log(`\n   📝 Note: Dual profile users can switch between Client and Trader roles`);
  console.log(`      using the Role Switcher in the header. Both profiles share the same`);
  console.log(`      email and password, and are linked via the clientId field.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

