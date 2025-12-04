import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['client', 'artisan', 'logistics', 'admin']);
export const jobStatusEnum = pgEnum('job_status', ['open', 'quoted', 'in_progress', 'completed', 'cancelled', 'disputed']);
export const quoteStatusEnum = pgEnum('quote_status', ['pending', 'accepted', 'rejected']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'held_escrow', 'released', 'refunded']);
export const disputeStatusEnum = pgEnum('dispute_status', ['open', 'investigating', 'resolved', 'closed']);

// Users Table
export const users = pgTable('users', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text().notNull().unique(),
  password: text().notNull(),
  fullName: text().notNull(),
  phone: text(),
  role: userRoleEnum().notNull().default('client'),
  verified: boolean().notNull().default(false),
  rating: text().default('0'), // Using text to avoid decimal issues, can parse as float
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Artisan Profiles
export const artisanProfiles = pgTable('artisan_profiles', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar().notNull().references(() => users.id),
  category: text().notNull(),
  bio: text(),
  skills: text().array(),
  certifications: text().array(),
  yearsExperience: integer(),
  location: text(),
  verified: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertArtisanProfileSchema = createInsertSchema(artisanProfiles).omit({ id: true, createdAt: true });
export type InsertArtisanProfile = z.infer<typeof insertArtisanProfileSchema>;
export type ArtisanProfile = typeof artisanProfiles.$inferSelect;

// Jobs Table
export const jobs = pgTable('jobs', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar().notNull().references(() => users.id),
  title: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  location: text().notNull(),
  budget: text(),
  status: jobStatusEnum().notNull().default('open'),
  needsLogistics: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Quotes Table
export const quotes = pgTable('quotes', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar().notNull().references(() => jobs.id),
  artisanId: varchar().notNull().references(() => users.id),
  amount: text().notNull(),
  message: text(),
  status: quoteStatusEnum().notNull().default('pending'),
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

// Payments Table
export const payments = pgTable('payments', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar().notNull().references(() => jobs.id),
  clientId: varchar().notNull().references(() => users.id),
  artisanId: varchar().notNull().references(() => users.id),
  totalAmount: text().notNull(),
  platformFee: text().notNull(), // 20% of totalAmount
  artisanAmount: text().notNull(), // 80% of totalAmount
  status: paymentStatusEnum().notNull().default('pending'),
  escrowReleaseDate: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Messages Table
export const messages = pgTable('messages', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar().notNull().references(() => users.id),
  recipientId: varchar().notNull().references(() => users.id),
  jobId: varchar().references(() => jobs.id),
  content: text().notNull(),
  read: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Reviews Table
export const reviews = pgTable('reviews', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar().notNull().references(() => jobs.id),
  reviewerId: varchar().notNull().references(() => users.id),
  revieweeId: varchar().notNull().references(() => users.id),
  rating: integer().notNull(), // 1-5
  comment: text(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Disputes Table
export const disputes = pgTable('disputes', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar().notNull().references(() => jobs.id),
  clientId: varchar().notNull().references(() => users.id),
  artisanId: varchar().notNull().references(() => users.id),
  issue: text().notNull(),
  description: text(),
  status: disputeStatusEnum().notNull().default('open'),
  resolution: text(),
  createdAt: timestamp().notNull().defaultNow(),
  resolvedAt: timestamp(),
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true });
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;

// Bank Details Table (for withdrawals)
export const bankDetails = pgTable('bank_details', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar().notNull().references(() => users.id).unique(),
  bankName: text().notNull(),
  accountHolder: text().notNull(),
  accountNumber: text().notNull(),
  branchCode: text().notNull(),
  accountType: text().notNull(), // 'savings', 'current', 'cheque'
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const insertBankDetailsSchema = createInsertSchema(bankDetails).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBankDetails = z.infer<typeof insertBankDetailsSchema>;
export type BankDetails = typeof bankDetails.$inferSelect;

// Withdrawal Status Enum
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'processing', 'completed', 'failed']);

// Withdrawals Table
export const withdrawals = pgTable('withdrawals', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar().notNull().references(() => users.id),
  amount: text().notNull(),
  status: withdrawalStatusEnum().notNull().default('pending'),
  bankDetailsId: varchar().notNull().references(() => bankDetails.id),
  reference: text(),
  processedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({ id: true, createdAt: true });
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;

// Admin Requests Table (for users requesting admin access)
export const adminRequests = pgTable('admin_requests', {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar().notNull().references(() => users.id).unique(),
  reason: text().notNull(),
  status: text().notNull().default('pending'), // 'pending', 'approved', 'rejected'
  reviewedBy: varchar().references(() => users.id),
  reviewedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const insertAdminRequestSchema = createInsertSchema(adminRequests).omit({ id: true, createdAt: true });
export type InsertAdminRequest = z.infer<typeof insertAdminRequestSchema>;
export type AdminRequest = typeof adminRequests.$inferSelect;
