/**
 * Setup Mediation Database
 * Automatically runs db push and seed
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Setting up Mediation Platform Database\n');
  
  try {
    console.log('📊 Step 1: Pushing schema to database...');
    console.log('⚠️  This will modify existing tables/enums if they exist.\n');
    
    const answer = await question('Do you want to continue? (y/N): ');
    
    if (answer.toLowerCase() !== 'y') {
      console.log('\n❌ Setup cancelled.');
      rl.close();
      process.exit(0);
    }
    
    console.log('\n🔄 Pushing schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      console.log('✅ Schema pushed successfully!\n');
    } catch (error) {
      console.error('❌ Error pushing schema:', error.message);
      rl.close();
      process.exit(1);
    }
    
    console.log('🌱 Step 2: Seeding database...');
    try {
      execSync('node prisma/seed-mediation.js', { 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      console.log('✅ Database seeded successfully!\n');
    } catch (error) {
      console.error('❌ Error seeding database:', error.message);
      rl.close();
      process.exit(1);
    }
    
    console.log('🎉 Setup complete!');
    console.log('\n📝 Test Credentials:');
    console.log('   Admin: admin@stokship.com / admin123');
    console.log('   Employee: employee1@stokship.com / employee123');
    console.log('   Trader: trader1@stokship.com / trader123');
    console.log('   Client: client1@stokship.com / client123\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();



