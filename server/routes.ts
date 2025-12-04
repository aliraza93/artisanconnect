import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passport from "./auth";
import bcrypt from "bcryptjs";
import { isAuthenticated, requireClient, requireArtisan, requireAdmin } from "./middleware";
import type { User } from "@shared/schema";
import {
  insertUserSchema,
  insertJobSchema,
  insertQuoteSchema,
  insertPaymentSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertDisputeSchema,
  insertArtisanProfileSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== Authentication Routes ====================
  
  // Sign up
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // If user is artisan, create profile
      if (user.role === 'artisan' && req.body.artisanProfile) {
        await storage.createArtisanProfile({
          userId: user.id,
          ...req.body.artisanProfile
        });
      }

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after signup" });
        }
        
        // Don't send password back
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid signup data" });
    }
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", isAuthenticated, async (req: Request, res: Response) => {
    const user = req.user as User;
    const { password, ...userWithoutPassword } = user;
    
    // If artisan, include profile
    if (user.role === 'artisan') {
      const profile = await storage.getArtisanProfile(user.id);
      return res.json({ ...userWithoutPassword, artisanProfile: profile });
    }
    
    res.json(userWithoutPassword);
  });

  // ==================== Job Routes ====================
  
  // Create job (client only)
  app.post("/api/jobs", requireClient, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const validatedData = insertJobSchema.parse({
        ...req.body,
        clientId: user.id,
      });
      
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create job" });
    }
  });

  // Get all open jobs
  app.get("/api/jobs/open", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const jobs = await storage.getOpenJobs();
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Get jobs by client
  app.get("/api/jobs/my-jobs", requireClient, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const jobs = await storage.getJobsByClient(user.id);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Get single job
  app.get("/api/jobs/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // Update job
  app.patch("/api/jobs/:id", requireClient, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const job = await storage.getJob(req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.clientId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to update this job" });
      }

      const updated = await storage.updateJob(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  // ==================== Quote Routes ====================
  
  // Submit quote (artisan only)
  app.post("/api/quotes", requireArtisan, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const validatedData = insertQuoteSchema.parse({
        ...req.body,
        artisanId: user.id,
      });
      
      const quote = await storage.createQuote(validatedData);
      
      // Update job status to 'quoted'
      await storage.updateJob(validatedData.jobId, { status: 'quoted' });
      
      res.status(201).json(quote);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create quote" });
    }
  });

  // Get quotes for a job
  app.get("/api/jobs/:jobId/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuotesByJob(req.params.jobId);
      res.json(quotes);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Get artisan's quotes
  app.get("/api/quotes/my-quotes", requireArtisan, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const quotes = await storage.getQuotesByArtisan(user.id);
      res.json(quotes);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Accept quote (client only)
  app.patch("/api/quotes/:id/accept", requireClient, async (req: Request, res: Response) => {
    try {
      const quote = await storage.updateQuote(req.params.id, { status: 'accepted' });
      
      if (quote) {
        // Update job status
        await storage.updateJob(quote.jobId, { status: 'in_progress' });
        
        // Create payment in escrow
        const totalAmount = parseFloat(quote.amount);
        const platformFee = (totalAmount * 0.20).toFixed(2);
        const artisanAmount = (totalAmount * 0.80).toFixed(2);
        
        await storage.createPayment({
          jobId: quote.jobId,
          clientId: (req.user as User).id,
          artisanId: quote.artisanId,
          totalAmount: quote.amount,
          platformFee,
          artisanAmount,
          status: 'held_escrow',
        });
      }
      
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to accept quote" });
    }
  });

  // ==================== Payment Routes ====================
  
  // Get payments for a job
  app.get("/api/jobs/:jobId/payments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const payments = await storage.getPaymentsByJob(req.params.jobId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Release payment (client or admin)
  app.patch("/api/payments/:id/release", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const payment = await storage.getPayment(req.params.id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      if (payment.clientId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to release this payment" });
      }

      const updated = await storage.updatePayment(req.params.id, {
        status: 'released',
        escrowReleaseDate: new Date(),
      });
      
      // Update job status to completed
      await storage.updateJob(payment.jobId, { status: 'completed' });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to release payment" });
    }
  });

  // Get platform revenue (admin only)
  app.get("/api/admin/revenue", requireAdmin, async (req: Request, res: Response) => {
    try {
      const revenue = await storage.getPlatformRevenue();
      res.json({ revenue });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch revenue" });
    }
  });

  // ==================== Message Routes ====================
  
  // Send message
  app.post("/api/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: user.id,
      });
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to send message" });
    }
  });

  // Get conversation between two users
  app.get("/api/messages/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const messages = await storage.getMessagesBetweenUsers(user.id, req.params.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const conversations = await storage.getConversations(user.id);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Mark message as read
  app.patch("/api/messages/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markMessageAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // ==================== Review Routes ====================
  
  // Create review
  app.post("/api/reviews", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: user.id,
      });
      
      const review = await storage.createReview(validatedData);
      
      // Update reviewee's rating
      const allReviews = await storage.getReviewsByReviewee(validatedData.revieweeId);
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await storage.updateUser(validatedData.revieweeId, { rating: avgRating.toFixed(1) });
      
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create review" });
    }
  });

  // Get reviews for a user
  app.get("/api/users/:userId/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviewsByReviewee(req.params.userId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // ==================== Dispute Routes ====================
  
  // Create dispute
  app.post("/api/disputes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertDisputeSchema.parse(req.body);
      const dispute = await storage.createDispute(validatedData);
      
      // Update job status
      await storage.updateJob(validatedData.jobId, { status: 'disputed' });
      
      res.status(201).json(dispute);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create dispute" });
    }
  });

  // Get all disputes (admin only)
  app.get("/api/admin/disputes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const disputes = await storage.getDisputes();
      res.json(disputes);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch disputes" });
    }
  });

  // Update dispute (admin only)
  app.patch("/api/admin/disputes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateDispute(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update dispute" });
    }
  });

  // ==================== Artisan Routes ====================
  
  // Get artisans by category
  app.get("/api/artisans", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: "Category is required" });
      }
      
      const artisans = await storage.getArtisansByCategory(category);
      res.json(artisans);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch artisans" });
    }
  });

  // Get artisan profile
  app.get("/api/artisans/:userId/profile", async (req: Request, res: Response) => {
    try {
      const profile = await storage.getArtisanProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Artisan profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch artisan profile" });
    }
  });

  return httpServer;
}
