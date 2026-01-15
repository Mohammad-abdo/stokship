# 🚀 Quick Setup - Mediation Platform

## The Problem
The database tables don't exist yet. You need to create them before seeding.

## ✅ Solution: Run Setup Script

I've created an automated setup script. Run:

```bash
npm run setup-mediation
```

This will:
1. Push the schema to database (creates all tables)
2. Seed the database with test data
3. Show you test credentials

---

## 🔧 Manual Setup (Alternative)

If you prefer to do it manually:

### Step 1: Push Schema
```bash
npx prisma db push --accept-data-loss
```
*(Type 'y' when prompted)*

### Step 2: Seed Database
```bash
npm run prisma:seed-mediation
```

---

## ⚠️ Important Notes

- **`--accept-data-loss`** flag is needed because the schema changes some enum values
- If you have important data, backup first!
- For development, this is safe

---

## 🎯 After Setup

Once setup is complete, you can:

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test login:**
   - Admin: `admin@stokship.com` / `admin123`
   - Employee: `employee1@stokship.com` / `employee123`
   - Trader: `trader1@stokship.com` / `trader123`
   - Client: `client1@stokship.com` / `client123`

---

**Ready? Run:** `npm run setup-mediation`




