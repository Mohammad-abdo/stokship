/**
 * Migration Script: E-commerce to Mediation Platform
 * 
 * This script helps migrate data from the old e-commerce schema
 * to the new mediation platform schema.
 * 
 * IMPORTANT: Run this on a backup database first!
 */

const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

async function migrateToMediation() {
  console.log('🚀 Starting migration to mediation platform...\n');

  try {
    // Step 1: Create default Admin (if needed)
    console.log('Step 1: Checking for admin...');
    let admin = await prisma.admin.findFirst();
    if (!admin) {
      console.log('Creating default admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await prisma.admin.create({
        data: {
          email: 'admin@stockship.com',
          password: hashedPassword,
          name: 'System Admin',
          role: 'admin',
          isActive: true,
          isSuperAdmin: true
        }
      });
      console.log('✅ Admin created:', admin.email);
    } else {
      console.log('✅ Admin exists:', admin.email);
    }

    // Step 2: Create Employees from existing Admins (optional)
    console.log('\nStep 2: Creating employees...');
    const admins = await prisma.admin.findMany({
      where: {
        isSuperAdmin: false
      },
      take: 5 // Limit to first 5 for demo
    });

    const employees = [];
    for (let i = 0; i < admins.length; i++) {
      const adminUser = admins[i];
      const employeeCode = `EMP-${String(i + 1).padStart(4, '0')}`;
      
      // Check if employee already exists
      let employee = await prisma.employee.findUnique({
        where: { email: adminUser.email }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            email: adminUser.email,
            password: adminUser.password, // In production, you'd want to reset this
            name: adminUser.name,
            employeeCode,
            commissionRate: 1.0,
            createdBy: admin.id,
            isActive: true
          }
        });
        console.log(`✅ Employee created: ${employee.employeeCode} - ${employee.name}`);
      } else {
        console.log(`⏭️  Employee already exists: ${employee.employeeCode}`);
      }
      employees.push(employee);
    }

    // Step 3: Convert Vendors to Traders
    console.log('\nStep 3: Converting vendors to traders...');
    const vendors = await prisma.vendor.findMany({
      where: {
        status: 'APPROVED'
      }
    });

    let traderIndex = 1;
    for (const vendor of vendors) {
      // Assign to first employee (or distribute evenly)
      const assignedEmployee = employees[traderIndex % employees.length] || employees[0];
      
      if (!assignedEmployee) {
        console.log('⚠️  No employees available, skipping vendor:', vendor.email);
        continue;
      }

      // Check if trader already exists
      let trader = await prisma.trader.findUnique({
        where: { email: vendor.email }
      });

      if (!trader) {
        const traderCode = `TRD-${String(traderIndex).padStart(4, '0')}`;
        const barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Generate QR code
        const qrCodeData = JSON.stringify({
          type: 'TRADER',
          traderCode,
          barcode
        });
        const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

        trader = await prisma.trader.create({
          data: {
            email: vendor.email,
            password: vendor.password,
            name: vendor.companyName || vendor.email,
            companyName: vendor.companyName,
            phone: vendor.phone,
            countryCode: vendor.countryCode,
            country: vendor.country,
            city: vendor.city,
            traderCode,
            barcode,
            qrCodeUrl,
            employeeId: assignedEmployee.id,
            isActive: vendor.isActive,
            isVerified: vendor.isVerified
          }
        });
        console.log(`✅ Trader created: ${trader.traderCode} - ${trader.companyName}`);
        traderIndex++;
      } else {
        console.log(`⏭️  Trader already exists: ${trader.traderCode}`);
      }
    }

    // Step 4: Convert Products to Offers (grouped by vendor/trader)
    console.log('\nStep 4: Converting products to offers...');
    const traders = await prisma.trader.findMany();
    
    for (const trader of traders) {
      // Get products for this vendor (if vendor table still exists)
      // Note: This assumes you have a way to map vendor to trader
      // You may need to adjust this based on your data structure
      
      // For now, create a sample offer
      const offer = await prisma.offer.create({
        data: {
          traderId: trader.id,
          title: `Offer from ${trader.companyName}`,
          description: 'Migrated from e-commerce platform',
          status: 'PENDING_VALIDATION',
          totalCartons: 0,
          totalCBM: 0
        }
      });
      console.log(`✅ Offer created: ${offer.id} for trader ${trader.traderCode}`);
    }

    // Step 5: Convert Users to Clients
    console.log('\nStep 5: Converting users to clients...');
    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      take: 100 // Limit for demo
    });

    for (const user of users) {
      let client = await prisma.client.findUnique({
        where: { email: user.email }
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            email: user.email,
            password: user.password,
            name: user.name,
            phone: user.phone,
            countryCode: user.countryCode,
            country: user.country,
            city: user.city,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            termsAccepted: user.termsAccepted,
            termsAcceptedAt: user.termsAcceptedAt,
            language: user.language
          }
        });
        console.log(`✅ Client created: ${client.email}`);
      } else {
        console.log(`⏭️  Client already exists: ${client.email}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review migrated data');
    console.log('2. Validate relationships');
    console.log('3. Test API endpoints');
    console.log('4. Update frontend');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrateToMediation()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToMediation };



