# ArtisanConnect SA - Technical Handover Document

**Version:** 1.0  
**Last Updated:** December 4, 2025

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Database Structure](#4-database-structure)
5. [API Documentation](#5-api-documentation)
6. [Authentication & Security](#6-authentication--security)
7. [Frontend Structure](#7-frontend-structure)
8. [Hosting & Deployment](#8-hosting--deployment)
9. [Environment Configuration](#9-environment-configuration)

---

## 1. System Overview

### Purpose

ArtisanConnect SA is a marketplace Progressive Web Application (PWA) connecting South African homeowners with vetted artisans and logistics providers.

### Core Features

- User registration and authentication (Client, Artisan, Admin roles)
- Job posting and management
- Quote submission and acceptance
- Escrow payment system with 20% commission
- Real-time messaging
- Review and rating system
- Dispute resolution
- Admin dashboard for platform management

### StoryBrand Framework

The platform follows Donald Miller's StoryBrand framework:
- **Hero:** The homeowner seeking reliable services
- **Problem:** Difficulty finding trustworthy artisans
- **Guide:** ArtisanConnect SA as the trusted platform
- **Plan:** Simple 3-step process (Post → Connect → Complete)
- **Success:** Quality work completed with peace of mind

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| TailwindCSS | 4.x | Styling |
| Shadcn/UI | Latest | Component Library |
| Wouter | Latest | Routing |
| TanStack Query | 5.x | Data Fetching |
| Framer Motion | Latest | Animations |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.x | Web Framework |
| TypeScript | 5.x | Type Safety |
| Passport.js | Latest | Authentication |
| bcryptjs | Latest | Password Hashing |

### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15.x | Database (Neon-backed) |
| Drizzle ORM | Latest | Object-Relational Mapping |
| drizzle-zod | Latest | Schema Validation |

### DevOps

| Technology | Purpose |
|------------|---------|
| Replit | Hosting Platform |
| Git | Version Control |
| npm | Package Management |

---

## 3. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React PWA (Vite)                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │  Pages  │ │Components│ │  Hooks  │ │  Utils  │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│  │                     │                                │    │
│  │              API Client (fetch)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Express.js Application                   │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │  Routes │ │Middleware│ │  Auth   │ │ Storage │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│  │                     │                                │    │
│  │              Drizzle ORM                             │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ SQL
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Neon)                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │  Users  │ │  Jobs   │ │ Quotes  │ │Payments │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
artisanconnect-sa/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/          # Login/Signup modals
│   │   │   ├── chat/          # Messaging components
│   │   │   ├── layout/        # Layout, Navbar, Footer
│   │   │   └── ui/            # Shadcn/UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities, API client, Auth context
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin dashboard
│   │   │   └── ...            # Other pages
│   │   ├── App.tsx            # Main app with routing
│   │   ├── index.css          # Global styles
│   │   └── main.tsx           # Entry point
│   └── index.html             # HTML template
├── server/                    # Backend application
│   ├── auth.ts                # Passport authentication setup
│   ├── db.ts                  # Database connection
│   ├── index.ts               # Server entry point
│   ├── middleware.ts          # Auth middleware
│   ├── routes.ts              # API routes
│   ├── storage.ts             # Database operations
│   └── vite.ts                # Vite dev server integration
├── shared/                    # Shared code
│   └── schema.ts              # Database schema & types
├── docs/                      # Documentation
├── drizzle.config.ts          # Drizzle ORM configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── replit.md                  # Project documentation
```

---

## 4. Database Structure

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│      users       │       │ artisan_profiles │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ userId (FK)      │
│ email            │       │ category         │
│ password         │       │ bio              │
│ fullName         │       │ skills[]         │
│ phone            │       │ certifications[] │
│ role             │       │ yearsExperience  │
│ verified         │       │ location         │
│ rating           │       │ verified         │
│ createdAt        │       └──────────────────┘
└──────────────────┘
        │
        │ clientId
        ▼
┌──────────────────┐       ┌──────────────────┐
│      jobs        │       │     quotes       │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ jobId (FK)       │
│ clientId (FK)    │       │ artisanId (FK)   │
│ title            │       │ amount           │
│ description      │       │ message          │
│ category         │       │ status           │
│ location         │       │ createdAt        │
│ budget           │       └──────────────────┘
│ status           │
│ needsLogistics   │
│ createdAt        │
│ updatedAt        │
└──────────────────┘
        │
        │ jobId
        ▼
┌──────────────────┐       ┌──────────────────┐
│    payments      │       │    disputes      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ jobId (FK)       │       │ jobId (FK)       │
│ clientId (FK)    │       │ clientId (FK)    │
│ artisanId (FK)   │       │ artisanId (FK)   │
│ totalAmount      │       │ issue            │
│ platformFee (20%)│       │ description      │
│ artisanAmount    │       │ status           │
│ status           │       │ resolution       │
│ escrowReleaseDate│       │ createdAt        │
│ createdAt        │       │ resolvedAt       │
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│    messages      │       │     reviews      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ senderId (FK)    │       │ jobId (FK)       │
│ recipientId (FK) │       │ reviewerId (FK)  │
│ jobId (FK)       │       │ revieweeId (FK)  │
│ content          │       │ rating (1-5)     │
│ read             │       │ comment          │
│ createdAt        │       │ createdAt        │
└──────────────────┘       └──────────────────┘
```

### Enums

```sql
-- User roles
user_role: 'client' | 'artisan' | 'logistics' | 'admin'

-- Job statuses
job_status: 'open' | 'quoted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'

-- Quote statuses
quote_status: 'pending' | 'accepted' | 'rejected'

-- Payment statuses
payment_status: 'pending' | 'held_escrow' | 'released' | 'refunded'

-- Dispute statuses
dispute_status: 'open' | 'investigating' | 'resolved' | 'closed'
```

### Schema Migrations

Database migrations are managed via Drizzle ORM:

```bash
# Push schema changes to database
npm run db:push

# Force push (use with caution)
npm run db:push --force
```

---

## 5. API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

#### POST /api/auth/signup

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "phone": "+27123456789",
  "role": "client"
}
```

Response (201):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "client",
  "verified": false
}
```

### Job Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/jobs` | Create new job | Client |
| GET | `/api/jobs/open` | List open jobs | Yes |
| GET | `/api/jobs/my-jobs` | Get client's jobs | Client |
| GET | `/api/jobs/:id` | Get single job | Yes |
| PATCH | `/api/jobs/:id` | Update job | Client/Admin |

#### POST /api/jobs

Request:
```json
{
  "title": "Fix leaking tap",
  "description": "Kitchen tap has been leaking for a week",
  "category": "Plumbing",
  "location": "Cape Town, Western Cape",
  "budget": "500",
  "needsLogistics": false
}
```

### Quote Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/quotes` | Submit quote | Artisan |
| GET | `/api/jobs/:jobId/quotes` | Get job quotes | Yes |
| GET | `/api/quotes/my-quotes` | Get artisan's quotes | Artisan |
| PATCH | `/api/quotes/:id/accept` | Accept quote | Client |

#### POST /api/quotes

Request:
```json
{
  "jobId": "uuid",
  "amount": "450",
  "message": "I can fix this within 2 hours"
}
```

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/jobs/:jobId/payments` | Get job payments | Yes |
| PATCH | `/api/payments/:id/release` | Release payment | Client/Admin |

### Message Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/messages` | Send message | Yes |
| GET | `/api/messages/:userId` | Get conversation | Yes |
| GET | `/api/conversations` | List conversations | Yes |
| PATCH | `/api/messages/:id/read` | Mark as read | Yes |

### Review Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/reviews` | Create review | Yes |
| GET | `/api/users/:userId/reviews` | Get user reviews | No |

### Dispute Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/disputes` | Open dispute | Yes |
| GET | `/api/admin/disputes` | List all disputes | Admin |
| PATCH | `/api/admin/disputes/:id` | Update dispute | Admin |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/revenue` | Get platform revenue | Admin |
| GET | `/api/admin/disputes` | List disputes | Admin |
| PATCH | `/api/admin/disputes/:id` | Update dispute | Admin |

### Artisan Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/artisans` | List by category | No |
| GET | `/api/artisans/:userId/profile` | Get profile | No |

---

## 6. Authentication & Security

### Authentication Flow

1. User submits credentials via login form
2. Server validates against hashed password in database
3. On success, session is created and stored in PostgreSQL
4. Session cookie is sent to client
5. Subsequent requests include session cookie
6. Server validates session on each protected request

### Password Security

- Passwords are hashed using bcrypt with salt rounds of 10
- Passwords are never stored in plain text
- Passwords are never returned in API responses

### Session Management

- Sessions stored in PostgreSQL via `connect-pg-simple`
- Session expiry: 24 hours
- Secure cookies in production
- HTTP-only cookies prevent XSS

### Role-Based Access Control

```typescript
// Middleware functions
isAuthenticated    // Any logged-in user
requireClient      // Client role only
requireArtisan     // Artisan role only
requireAdmin       // Admin role only
```

### Security Best Practices Implemented

1. Password hashing with bcrypt
2. Session-based authentication
3. Role-based middleware protection
4. Input validation with Zod schemas
5. SQL injection prevention via Drizzle ORM
6. No sensitive data in responses

### Recommended Security Enhancements

1. Add rate limiting to prevent brute force
2. Implement HTTPS in production
3. Add CSRF protection
4. Implement password complexity requirements
5. Add two-factor authentication
6. Regular security audits

---

## 7. Frontend Structure

### Routing (Wouter)

```typescript
// Main routes in App.tsx
/                    → Home page
/find-artisans       → Browse artisans
/how-it-works        → Process explanation
/post-job            → Job posting form (auth required)
/dashboard           → User dashboard (auth required)
/admin/dashboard     → Admin panel (admin required)
```

### State Management

- **Auth State:** React Context (AuthContext)
- **Server State:** TanStack Query for data fetching
- **Local State:** React useState hooks

### API Client

Located in `client/src/lib/api.ts`:

```typescript
export const api = {
  // Auth
  signup(data: SignupData): Promise<User>
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  
  // Jobs
  createJob(data: JobData): Promise<Job>
  getOpenJobs(): Promise<Job[]>
  getMyJobs(): Promise<Job[]>
  
  // Quotes
  submitQuote(data: QuoteData): Promise<Quote>
  getJobQuotes(jobId: string): Promise<Quote[]>
  acceptQuote(quoteId: string): Promise<Quote>
  
  // ... etc
}
```

### Component Library

Using Shadcn/UI components:
- Button, Card, Dialog, Form
- Input, Select, Textarea
- Toast notifications
- Tabs, Accordion
- Avatar, Badge, Skeleton

### Styling

- TailwindCSS for utility-first styling
- Custom CSS variables for theming
- Design tokens defined in `tailwind.config.js`
- Color scheme: Royal Blue (`#1a237e`) and Orange (`#f57c00`)

---

## 8. Hosting & Deployment

### Current Hosting

- **Platform:** Replit
- **Database:** Neon PostgreSQL (via Replit)
- **Domain:** Replit-provided URL

### Deployment Process

1. Code changes are automatically detected
2. Vite builds the frontend
3. Server restarts with new code
4. Zero-downtime deployment

### Production Deployment Commands

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Environment Variables

See [Section 9: Environment Configuration](#9-environment-configuration)

### Scaling Considerations

For high traffic:
1. Database connection pooling (already configured)
2. CDN for static assets
3. Load balancing for multiple instances
4. Redis for session storage

---

## 9. Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://...` |
| PGHOST | Database host | `ep-xxx.neon.tech` |
| PGDATABASE | Database name | `artisanconnect` |
| PGUSER | Database user | `neondb_owner` |
| PGPASSWORD | Database password | `*****` |
| PGPORT | Database port | `5432` |
| SESSION_SECRET | Session encryption key | Random string |
| NODE_ENV | Environment mode | `development` or `production` |

### Database Connection

Managed via Drizzle ORM in `server/db.ts`:

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Session Configuration

In `server/auth.ts`:

```typescript
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

---

*Document End*
