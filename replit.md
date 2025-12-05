# ArtisanConnect SA - Production Marketplace Platform

## Overview
ArtisanConnect SA is a production-ready Progressive Web App (PWA) marketplace connecting South African homeowners with vetted artisans (plumbers, electricians) and logistics providers. The platform uses Donald Miller's StoryBrand framework for messaging, emphasizing trust, competence, and ease of use.

**Platform Model:** 20% commission on all transactions with escrow payment system  
**Last Updated:** December 4, 2025

## Recent Changes

### December 5, 2025 - Platform Enhancements
- ✅ WebSocket real-time messaging infrastructure (server/websocket.ts, client/src/lib/websocket.tsx)
- ✅ PWA configuration complete (manifest.json, service worker, install prompt, offline support)
- ✅ Stripe payment integration with escrow system
- ✅ Object storage for job images using Replit's built-in storage
- ✅ Image upload component (client/src/components/ObjectUploader.tsx)
- ✅ Job posting page with image upload support
- ⏭️ Email notifications (SendGrid) - User dismissed integration
- ⏭️ SMS notifications (Twilio) - User dismissed integration

### December 4, 2025 - Full Frontend-Backend Integration Complete
- ✅ PostgreSQL database provisioned with complete schema
- ✅ Authentication system implemented with passport-local and bcrypt
- ✅ Role-based access control (client, artisan, logistics, admin)
- ✅ Complete API routes for all marketplace operations
- ✅ Session management with PostgreSQL store
- ✅ Frontend authentication integrated (login/signup modals)
- ✅ Navbar updated with user menu and logout functionality
- ✅ API client library created for frontend-backend communication
- ✅ Authentication context provider for global user state
- ✅ Post-job page connected to job submission API
- ✅ Dashboard showing real jobs and quotes from database
- ✅ Admin dashboard showing real platform revenue and disputes
- ✅ Error handling with user-friendly toast notifications
- ✅ Complete handover documentation package created

### Documentation Package (docs/ folder)
- `00-HANDOVER-SUMMARY.md` - Executive summary and quick start
- `01-USER-ADMIN-MANUAL.md` - User and admin operation guide
- `02-TECHNICAL-HANDOVER.md` - Architecture, database, API docs
- `03-ACCESS-CREDENTIALS.md` - All credentials and configuration
- `04-MAINTENANCE-GUIDE.md` - Maintenance and update guidelines

## User Roles & Permissions

### Client (Homeowner)
- Post jobs and job requirements
- Review quotes from artisans
- Accept quotes and manage payments
- Chat with artisans
- Leave reviews after job completion

### Artisan (Service Provider)
- Browse open jobs
- Submit quotes to clients
- Manage accepted jobs
- Chat with clients
- View earnings and payment history

### Logistics Provider
- View jobs requiring material delivery
- Submit quotes for logistics services
- Track deliveries

### Admin
- Monitor all transactions and platform activity
- Manage disputes
- View platform revenue and analytics
- Access admin dashboard with financial controls
- Monitor chat conversations for support

## Project Architecture

### Technology Stack
- **Frontend:** React 18, Vite, TailwindCSS, Radix UI, Wouter (routing)
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon-backed) with Drizzle ORM
- **Authentication:** Passport.js (Local Strategy) with bcrypt
- **Session:** express-session with connect-pg-simple (PostgreSQL store)
- **Real-time:** WebSocket-ready for future chat features

### Database Schema

#### Core Tables
1. **users** - All platform users with role field (client, artisan, logistics, admin)
2. **artisan_profiles** - Extended profiles for artisans (skills, certifications, location)
3. **jobs** - Job postings from clients
4. **quotes** - Quotes submitted by artisans for jobs
5. **payments** - Escrow payment tracking with 20% platform fee
6. **messages** - In-app messaging between users
7. **reviews** - Rating and review system
8. **disputes** - Dispute management for admin resolution

#### Key Design Decisions
- UUID-based primary keys (`varchar` with `gen_random_uuid()`)
- Using text fields for monetary amounts to avoid decimal precision issues
- Enum types for statuses (job_status, quote_status, payment_status, dispute_status)
- Session table automatically created by connect-pg-simple

### API Endpoints

#### Authentication Routes
- `POST /api/auth/signup` - User registration (with optional artisan profile)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current authenticated user

#### Job Management
- `POST /api/jobs` - Create job (client only)
- `GET /api/jobs/open` - Get all open jobs
- `GET /api/jobs/my-jobs` - Get jobs by current client
- `GET /api/jobs/:id` - Get single job
- `PATCH /api/jobs/:id` - Update job (owner or admin)

#### Quote Management
- `POST /api/quotes` - Submit quote (artisan only)
- `GET /api/jobs/:jobId/quotes` - Get quotes for a job
- `GET /api/quotes/my-quotes` - Get artisan's quotes
- `PATCH /api/quotes/:id/accept` - Accept quote (auto-creates escrow payment)

#### Payment & Revenue
- `GET /api/jobs/:jobId/payments` - Get payments for a job
- `PATCH /api/payments/:id/release` - Release payment from escrow
- `GET /api/admin/revenue` - Get platform revenue (admin only)

#### Messaging
- `POST /api/messages` - Send message
- `GET /api/messages/:userId` - Get conversation with user
- `GET /api/conversations` - Get all conversations
- `PATCH /api/messages/:id/read` - Mark message as read

#### Reviews & Ratings
- `POST /api/reviews` - Create review (auto-updates user rating)
- `GET /api/users/:userId/reviews` - Get reviews for a user

#### Dispute Management
- `POST /api/disputes` - Create dispute
- `GET /api/admin/disputes` - Get all disputes (admin only)
- `PATCH /api/admin/disputes/:id` - Update dispute (admin only)

#### Artisan Directory
- `GET /api/artisans?category=electrician` - Get artisans by category
- `GET /api/artisans/:userId/profile` - Get artisan profile

### Payment Flow
1. Client posts job → `status: 'open'`
2. Artisan submits quote → `job.status: 'quoted'`
3. Client accepts quote → `job.status: 'in_progress'` + Payment created with `status: 'held_escrow'`
4. Artisan completes work
5. Client releases payment → `payment.status: 'released'` + `job.status: 'completed'`
6. Platform fee (20%) automatically calculated and tracked

### Security Features
- Password hashing with bcrypt (10 salt rounds)
- HTTP-only session cookies
- Role-based access control middleware
- CSRF protection via session
- Input validation with Zod schemas

## Design System

### Brand Identity (StoryBrand Framework)
- **Problem:** Homeowners can't find reliable, trustworthy service providers
- **Solution:** Vetted artisans with transparent pricing and escrow protection
- **Plan:** Simple 3-step process (Post Job → Get Quotes → Choose & Pay Safely)

### Color Scheme
- **Primary:** Royal Blue (#2563EB)
- **Accent:** Orange (#F97316)
- **Typography:** Montserrat (headings), Inter (body)

### Key UI Pages
- Landing page with StoryBrand messaging
- Client dashboard (jobs, messages, payments)
- Artisan dashboard (browse jobs, my quotes, earnings)
- Admin panel (revenue, disputes, user monitoring)
- In-app chat interface with admin monitoring

## User Preferences
- None specified yet

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` - Session encryption key (default: change in production)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Development Commands
- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes to database
- `npm run build` - Build for production
- `npm start` - Start production server

## Next Steps (Priority Order)
1. **Dashboard & Page Integration** - Connect remaining pages to APIs
   - ✅ Authentication flows complete (signup, login, logout)
   - 🔄 Connect job posting page to backend
   - 🔄 Wire dashboard to show real jobs and quotes
   - 🔄 Integrate messaging system with real-time updates
   - 🔄 Connect admin dashboard to real transaction data

2. **PWA Configuration** - Make app installable
   - Add web app manifest
   - Implement service worker
   - Add offline support

3. **Testing & Verification** - Ensure all flows work end-to-end
   - ✅ User registration and login working
   - Test job posting and quote flows
   - Test payment escrow system
   - Verify admin capabilities

## Known Issues
- None critical - authentication system fully operational

## Technical Notes
- All monetary values stored as text strings to avoid decimal precision issues
- Sessions persist in PostgreSQL for scalability
- WebSocket support ready for real-time chat (future enhancement)
- Database uses UUID primary keys for better distribution and security
