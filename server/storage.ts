import {
  users,
  jobs,
  quotes,
  payments,
  messages,
  reviews,
  disputes,
  artisanProfiles,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";

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

  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  getOpenJobs(): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;

  // Quotes
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuotesByJob(jobId: string): Promise<Quote[]>;
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

  // Disputes
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDisputes(): Promise<Dispute[]>;
  updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined>;
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

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const [job] = await db.update(jobs).set({...updates, updatedAt: new Date()}).where(eq(jobs.id, id)).returning();
    return job || undefined;
  }

  // Quotes
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [created] = await db.insert(quotes).values(quote).returning();
    return created;
  }

  async getQuotesByJob(jobId: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.jobId, jobId)).orderBy(desc(quotes.createdAt));
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
}

export const storage = new DatabaseStorage();
