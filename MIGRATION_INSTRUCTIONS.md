# Migration Instructions - Mediation Platform

## ⚠️ Important: Database Migration Required

The mediation platform schema has been updated, but the database tables don't exist yet. You need to run migrations.

---

## 🚨 Current Situation

- ✅ Prisma schema updated (`schema.prisma` = mediation schema)
- ✅ Prisma client generated
- ❌ Database tables don't exist yet
- ⚠️ Migration will modify existing tables/enums

---

## 📋 Migration Options

### Option 1: Fresh Database (Recommended for Development)

If you're okay with losing existing data:

```bash
# Reset database and apply migrations
npx prisma migrate reset

# Then run seed
npm run prisma:seed-mediation
```

### Option 2: Create Migration (Preserves Data)

If you want to keep existing data:

```bash
# Create migration (will prompt for confirmation)
npx prisma migrate dev --name init_mediation_platform

# When prompted, type 'y' and press Enter

# Then run seed
npm run prisma:seed-mediation
```

### Option 3: Manual Migration (For Production)

1. **Backup your database first!**
2. Review the migration SQL
3. Apply migration manually or use:
   ```bash
   npx prisma migrate deploy
   ```

---

## ⚠️ Warnings Explained

The migration will:
- Remove `USER` and `VENDOR` from `Notification_userType` enum
- Remove `VERIFIED` from `Payment_status` enum
- Add unique constraint on `Payment.transactionId`

**If you have existing data with these values, the migration may fail.**

---

## ✅ After Migration

Once migration is complete:

1. **Run the seed:**
   ```bash
   npm run prisma:seed-mediation
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Test login:**
   - Admin: `admin@stokship.com` / `admin123`
   - Employee: `employee1@stokship.com` / `employee123`
   - Trader: `trader1@stokship.com` / `trader123`
   - Client: `client1@stokship.com` / `client123`

---

## 🔄 If Migration Fails

If migration fails due to existing data:

1. **Option A:** Clean the affected tables:
   ```sql
   DELETE FROM Notification WHERE userType IN ('USER', 'VENDOR');
   DELETE FROM Payment WHERE status = 'VERIFIED';
   ```

2. **Option B:** Reset database (loses all data):
   ```bash
   npx prisma migrate reset
   ```

---

## 📝 Next Steps

1. Choose your migration option above
2. Run the migration
3. Run the seed
4. Test the application

---

**Status:** ⚠️ **AWAITING MIGRATION**  
**Action Required:** Run migration command




