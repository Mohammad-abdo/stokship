const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  // Parse DATABASE_URL to extract connection details
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env file');
    console.error('\n💡 Please add DATABASE_URL to your .env file:');
    console.error('   DATABASE_URL="mysql://username:password@localhost:3306/stokshop"');
    process.exit(1);
  }

  console.log(`📋 DATABASE_URL found: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  // Parse MySQL connection string: mysql://user:password@host:port/database
  // Support both with and without port, and empty passwords
  let match = databaseUrl.match(/^mysql:\/\/([^:@]+)(?::([^@]*))?@([^:]+):(\d+)\/(.+)$/);
  let user, password, host, port, databaseName;

  if (match) {
    [, user, password, host, port, databaseName] = match;
    password = password || ''; // Handle empty password
  } else {
    // Try without port (default to 3306)
    match = databaseUrl.match(/^mysql:\/\/([^:@]+)(?::([^@]*))?@([^\/]+)\/(.+)$/);
    if (match) {
      [, user, password, host, databaseName] = match;
      password = password || ''; // Handle empty password
      port = '3306';
    } else {
      console.error('❌ Invalid DATABASE_URL format.');
      console.error('   Expected: mysql://user:password@host:port/database');
      console.error('   Or:       mysql://user:password@host/database');
      console.error(`   Got:      ${databaseUrl}`);
      process.exit(1);
    }
  }

  console.log(`📦 Creating database: ${databaseName}`);
  console.log(`🔗 Connecting to MySQL at ${host}:${port}...`);

  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${databaseName}' created or already exists`);

    await connection.end();
    console.log('✅ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run prisma:generate');
    console.log('   2. Run: npm run prisma:migrate');
    console.log('   3. (Optional) Run: npm run prisma:seed');
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Tip: Check your MySQL username and password in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure MySQL server is running');
    } else {
      console.error('\n💡 Tip: Check your DATABASE_URL in .env file');
    }
    
    process.exit(1);
  }
}

createDatabase();

