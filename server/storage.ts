import {
  users,
  jobs,
  quotes,
  payments,
  messages,
  reviews,
  disputes,
  artisanProfiles,
  bankDetails,
  withdrawals,
  adminRequests,
  passwordResetTokens,
  emailVerificationTokens,
  type User,
  type InsertUser,
  type Job,
  type InsertJob,
  type Quote,
  type InsertQuote,
  type Payment,
  type InsertPayment,
  type Message,
  type InsertMessage,
  type Review,
  type InsertReview,
  type Dispute,
  type InsertDispute,
  type ArtisanProfile,
  type InsertArtisanProfile,
  type BankDetails,
  type InsertBankDetails,
  type Withdrawal,
  type InsertWithdrawal,
  type AdminRequest,
  type InsertAdminRequest,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, like, ilike, sql } from "drizzle-orm";

export interface QuoteWithArtisan extends Quote {
  artisanName: string;
  artisanRating: string | null;
  artisanReviewCount: number;
  artisanYearsExperience: number | null;
  artisanVerified: boolean;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Artisan Profiles
  getArtisanProfile(userId: string): Promise<ArtisanProfile | undefined>;
  createArtisanProfile(profile: InsertArtisanProfile): Promise<ArtisanProfile>;
  getArtisansByCategory(category: string): Promise<ArtisanProfile[]>;
  getAllArtisans(filters?: { category?: string; location?: string; search?: string }): Promise<Array<ArtisanProfile & { userName: string; userRating: string | null; reviewCount: number }>>;

  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  getOpenJobs(): Promise<Job[]>;
  getOpenJobsPublic(filters?: { category?: string; search?: string }): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;

  // Quotes
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuote(id: string): Promise<Quote | undefined>;
  getQuotesByJob(jobId: string): Promise<Quote[]>;
  getQuotesByJobWithArtisan(jobId: string): Promise<QuoteWithArtisan[]>;
  getQuotesByArtisan(artisanId: string): Promise<Quote[]>;
  updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByJob(jobId: string): Promise<Payment[]>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  getPlatformRevenue(): Promise<number>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  markMessageAsRead(id: string): Promise<void>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByReviewee(revieweeId: string): Promise<Review[]>;
  getReviewByJobAndReviewer(jobId: string, reviewerId: string): Promise<Review | undefined>;
  getReviewsByJob(jobId: string): Promise<Review[]>;

  // Disputes
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDisputes(): Promise<Dispute[]>;
  updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined>;

  // Bank Details
  getBankDetails(userId: string): Promise<BankDetails | undefined>;
  createBankDetails(details: InsertBankDetails): Promise<BankDetails>;
  updateBankDetails(userId: string, updates: Partial<BankDetails>): Promise<BankDetails | undefined>;

  // Withdrawals
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawals(userId: string): Promise<Withdrawal[]>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined>;

  // Admin Requests
  createAdminRequest(request: InsertAdminRequest): Promise<AdminRequest>;
  getAdminRequests(): Promise<AdminRequest[]>;
  getAdminRequest(userId: string): Promise<AdminRequest | undefined>;
  updateAdminRequest(id: string, updates: Partial<AdminRequest>): Promise<AdminRequest | undefined>;

  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(email: string, otp: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  invalidateUserPasswordResetTokens(userId: string): Promise<void>;

  // Email Verification Tokens
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(email: string, otp: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenUsed(id: string): Promise<void>;
  invalidateUserEmailVerificationTokens(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Artisan Profiles
  async getArtisanProfile(userId: string): Promise<ArtisanProfile | undefined> {
    const [profile] = await db.select().from(artisanProfiles).where(eq(artisanProfiles.userId, userId));
    return profile || undefined;
  }

  async createArtisanProfile(profile: InsertArtisanProfile): Promise<ArtisanProfile> {
    const [created] = await db.insert(artisanProfiles).values(profile).returning();
    return created;
  }

  async getArtisansByCategory(category: string): Promise<ArtisanProfile[]> {
    return db.select().from(artisanProfiles).where(eq(artisanProfiles.category, category));
  }

  async getAllArtisans(filters?: { category?: string; location?: string; search?: string }): Promise<Array<ArtisanProfile & { userName: string; userRating: string | null }>> {
    let query = db
      .select({
        id: artisanProfiles.id,
        userId: artisanProfiles.userId,
        category: artisanProfiles.category,
        bio: artisanProfiles.bio,
        skills: artisanProfiles.skills,
        certifications: artisanProfiles.certifications,
        yearsExperience: artisanProfiles.yearsExperience,
        location: artisanProfiles.location,
        address: artisanProfiles.address,
        latitude: artisanProfiles.latitude,
        longitude: artisanProfiles.longitude,
        verified: artisanProfiles.verified,
        createdAt: artisanProfiles.createdAt,
        userName: users.fullName,
        userRating: users.rating,
      })
      .from(artisanProfiles)
      .innerJoin(users, eq(artisanProfiles.userId, users.id));

    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(artisanProfiles.category, filters.category));
    }

    if (filters?.location) {
      conditions.push(ilike(artisanProfiles.location, `%${filters.location}%`));
    }

    if (filters?.search) {
      conditions.push(ilike(users.fullName, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(artisanProfiles.createdAt));
    return results.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      category: r.category,
      bio: r.bio,
      skills: r.skills,
      certifications: r.certifications,
      yearsExperience: r.yearsExperience,
      location: r.location,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      verified: r.verified,
      createdAt: r.createdAt,
      userName: r.userName,
    }));
  }

  // Jobs
  async createJob(job: InsertJob): Promise<Job> {
    const [created] = await db.insert(jobs).values(job).returning();
    return created;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.clientId, clientId)).orderBy(desc(jobs.createdAt));
  }

  async getOpenJobs(): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.status, 'open')).orderBy(desc(jobs.createdAt));
  }

  async getOpenJobsPublic(filters?: { category?: string; search?: string }): Promise<Job[]> {
    let query = db.select().from(jobs).where(eq(jobs.status, 'open'));

    const conditions = [eq(jobs.status, 'open')];

    if (filters?.category) {
      conditions.push(eq(jobs.category, filters.category));
    }

    if (filters?.search) {
      conditions.push(ilike(jobs.title, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(jobs.createdAt));
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const [job] = await db.update(jobs).set({...updates, updatedAt: new Date()}).where(eq(jobs.id, id)).returning();
    return job || undefined;
  }

  // Quotes
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [created] = await db.insert(quotes).values(quote).returning();
    return created;
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async getQuotesByJob(jobId: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.jobId, jobId)).orderBy(desc(quotes.createdAt));
  }

  async getQuotesByJobWithArtisan(jobId: string): Promise<QuoteWithArtisan[]> {
    const jobQuotes = await db.select().from(quotes).where(eq(quotes.jobId, jobId)).orderBy(desc(quotes.createdAt));
    
    const quotesWithArtisan: QuoteWithArtisan[] = [];
    for (const quote of jobQuotes) {
      const [artisan] = await db.select().from(users).where(eq(users.id, quote.artisanId));
      const [profile] = await db.select().from(artisanProfiles).where(eq(artisanProfiles.userId, quote.artisanId));
      const artisanReviews = await db.select().from(reviews).where(eq(reviews.revieweeId, quote.artisanId));
      
      quotesWithArtisan.push({
        ...quote,
        artisanName: artisan?.fullName || 'Unknown Artisan',
        artisanRating: artisan?.rating,
        artisanReviewCount: artisanReviews.length,
        artisanYearsExperience: profile?.yearsExperience ?? null,
        artisanVerified: profile?.verified ?? false,
      });
    }
    
    return quotesWithArtisan;
  }

  async getQuotesByArtisan(artisanId: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.artisanId, artisanId)).orderBy(desc(quotes.createdAt));
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const [quote] = await db.update(quotes).set(updates).where(eq(quotes.id, id)).returning();
    return quote || undefined;
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByJob(jobId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.jobId, jobId));
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return payment || undefined;
  }

  async getPlatformRevenue(): Promise<number> {
    const allPayments = await db.select().from(payments).where(eq(payments.status, 'released'));
    const total = allPayments.reduce((sum, p) => sum + parseFloat(p.platformFee), 0);
    return total;
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return db.select().from(messages).where(
      or(
        and(eq(messages.senderId, user1Id), eq(messages.recipientId, user2Id)),
        and(eq(messages.senderId, user2Id), eq(messages.recipientId, user1Id))
      )
    ).orderBy(messages.createdAt);
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get all messages where user is sender or recipient
    const allMessages = await db.select().from(messages).where(
      or(eq(messages.senderId, userId), eq(messages.recipientId, userId))
    ).orderBy(desc(messages.createdAt));

    // Group by conversation partner
    const conversations = new Map();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, msg);
      }
    }

    return Array.from(conversations.values());
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ read: true }).where(eq(messages.id, id));
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async getReviewsByReviewee(revieweeId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.revieweeId, revieweeId)).orderBy(desc(reviews.createdAt));
  }

  async getReviewByJobAndReviewer(jobId: string, reviewerId: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(
      and(eq(reviews.jobId, jobId), eq(reviews.reviewerId, reviewerId))
    );
    return review || undefined;
  }

  async getReviewsByJob(jobId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.jobId, jobId)).orderBy(desc(reviews.createdAt));
  }

  // Disputes
  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const [created] = await db.insert(disputes).values(dispute).returning();
    return created;
  }

  async getDisputes(): Promise<Dispute[]> {
    return db.select().from(disputes).orderBy(desc(disputes.createdAt));
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> {
    const [dispute] = await db.update(disputes).set(updates).where(eq(disputes.id, id)).returning();
    return dispute || undefined;
  }

  // Bank Details
  async getBankDetails(userId: string): Promise<BankDetails | undefined> {
    const [details] = await db.select().from(bankDetails).where(eq(bankDetails.userId, userId));
    return details || undefined;
  }

  async createBankDetails(details: InsertBankDetails): Promise<BankDetails> {
    const [created] = await db.insert(bankDetails).values(details).returning();
    return created;
  }

  async updateBankDetails(userId: string, updates: Partial<BankDetails>): Promise<BankDetails | undefined> {
    const [updated] = await db.update(bankDetails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bankDetails.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Withdrawals
  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [created] = await db.insert(withdrawals).values(withdrawal).returning();
    return created;
  }

  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const [updated] = await db.update(withdrawals).set(updates).where(eq(withdrawals.id, id)).returning();
    return updated || undefined;
  }

  // Admin Requests
  async createAdminRequest(request: InsertAdminRequest): Promise<AdminRequest> {
    const [created] = await db.insert(adminRequests).values(request).returning();
    return created;
  }

  async getAdminRequests(): Promise<AdminRequest[]> {
    return db.select().from(adminRequests).orderBy(desc(adminRequests.createdAt));
  }

  async getAdminRequest(userId: string): Promise<AdminRequest | undefined> {
    const [request] = await db.select().from(adminRequests).where(eq(adminRequests.userId, userId));
    return request || undefined;
  }

  async updateAdminRequest(id: string, updates: Partial<AdminRequest>): Promise<AdminRequest | undefined> {
    const [updated] = await db.update(adminRequests).set(updates).where(eq(adminRequests.id, id)).returning();
    return updated || undefined;
  }

  // Password Reset Tokens
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [created] = await db.insert(passwordResetTokens).values(token).returning();
    return created;
  }

  async getPasswordResetToken(email: string, otp: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.email, email),
        eq(passwordResetTokens.otp, otp),
        eq(passwordResetTokens.used, false)
      ));
    return token || undefined;
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, id));
  }

  async invalidateUserPasswordResetTokens(userId: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.userId, userId));
  }

  // Email Verification Tokens
  async createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [created] = await db.insert(emailVerificationTokens).values(token).returning();
    return created;
  }

  async getEmailVerificationToken(email: string, otp: string): Promise<EmailVerificationToken | undefined> {
    const [token] = await db.select().from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.email, email),
        eq(emailVerificationTokens.otp, otp),
        eq(emailVerificationTokens.used, false)
      ));
    return token || undefined;
  }

  async markEmailVerificationTokenUsed(id: string): Promise<void> {
    await db.update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.id, id));
  }

  async invalidateUserEmailVerificationTokens(userId: string): Promise<void> {
    await db.update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();
