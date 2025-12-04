# ArtisanConnect SA - Maintenance & Update Guidelines

**Version:** 1.0  
**Last Updated:** December 4, 2025

---

## Table of Contents

1. [Development Workflow](#1-development-workflow)
2. [Database Management](#2-database-management)
3. [Deployment Process](#3-deployment-process)
4. [Monitoring & Logging](#4-monitoring--logging)
5. [Backup & Recovery](#5-backup--recovery)
6. [Common Maintenance Tasks](#6-common-maintenance-tasks)
7. [Troubleshooting Guide](#7-troubleshooting-guide)
8. [Future Development Roadmap](#8-future-development-roadmap)
9. [Developer Resources](#9-developer-resources)

---

## 1. Development Workflow

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd artisanconnect-sa
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   - Copy environment variables from Replit Secrets
   - Or configure local `.env` file (not committed to git)

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Frontend: `http://localhost:5000`
   - API: `http://localhost:5000/api`

### Code Standards

#### TypeScript

- All code is written in TypeScript
- Strict mode enabled
- Explicit typing for function parameters and returns

#### File Naming

- Components: PascalCase (`LoginModal.tsx`)
- Utilities: camelCase (`api.ts`)
- Pages: kebab-case (`post-job.tsx`)

#### Component Structure

```typescript
// Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Types
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// Component
export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);
  
  return (
    <div data-testid="my-component">
      <h1>{title}</h1>
      <Button onClick={onAction} data-testid="action-button">
        Click Me
      </Button>
    </div>
  );
}
```

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Commit Message Format**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `style:` Formatting
   - `refactor:` Code restructure
   - `test:` Adding tests
   - `chore:` Maintenance

4. **Push and Review**
   ```bash
   git push origin feature/new-feature-name
   ```

---

## 2. Database Management

### Schema Changes

The application uses Drizzle ORM for database management.

**Schema Location:** `shared/schema.ts`

#### Making Schema Changes

1. **Edit Schema File**
   ```typescript
   // shared/schema.ts
   export const users = pgTable('users', {
     // Add new column
     newField: text('new_field'),
   });
   ```

2. **Push Changes to Database**
   ```bash
   npm run db:push
   ```

3. **If Conflicts Occur**
   ```bash
   npm run db:push --force
   ```
   *Warning: Force push can cause data loss. Backup first!*

#### Important Rules

- **NEVER change primary key types** (serial ↔ varchar)
- **Always backup before schema changes**
- **Test changes in development first**

### Database Queries

For ad-hoc database operations:

```bash
# Connect to database
psql $DATABASE_URL

# Common queries
SELECT * FROM users WHERE role = 'admin';
SELECT COUNT(*) FROM jobs WHERE status = 'open';
SELECT SUM(CAST(platform_fee AS DECIMAL)) FROM payments WHERE status = 'released';
```

### Adding New Tables

1. Define table in `shared/schema.ts`:
   ```typescript
   export const newTable = pgTable('new_table', {
     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
     name: text('name').notNull(),
     createdAt: timestamp('created_at').notNull().defaultNow(),
   });
   
   export const insertNewTableSchema = createInsertSchema(newTable).omit({ id: true, createdAt: true });
   export type InsertNewTable = z.infer<typeof insertNewTableSchema>;
   export type NewTable = typeof newTable.$inferSelect;
   ```

2. Add storage methods in `server/storage.ts`

3. Add API routes in `server/routes.ts`

4. Push schema: `npm run db:push`

---

## 3. Deployment Process

### Automatic Deployment (Replit)

Replit automatically deploys when code changes are detected:

1. Save your code changes
2. The workflow restarts automatically
3. Changes are live within seconds

### Manual Deployment Steps

1. **Verify Code Works Locally**
   ```bash
   npm run dev
   # Test all features
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Check for Errors**
   - Review console output
   - Check for TypeScript errors
   - Verify all imports resolve

4. **Deploy**
   - In Replit: Click "Deploy" button
   - Changes go live immediately

### Rollback Procedure

If issues occur after deployment:

1. **In Replit:**
   - Use version history to revert
   - Or restore from checkpoint

2. **Via Git:**
   ```bash
   git revert HEAD
   git push
   ```

### Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] No TypeScript errors
- [ ] Database schema up to date
- [ ] Environment variables configured
- [ ] Sensitive data not exposed
- [ ] Performance acceptable

---

## 4. Monitoring & Logging

### Application Logs

View logs in Replit:
1. Open the Console tab
2. Logs appear in real-time
3. Filter by log level if needed

### Log Levels

```typescript
console.log()    // General info
console.info()   // Informational
console.warn()   // Warnings
console.error()  // Errors
```

### Key Logs to Monitor

```
// Authentication
"[express] POST /api/auth/login 200"    // Successful login
"[express] POST /api/auth/login 401"    // Failed login

// API Requests
"[express] POST /api/jobs 201"          // Job created
"[express] POST /api/quotes 201"        // Quote submitted

// Errors
"Error: ..."                            // Application errors
```

### Recommended Monitoring Setup

1. **Uptime Monitoring**
   - Use UptimeRobot or similar
   - Check every 5 minutes
   - Alert on downtime

2. **Error Tracking**
   - Consider adding Sentry
   - Captures errors with stack traces
   - Alerts on new errors

3. **Performance Monitoring**
   - Monitor response times
   - Track database query performance
   - Set alerts for slow responses

---

## 5. Backup & Recovery

### Database Backups

#### Manual Backup

```bash
# Full database export
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Specific table
pg_dump $DATABASE_URL -t users > users_backup.sql
```

#### Scheduled Backups

Set up automated backups:

```bash
# Add to cron (external server)
0 2 * * * pg_dump $DATABASE_URL > /backups/daily_$(date +\%Y\%m\%d).sql
```

### Recovery Procedures

#### Restore from Backup

```bash
# Full restore (WARNING: Overwrites all data)
psql $DATABASE_URL < backup_20251204.sql

# Restore specific table
psql $DATABASE_URL < users_backup.sql
```

#### Point-in-Time Recovery

1. Identify the timestamp to restore to
2. Contact Neon support for point-in-time recovery
3. Follow their restoration process

### Backup Best Practices

1. **Backup Schedule**
   - Daily: Full database backup
   - Weekly: Verify backup integrity
   - Monthly: Test restore procedure

2. **Storage**
   - Keep backups for 30 days
   - Store offsite (different cloud provider)
   - Encrypt sensitive backups

3. **Testing**
   - Regularly test restore process
   - Document recovery time
   - Maintain runbook

---

## 6. Common Maintenance Tasks

### Adding a New Admin User

```sql
-- First, create user via signup form, then:
UPDATE users SET role = 'admin' WHERE email = 'new.admin@example.com';
```

### Resetting User Password

```javascript
// Generate new hash (Node.js)
const bcrypt = require('bcryptjs');
const newHash = await bcrypt.hash('newPassword123', 10);
console.log(newHash);
```

```sql
-- Update in database
UPDATE users SET password = '<hashed_password>' WHERE email = 'user@example.com';
```

### Cleaning Up Old Data

```sql
-- Remove cancelled jobs older than 90 days
DELETE FROM jobs 
WHERE status = 'cancelled' 
AND created_at < NOW() - INTERVAL '90 days';

-- Archive completed jobs (move to archive table if created)
-- Implement as needed
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update a specific package
npm update <package-name>

# Update all packages (with caution)
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Session Cleanup

```sql
-- Remove expired sessions
DELETE FROM session WHERE expire < NOW();
```

---

## 7. Troubleshooting Guide

### Application Won't Start

**Symptoms:** Application crashes immediately

**Solutions:**
1. Check console for error messages
2. Verify environment variables are set
3. Test database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```
4. Check for syntax errors in recent changes
5. Restart the workflow

### Database Connection Issues

**Symptoms:** "Connection refused" or timeout errors

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check Neon database status
3. Verify IP/firewall rules
4. Restart application
5. Contact Neon support if persistent

### Authentication Problems

**Symptoms:** Users can't log in

**Solutions:**
1. Check session table in database
2. Verify password hashing is working
3. Clear browser cookies
4. Check session middleware configuration
5. Review auth logs for specific errors

### Slow Performance

**Symptoms:** Pages load slowly

**Solutions:**
1. Check database query performance:
   ```sql
   SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
   ```
2. Add database indexes if needed
3. Implement caching for frequent queries
4. Review frontend bundle size
5. Enable compression

### 500 Internal Server Error

**Symptoms:** Generic server error

**Solutions:**
1. Check server logs for stack trace
2. Identify the failing endpoint
3. Test with minimal data
4. Check for null/undefined values
5. Verify database constraints

---

## 8. Future Development Roadmap

### Short-Term Improvements (1-3 months)

1. **PWA Enhancement**
   - Add service worker for offline support
   - Implement push notifications
   - Optimize for mobile installation

2. **Payment Integration**
   - Integrate PayFast for actual payments
   - Implement automatic escrow release
   - Add payment history and receipts

3. **Email Notifications**
   - Set up transactional email service
   - Send notifications for key events
   - Add email templates

### Medium-Term Features (3-6 months)

1. **Real-Time Messaging**
   - Upgrade to WebSocket for instant messages
   - Add typing indicators
   - Implement message notifications

2. **Advanced Search**
   - Add location-based artisan search
   - Implement filters and sorting
   - Add search suggestions

3. **Mobile App**
   - Create native iOS/Android app
   - Or enhance PWA capabilities
   - Add biometric authentication

### Long-Term Vision (6-12 months)

1. **Logistics Integration**
   - Partner with logistics providers
   - Implement delivery tracking
   - Add material ordering

2. **AI Features**
   - Smart job matching
   - Price estimation
   - Fraud detection

3. **Analytics Dashboard**
   - Platform metrics
   - User behavior insights
   - Revenue analytics

---

## 9. Developer Resources

### Documentation

- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Drizzle ORM:** https://orm.drizzle.team/docs/
- **TailwindCSS:** https://tailwindcss.com/docs
- **Shadcn/UI:** https://ui.shadcn.com/

### Code References

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database schema definitions |
| `server/routes.ts` | API endpoint definitions |
| `server/storage.ts` | Database operations |
| `client/src/lib/api.ts` | Frontend API client |
| `client/src/lib/auth-context.tsx` | Authentication state |

### Testing

Currently, the application uses manual testing. Recommended testing setup:

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react

# Add test script to package.json
"test": "vitest"
```

### Support Channels

- **Replit Support:** https://replit.com/support
- **Neon Support:** https://neon.tech/docs
- **Stack Overflow:** For general development questions

---

## Appendix: Quick Reference Commands

```bash
# Development
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server

# Database
npm run db:push       # Push schema changes
npm run db:push --force  # Force push (careful!)

# Git
git status            # Check changes
git pull              # Get latest
git push              # Push changes

# Database CLI
psql $DATABASE_URL    # Connect to database

# Backup
pg_dump $DATABASE_URL > backup.sql   # Backup
psql $DATABASE_URL < backup.sql      # Restore
```

---

*Document End*
