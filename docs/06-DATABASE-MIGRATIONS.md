# Database Migration Guide for Render

This guide explains how to manage database migrations when deploying to Render.

## Overview

Your application uses:
- **Drizzle ORM** with `db:push` for schema synchronization
- **Stripe migrations** for Stripe-related tables
- **Manual migrations** for specific schema changes

## Migration Strategy

### For Render Deployment

Render will automatically run migrations before starting your app using the **Pre-Deploy Command**.

## Setup Instructions

### 1. Configure Render Pre-Deploy Command

In your Render dashboard:

1. Go to your service → **Settings** → **Build & Deploy**
2. Set **Pre-Deploy Command** to:
   ```bash
   npm run migrate
   ```
3. Click **Save Changes**

This ensures migrations run automatically before each deployment.

### 2. Manual Migration Execution

If you need to run migrations manually:

**On Render (via Shell):**
1. Go to your service → **Shell**
2. Run:
   ```bash
   npm run migrate
   ```

**Locally:**
```bash
npm run migrate
```

## Migration Types

### 1. Schema Changes (Drizzle)

For schema changes, use Drizzle's `db:push`:

```bash
# 1. Edit shared/schema.ts
# 2. Push changes to database
npm run db:push

# If conflicts occur (use with caution!)
npm run db:push --force
```

**Important:**
- Always test schema changes locally first
- Backup your database before force pushes
- Never change primary key types

### 2. Stripe Migrations

Stripe migrations run automatically via the `migrate` script. These handle:
- Stripe customer tables
- Payment intent tracking
- Webhook event storage

### 3. Manual Migrations

For complex migrations, use the manual migration script:

```bash
npm run migrate:manual
```

This script handles:
- Session table creation
- Address columns on jobs table
- Other one-time schema updates

## Migration Script Details

The `script/run-migrations.ts` script:

1. ✅ Runs Stripe schema migrations
2. ✅ Ensures session table exists
3. ✅ Creates required indexes
4. ✅ Handles errors gracefully

## Workflow Examples

### Adding a New Column

```bash
# 1. Edit shared/schema.ts
export const users = pgTable('users', {
  // ... existing columns
  newField: text('new_field'),  // Add new column
});

# 2. Push to database
npm run db:push

# 3. Commit and push to Git
git add shared/schema.ts
git commit -m "feat: add new_field to users table"
git push

# 4. Render will automatically:
#    - Build the app
#    - Run migrations (Pre-Deploy Command)
#    - Start the app
```

### Adding a New Table

```bash
# 1. Edit shared/schema.ts
export const newTable = pgTable('new_table', {
  id: varchar('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

# 2. Push to database
npm run db:push

# 3. Commit and push
git add shared/schema.ts
git commit -m "feat: add new_table"
git push
```

## Troubleshooting

### Migration Fails on Render

**Error: "DATABASE_URL not set"**
- Ensure `DATABASE_URL` is set in Render's Environment variables
- Check that your Render PostgreSQL database is provisioned

**Error: "Stripe migrations failed"**
- This is usually non-critical (migrations might already be applied)
- Check Render logs for specific error messages
- Stripe migrations are idempotent (safe to run multiple times)

**Error: "Table already exists"**
- This is normal if migrations have already run
- The script handles this gracefully

### Rollback Strategy

If a migration causes issues:

1. **For Drizzle schema changes:**
   ```bash
   # Revert the schema change in shared/schema.ts
   # Then push again
   npm run db:push
   ```

2. **For manual migrations:**
   - Create a new migration script to reverse the changes
   - Run it manually via Render Shell

3. **Database backup:**
   ```bash
   # Always backup before major migrations
   pg_dump $DATABASE_URL > backup.sql
   ```

## Best Practices

1. ✅ **Always test migrations locally first**
2. ✅ **Backup database before major changes**
3. ✅ **Use `db:push` for schema changes (not manual SQL)**
4. ✅ **Commit migration scripts with code changes**
5. ✅ **Monitor Render logs after deployment**
6. ✅ **Run migrations in Pre-Deploy Command (not at runtime)**

## Environment Variables Required

Ensure these are set in Render:

- `DATABASE_URL` - PostgreSQL connection string (auto-set by Render if using Render PostgreSQL)
- `STRIPE_SECRET_KEY` - For Stripe migrations
- `NODE_ENV` - Set to `production`

## Migration Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run migrate` | Run all migrations (for Render) |
| `npm run db:push` | Push schema changes to database |
| `npm run migrate:manual` | Run manual migration script |
| `npm run db:reset` | ⚠️ Reset entire database (development only) |

## Additional Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/)
- [Render Database Docs](https://render.com/docs/databases)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)

---

**Note:** The migration script is designed to be idempotent - it's safe to run multiple times without causing issues.

