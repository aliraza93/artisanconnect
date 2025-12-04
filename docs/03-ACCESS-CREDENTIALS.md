# ArtisanConnect SA - Access Credentials & Configuration

**Version:** 1.0  
**Last Updated:** December 4, 2025  
**Classification:** CONFIDENTIAL

---

## IMPORTANT SECURITY NOTICE

This document contains sensitive access information. Please:
- Store this document securely
- Never share credentials via email or unencrypted channels
- Rotate passwords after receiving this document
- Remove temporary/test accounts in production

---

## Table of Contents

1. [Test User Accounts](#1-test-user-accounts)
2. [Database Access](#2-database-access)
3. [Hosting & Platform Access](#3-hosting--platform-access)
4. [Environment Variables](#4-environment-variables)
5. [Third-Party Services](#5-third-party-services)
6. [Domain Management](#6-domain-management)
7. [Security Recommendations](#7-security-recommendations)

---

## 1. Test User Accounts

The following test accounts have been created for testing purposes. **Change these passwords immediately in production.**

### Client (Homeowner) Test Account

| Field | Value |
|-------|-------|
| Email | `test@example.com` |
| Password | `password123` |
| Role | Client |
| Purpose | Testing job posting, quote acceptance, payments |

### Artisan Test Account

| Field | Value |
|-------|-------|
| Email | `artisan@example.com` |
| Password | `password123` |
| Role | Artisan |
| Category | Plumbing |
| Purpose | Testing quote submission, job management |

### Administrator Account

| Field | Value |
|-------|-------|
| Email | `admin@artisanconnect.co.za` |
| Password | `admin123` |
| Role | Admin |
| Purpose | Platform management, dispute resolution, revenue management |

### Creating New Admin Accounts

To create additional admin accounts:

1. Register a new user via the signup form
2. Access the database directly
3. Update the user's role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'newemail@example.com';
```

---

## 2. Database Access

### PostgreSQL Database (Neon)

The application uses Neon PostgreSQL database provided by Replit.

| Parameter | Value |
|-----------|-------|
| Host | Available in `PGHOST` environment variable |
| Port | Available in `PGPORT` environment variable |
| Database | Available in `PGDATABASE` environment variable |
| Username | Available in `PGUSER` environment variable |
| Password | Available in `PGPASSWORD` environment variable |
| Connection String | Available in `DATABASE_URL` environment variable |

### Accessing the Database

**Via Replit:**
1. Open the Replit project
2. Navigate to the "Database" tab in the left sidebar
3. Use the built-in database explorer

**Via External Tool (e.g., pgAdmin, DBeaver):**
1. Get credentials from Replit environment variables
2. Create a new connection with the credentials
3. Connect using SSL (required for Neon)

**Via Command Line:**
```bash
# Using the DATABASE_URL environment variable
psql $DATABASE_URL
```

### Database Backup

To backup the database:

```bash
# Export data
pg_dump $DATABASE_URL > backup.sql

# Restore data
psql $DATABASE_URL < backup.sql
```

---

## 3. Hosting & Platform Access

### Replit Account

The application is hosted on Replit.

| Field | Notes |
|-------|-------|
| Platform | Replit (replit.com) |
| Project URL | The URL where your Repl is hosted |
| Access | Owner has full access to the workspace |

### Accessing the Project

1. Log into Replit with the project owner's account
2. Navigate to the project
3. You have access to:
   - Code editor
   - Console/Terminal
   - Environment variables (Secrets)
   - Database
   - Deployment settings

### Deployment

The application auto-deploys when code changes are pushed. To manually deploy:

1. Open the project in Replit
2. Ensure the "Start application" workflow is running
3. For production deployment, use the "Deploy" button

---

## 4. Environment Variables

All sensitive configuration is stored as Replit Secrets (environment variables).

### Current Environment Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `DATABASE_URL` | Full PostgreSQL connection string | Replit Secrets |
| `PGHOST` | Database host | Replit Secrets |
| `PGDATABASE` | Database name | Replit Secrets |
| `PGUSER` | Database username | Replit Secrets |
| `PGPASSWORD` | Database password | Replit Secrets |
| `PGPORT` | Database port | Replit Secrets |

### Adding/Modifying Environment Variables

1. Open the Replit project
2. Click on "Secrets" in the Tools panel (lock icon)
3. Add or edit the required variable
4. Restart the application for changes to take effect

### Environment Variables to Add for Production

| Variable | Description | Recommended Value |
|----------|-------------|-------------------|
| `SESSION_SECRET` | Session encryption key | Generate a random 64-character string |
| `NODE_ENV` | Environment mode | `production` |

---

## 5. Third-Party Services

### Currently Integrated

The platform currently uses only built-in Replit services:
- **Database:** Neon PostgreSQL (via Replit)
- **Hosting:** Replit

### Services to Configure for Production

#### Payment Gateway (Recommended: PayFast)

For actual payment processing in South Africa, integrate PayFast:

| Configuration | Notes |
|---------------|-------|
| Merchant ID | Register at payfast.co.za |
| Merchant Key | Provided after registration |
| Passphrase | Set in PayFast dashboard |
| Sandbox URL | `https://sandbox.payfast.co.za` |
| Production URL | `https://www.payfast.co.za` |

*Note: Current escrow system is simulated. Integration with actual payment provider required for real transactions.*

#### Email Service (Recommended: SendGrid or Resend)

For notification emails:

| Configuration | Notes |
|---------------|-------|
| API Key | Register at provider's website |
| From Email | Configure verified sender |
| Templates | Create for signup, job updates, etc. |

#### SMS Service (Recommended: Twilio or Clickatell)

For SMS notifications:

| Configuration | Notes |
|---------------|-------|
| Account SID | Register at provider's website |
| Auth Token | Provided after registration |
| From Number | Purchase or configure |

---

## 6. Domain Management

### Current Domain

The application is accessible via the Replit-provided URL.

### Custom Domain Setup

To configure a custom domain:

1. **Register Domain:** Purchase domain from registrar (e.g., domains.co.za)
2. **Configure DNS:**
   - Add CNAME record pointing to Replit domain
   - Or configure A record with Replit IP
3. **Update Replit:**
   - Go to project settings
   - Add custom domain
   - Verify ownership
4. **SSL Certificate:**
   - Replit provides automatic SSL
   - Certificate renews automatically

### Recommended Domains

- `artisanconnect.co.za` (primary)
- `artisanconnect.com` (redirect)
- `www.artisanconnect.co.za` (redirect)

---

## 7. Security Recommendations

### Immediate Actions After Handover

1. **Change All Test Passwords**
   ```sql
   -- Update via database after hashing new password
   -- Use bcrypt to hash: bcrypt.hash('newpassword', 10)
   UPDATE users SET password = 'hashed_password' WHERE email = 'admin@artisanconnect.co.za';
   ```

2. **Generate New Session Secret**
   ```bash
   # Generate random secret
   openssl rand -hex 32
   ```

3. **Remove Test Accounts**
   ```sql
   DELETE FROM users WHERE email IN ('test@example.com', 'artisan@example.com');
   ```

4. **Set NODE_ENV to Production**
   - Add `NODE_ENV=production` to environment variables

### Ongoing Security Measures

1. **Regular Password Rotation**
   - Rotate admin passwords every 90 days
   - Rotate database credentials every 180 days

2. **Access Control**
   - Limit admin account access
   - Use separate accounts for different admins
   - Log all admin actions

3. **Backup Schedule**
   - Daily automated database backups
   - Weekly manual verification
   - Store backups offsite

4. **Monitoring**
   - Set up uptime monitoring
   - Configure error alerting
   - Review access logs regularly

---

## Credential Handover Checklist

Before handover completion, ensure:

- [ ] All test passwords have been changed
- [ ] New admin account created with secure password
- [ ] Database credentials verified working
- [ ] Replit access transferred to new owner
- [ ] Domain configured (if applicable)
- [ ] Payment gateway configured (if applicable)
- [ ] Email service configured (if applicable)
- [ ] Backup system tested
- [ ] This document stored securely

---

*Document End*

**Note:** This document should be updated whenever credentials are changed or new services are added.
