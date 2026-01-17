# Stockship Backend - Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- MySQL (v8.0 or higher)
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Stokship
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```env
DATABASE_URL="mysql://username:password@localhost:3306/stockship"
JWT_SECRET="your_very_secure_jwt_secret_key_here"
JWT_REFRESH_SECRET="your_very_secure_refresh_secret_key_here"
```

### 4. Create MySQL Database

```sql
CREATE DATABASE stockship CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run Prisma Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create database tables
npm run prisma:migrate
```

### 6. (Optional) Seed Database

```bash
npm run prisma:seed
```

### 7. Create Uploads Directory

```bash
mkdir -p uploads/products
mkdir -p uploads/receipts
mkdir -p uploads/excel
mkdir -p uploads/logos
mkdir -p logs
```

### 8. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Project Structure

```
stockship-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── database.js        # Prisma client configuration
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # Authentication middleware
│   │   └── errorHandler.js   # Error handling
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   │   ├── logger.js        # Winston logger
│   │   └── generateToken.js # JWT token generation
│   └── server.js             # Express app entry point
├── uploads/                   # File uploads directory
├── logs/                      # Application logs
├── .env                       # Environment variables
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with initial data
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/guest` - Guest login
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/me` - Update profile (Protected)
- `POST /api/auth/logout` - Logout (Protected)

### Health Check
- `GET /health` - Server health check

## Database Management

### View Database in Prisma Studio

```bash
npm run prisma:studio
```

This will open a web interface at `http://localhost:5555` where you can view and edit your database.

### Create New Migration

```bash
npx prisma migrate dev --name migration_name
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

**Warning**: This will delete all data in your database!

## Development Guidelines

1. **Always use environment variables** for sensitive data
2. **Follow the existing code structure** when adding new features
3. **Use Prisma migrations** for all database changes
4. **Write meaningful commit messages**
5. **Test your code** before committing

## Troubleshooting

### Database Connection Issues

1. Check MySQL is running: `mysql -u root -p`
2. Verify DATABASE_URL in `.env` is correct
3. Ensure database exists: `SHOW DATABASES;`
4. Check MySQL user has proper permissions

### Port Already in Use

If port 3000 is already in use, change it in `.env`:

```env
PORT=3001
```

### Prisma Client Not Generated

Run:
```bash
npm run prisma:generate
```

## Next Steps

1. Implement remaining controllers and services
2. Add validation using express-validator or Joi
3. Implement file upload handling
4. Add email service for notifications
5. Implement caching with Redis
6. Add comprehensive error handling
7. Write unit and integration tests
8. Set up CI/CD pipeline

## Support

For issues or questions, please refer to the main README.md file or create an issue in the repository.



