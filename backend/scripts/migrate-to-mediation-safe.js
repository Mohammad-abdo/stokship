/**
 * Safe Migration Script
 * Checks database state before migration
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check for problematic enum values
    const notifications = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM Notification 
      WHERE userType IN ('USER', 'VENDOR')
    `;
    
    const payments = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM Payment 
      WHERE status = 'VERIFIED'
    `;

    console.log('📊 Database State:');
    console.log(`   - Notifications with USER/VENDOR type: ${notifications[0]?.count || 0}`);
    console.log(`   - Payments with VERIFIED status: ${payments[0]?.count || 0}\n`);

    if (notifications[0]?.count > 0 || payments[0]?.count > 0) {
      console.log('⚠️  WARNING: Found data that may conflict with migration!\n');
      console.log('💡 Recommendations:');
      
      if (notifications[0]?.count > 0) {
        console.log('   - Delete or update notifications with USER/VENDOR type');
        console.log('   - SQL: DELETE FROM Notification WHERE userType IN (\'USER\', \'VENDOR\');');
      }
      
      if (payments[0]?.count > 0) {
        console.log('   - Delete or update payments with VERIFIED status');
        console.log('   - SQL: UPDATE Payment SET status = \'COMPLETED\' WHERE status = \'VERIFIED\';');
      }
      
      console.log('\n   OR reset database: npx prisma migrate reset\n');
      return false;
    }

    console.log('✅ Database is ready for migration!\n');
    return true;
  } catch (error) {
    if (error.code === 'P2021') {
      console.log('✅ Tables don\'t exist yet - safe to migrate!\n');
      return true;
    }
    console.error('❌ Error checking database:', error.message);
    return false;
  }
}

async function main() {
  const isReady = await checkDatabaseState();
  
  if (isReady) {
    console.log('🚀 You can now run:');
    console.log('   npx prisma migrate dev --name init_mediation_platform\n');
  } else {
    console.log('🛑 Please fix the issues above before migrating.\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());



