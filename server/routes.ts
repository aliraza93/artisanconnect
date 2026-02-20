import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passport from "./auth";
import bcrypt from "bcryptjs";
import { isAuthenticated, requireClient, requireArtisan, requireAdmin, requireVerified } from "./middleware";
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
  insertBankDetailsSchema,
  insertWithdrawalSchema,
  insertAdminRequestSchema,
} from "@shared/schema";
import { Resend } from 'resend';

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

      // Generate email verification OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create verification token
      await storage.createEmailVerificationToken({
        userId: user.id,
        email: user.email,
        otp,
        expiresAt,
        used: false,
      });

      // Send verification email
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          console.log(`Sending verification email to: ${user.email}`);
          const roleWelcome = user.role === 'artisan' 
            ? 'You can now browse available jobs and submit quotes to clients.'
            : user.role === 'logistics'
            ? 'You can now view logistics jobs and offer your delivery services.'
            : 'You can now post jobs and connect with trusted artisans.';
          
          const emailResult = await resend.emails.send({
            from: 'ArtisanConnect SA <noreply@artisanconnect.web.za>',
            to: user.email,
            subject: 'Welcome to ArtisanConnect SA - Verify Your Email',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563EB;">Welcome to ArtisanConnect SA!</h2>
                <p>Hello ${user.fullName},</p>
                <p>Thank you for joining ArtisanConnect SA - South Africa's trusted marketplace connecting homeowners with skilled artisans.</p>
                <p><strong>${roleWelcome}</strong></p>
                <p>To get started, please verify your email address by entering the code below:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563EB;">${otp}</span>
                </div>
                <p style="color: #666;">This code expires in 24 hours.</p>
                <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <h3 style="color: #2563EB; margin-top: 0;">What's Next?</h3>
                  <ul style="color: #374151;">
                    <li>Verify your email address using the code above</li>
                    <li>Complete your profile to build trust</li>
                    <li>Explore the platform features</li>
                    <li>Start connecting with ${user.role === 'client' ? 'artisans' : 'clients'}</li>
                  </ul>
                </div>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">ArtisanConnect SA - Connecting Homeowners with Trusted Artisans</p>
              </div>
            `,
          });
          console.log('Verification email sent successfully:', emailResult);
        } catch (emailError: any) {
          console.error('Failed to send verification email:', emailError);
          console.error('Email error details:', JSON.stringify(emailError, null, 2));
        }
      } else {
        console.error('RESEND_API_KEY not configured - verification email not sent');
        console.error('To enable email sending, set RESEND_API_KEY in your environment variables');
      }

      // Log in the user - save session first to ensure it exists
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error during signup:', saveErr);
          // Still return success - user was created, they can log in manually
          const { password, ...userWithoutPassword } = user;
          return res.status(201).json(userWithoutPassword);
        }
        
        req.login(user, (err) => {
          if (err) {
            console.error('Login error after signup:', err);
            // Still return success - user was created, they can log in manually
            const { password, ...userWithoutPassword } = user;
            return res.status(201).json(userWithoutPassword);
          }
          
          // Don't send password back
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error: any) {
      console.error('Signup error:', error);
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

  // ==================== Password Reset Routes ====================
  
  // Generate 6-digit OTP
  function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Request password reset - sends OTP to email
  app.post("/api/auth/request-reset", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ 
          success: true, 
          message: "If an account exists with this email, you will receive a password reset code." 
        });
      }
      
      // Invalidate any existing tokens for this user
      await storage.invalidateUserPasswordResetTokens(user.id);
      
      // Generate OTP and expiry (15 minutes)
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      // Save token
      await storage.createPasswordResetToken({
        userId: user.id,
        email: user.email,
        otp,
        expiresAt,
        used: false,
      });
      
      // Send email with OTP
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          console.log(`Sending password reset email to: ${user.email}`);
          
          const emailResult = await resend.emails.send({
            from: 'ArtisanConnect SA <noreply@artisanconnect.web.za>',
            to: user.email,
            subject: 'Password Reset Code - ArtisanConnect SA',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563EB;">Password Reset Request</h2>
                <p>Hello ${user.fullName},</p>
                <p>You requested to reset your password for ArtisanConnect SA. Use the code below to complete the reset:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563EB;">${otp}</span>
                </div>
                <p style="color: #666;">This code expires in 15 minutes.</p>
                <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">ArtisanConnect SA - Connecting Homeowners with Trusted Artisans</p>
              </div>
            `,
          });
          console.log('Password reset email sent successfully:', emailResult);
        } catch (emailError: any) {
          console.error('Failed to send password reset email:', emailError);
        }
      } else {
        console.warn('RESEND_API_KEY not configured - password reset email not sent');
      }
      
      res.json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset code." 
      });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }
      
      const token = await storage.getPasswordResetToken(email.toLowerCase().trim(), otp);
      
      if (!token) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }
      
      // Check if expired
      if (new Date() > token.expiresAt) {
        return res.status(400).json({ error: "Code has expired. Please request a new one." });
      }
      
      res.json({ 
        success: true, 
        message: "Code verified successfully. You can now reset your password." 
      });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Reset password with OTP
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "Email, OTP, and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      const token = await storage.getPasswordResetToken(email.toLowerCase().trim(), otp);
      
      if (!token) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }
      
      // Check if expired
      if (new Date() > token.expiresAt) {
        return res.status(400).json({ error: "Code has expired. Please request a new one." });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUser(token.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token.id);
      
      // Invalidate all other reset tokens for this user
      await storage.invalidateUserPasswordResetTokens(token.userId);
      
      res.json({ 
        success: true, 
        message: "Password reset successfully. You can now log in with your new password." 
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // ==================== Email Verification Routes ====================
  
  // Send email verification OTP
  app.post("/api/auth/send-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if already verified
      if (user.verified) {
        return res.json({ 
          success: true, 
          message: "Email is already verified" 
        });
      }
      
      // Invalidate any existing tokens for this user
      await storage.invalidateUserEmailVerificationTokens(user.id);
      
      // Generate OTP and expiry (24 hours for email verification)
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Save token
      await storage.createEmailVerificationToken({
        userId: user.id,
        email: user.email,
        otp,
        expiresAt,
        used: false,
      });
      
      // Send email with OTP
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          console.log(`Sending email verification to: ${user.email}`);
          
          const emailResult = await resend.emails.send({
            from: 'ArtisanConnect SA <noreply@artisanconnect.web.za>',
            to: user.email,
            subject: 'Verify Your Email - ArtisanConnect SA',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563EB;">Verify Your Email Address</h2>
                <p>Hello ${user.fullName},</p>
                <p>Thank you for signing up for ArtisanConnect SA! Please verify your email address by entering the code below:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563EB;">${otp}</span>
                </div>
                <p style="color: #666;">This code expires in 24 hours.</p>
                <p style="color: #666;">If you didn't create an account, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">ArtisanConnect SA - Connecting Homeowners with Trusted Artisans</p>
              </div>
            `,
          });
          console.log('Email verification sent successfully:', emailResult);
        } catch (emailError: any) {
          console.error('Failed to send verification email:', emailError);
          // Still return success to user, but log the error
          return res.json({ 
            success: true, 
            message: "Verification code sent to your email",
            warning: "Email delivery may have failed. Please check server logs."
          });
        }
      } else {
        console.warn('RESEND_API_KEY not configured - verification email not sent');
        return res.status(500).json({ 
          error: "Email service not configured",
          message: "RESEND_API_KEY environment variable is not set. Please configure email service to send verification codes."
        });
      }
      
      res.json({ 
        success: true, 
        message: "Verification code sent to your email" 
      });
    } catch (error: any) {
      console.error('Email verification request error:', error);
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });

  // Verify email with OTP
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }
      
      const token = await storage.getEmailVerificationToken(email.toLowerCase().trim(), otp);
      
      if (!token) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }
      
      // Check if expired
      if (new Date() > token.expiresAt) {
        return res.status(400).json({ error: "Code has expired. Please request a new one." });
      }
      
      // Update user as verified
      await storage.updateUser(token.userId, { verified: true });
      
      // Mark token as used
      await storage.markEmailVerificationTokenUsed(token.id);
      
      // Invalidate all other verification tokens for this user
      await storage.invalidateUserEmailVerificationTokens(token.userId);
      
      // Get updated user
      const user = await storage.getUser(token.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      res.json({ 
        success: true, 
        message: "Email verified successfully",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // ==================== Job Routes ====================
  
  // Create job (client only)
  app.post("/api/jobs", requireClient, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      console.log('Creating job for user:', user.id, 'with data:', req.body);
      const validatedData = insertJobSchema.parse({
        ...req.body,
        clientId: user.id,
        images: req.body.images || [],
      });
      
      const job = await storage.createJob(validatedData);
      console.log('Job created successfully:', job.id, 'with images:', job.images?.length || 0);
      res.status(201).json(job);
    } catch (error: any) {
      console.error('Job creation error:', error);
      res.status(400).json({ error: error.message || "Failed to create job" });
    }
  });

  // Get all open jobs (public access with optional filters)
  app.get("/api/jobs/open", async (req: Request, res: Response) => {
    try {
      const { category, search } = req.query;
      
      const filters: { category?: string; search?: string } = {};
      if (category && typeof category === 'string') {
        filters.category = category;
      }
      if (search && typeof search === 'string') {
        filters.search = search;
      }
      
      const jobs = await storage.getOpenJobsPublic(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Get jobs by client
  app.get("/api/jobs/my-jobs", requireClient, requireVerified, async (req: Request, res: Response) => {
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
  app.patch("/api/jobs/:id", requireClient, requireVerified, async (req: Request, res: Response) => {
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
  app.post("/api/quotes", requireArtisan, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { billingType, hourlyRate, estimatedHours, amount, ...rest } = req.body;
      
      // Validate hourly billing fields
      if (billingType === 'hourly') {
        if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
          return res.status(400).json({ error: "Hourly rate must be a positive number" });
        }
        if (!estimatedHours || parseFloat(estimatedHours) <= 0) {
          return res.status(400).json({ error: "Estimated hours must be a positive number" });
        }
        // Calculate total amount from hourly rate × estimated hours
        const calculatedAmount = (parseFloat(hourlyRate) * parseFloat(estimatedHours)).toFixed(2);
        
        const validatedData = insertQuoteSchema.parse({
          ...rest,
          artisanId: user.id,
          billingType: 'hourly',
          hourlyRate: hourlyRate.toString(),
          estimatedHours: estimatedHours.toString(),
          amount: calculatedAmount,
        });
        
        const quote = await storage.createQuote(validatedData);
        await storage.updateJob(validatedData.jobId, { status: 'quoted' });
        res.status(201).json(quote);
      } else {
        // Fixed price quote
        if (!amount || parseFloat(amount) <= 0) {
          return res.status(400).json({ error: "Quote amount must be a positive number" });
        }
        
        const validatedData = insertQuoteSchema.parse({
          ...rest,
          artisanId: user.id,
          billingType: 'fixed',
          amount: amount.toString(),
        });
        
        const quote = await storage.createQuote(validatedData);
        await storage.updateJob(validatedData.jobId, { status: 'quoted' });
        res.status(201).json(quote);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create quote" });
    }
  });

  // Get quotes for a job (with artisan details for clients)
  app.get("/api/jobs/:jobId/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      if (user.role === 'client' || user.role === 'admin') {
        const quotesWithArtisan = await storage.getQuotesByJobWithArtisan(req.params.jobId);
        res.json(quotesWithArtisan);
      } else {
        const quotes = await storage.getQuotesByJob(req.params.jobId);
        res.json(quotes);
      }
    } catch (error: any) {
      console.error('Failed to fetch quotes:', error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Get artisan's quotes
  app.get("/api/quotes/my-quotes", requireArtisan, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const quotes = await storage.getQuotesByArtisan(user.id);
      res.json(quotes);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Accept quote (client only)
  app.patch("/api/quotes/:id/accept", requireClient, requireVerified, async (req: Request, res: Response) => {
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

  // Get single payment
  app.get("/api/payments/:id", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const payment = await storage.getPayment(req.params.id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // Only client, artisan, or admin can view
      if (payment.clientId !== user.id && payment.artisanId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  // Release payment (client or admin)
  app.patch("/api/payments/:id/release", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
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
  app.post("/api/messages", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
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
  app.get("/api/messages/:userId", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const messages = await storage.getMessagesBetweenUsers(user.id, req.params.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const conversations = await storage.getConversations(user.id);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Mark message as read
  app.patch("/api/messages/:id/read", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      await storage.markMessageAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // ==================== Review Routes ====================
  
  // Create review
  app.post("/api/reviews", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
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

  // Check if user already reviewed a job
  app.get("/api/jobs/:jobId/my-review", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const review = await storage.getReviewByJobAndReviewer(req.params.jobId, user.id);
      res.json({ review: review || null, hasReviewed: !!review });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to check review status" });
    }
  });

  // Get all reviews for a job
  app.get("/api/jobs/:jobId/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviewsByJob(req.params.jobId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch job reviews" });
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
  
  // Get artisans with optional filters (category, location, search)
  app.get("/api/artisans", async (req: Request, res: Response) => {
    try {
      const { category, location, search } = req.query;
      
      const filters: { category?: string; location?: string; search?: string } = {};
      if (category && typeof category === 'string') {
        filters.category = category;
      }
      if (location && typeof location === 'string') {
        filters.location = location;
      }
      if (search && typeof search === 'string') {
        filters.search = search;
      }
      
      const artisans = await storage.getAllArtisans(Object.keys(filters).length > 0 ? filters : undefined);
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
      
      // Get user name
      const user = await storage.getUser(req.params.userId);
      const profileWithUser = {
        ...profile,
        userName: user?.fullName || 'Artisan'
      };
      
      res.json(profileWithUser);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch artisan profile" });
    }
  });

  // ==================== Bank Details Routes ====================
  
  // Get bank details for current user
  app.get("/api/bank-details", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const details = await storage.getBankDetails(user.id);
      res.json(details || null);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch bank details" });
    }
  });

  // Create or update bank details
  app.post("/api/bank-details", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const existingDetails = await storage.getBankDetails(user.id);
      
      if (existingDetails) {
        // Update existing
        const updated = await storage.updateBankDetails(user.id, req.body);
        res.json(updated);
      } else {
        // Create new
        const validatedData = insertBankDetailsSchema.parse({
          ...req.body,
          userId: user.id,
        });
        const created = await storage.createBankDetails(validatedData);
        res.status(201).json(created);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to save bank details" });
    }
  });

  // ==================== Withdrawal Routes ====================
  
  // Get withdrawals for current user
  app.get("/api/withdrawals", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const userWithdrawals = await storage.getWithdrawals(user.id);
      res.json(userWithdrawals);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  // Create withdrawal request
  app.post("/api/withdrawals", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      // Check if user has bank details
      const bankDetailsRecord = await storage.getBankDetails(user.id);
      if (!bankDetailsRecord) {
        return res.status(400).json({ error: "Please add bank details before requesting a withdrawal" });
      }
      
      const validatedData = insertWithdrawalSchema.parse({
        ...req.body,
        userId: user.id,
        bankDetailsId: bankDetailsRecord.id,
        status: 'pending',
      });
      
      const withdrawal = await storage.createWithdrawal(validatedData);
      res.status(201).json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create withdrawal request" });
    }
  });

  // Get all withdrawals (admin only)
  app.get("/api/admin/withdrawals", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allWithdrawals = await storage.getAllWithdrawals();
      res.json(allWithdrawals);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  // Update withdrawal status (admin only)
  app.patch("/api/admin/withdrawals/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateWithdrawal(req.params.id, {
        ...req.body,
        processedAt: req.body.status === 'completed' ? new Date() : undefined,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update withdrawal" });
    }
  });

  // ==================== Admin Request Routes ====================
  
  // Request admin access
  app.post("/api/admin-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      // Check if already admin
      if (user.role === 'admin') {
        return res.status(400).json({ error: "You are already an admin" });
      }
      
      // Check if request already exists
      const existingRequest = await storage.getAdminRequest(user.id);
      if (existingRequest) {
        return res.status(400).json({ error: "Admin request already submitted", request: existingRequest });
      }
      
      const validatedData = insertAdminRequestSchema.parse({
        userId: user.id,
        reason: req.body.reason,
        status: 'pending',
      });
      
      const request = await storage.createAdminRequest(validatedData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to submit admin request" });
    }
  });

  // Get all admin requests (admin only)
  app.get("/api/admin/admin-requests", requireAdmin, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getAdminRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch admin requests" });
    }
  });

  // Approve/reject admin request (admin only)
  app.patch("/api/admin/admin-requests/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUser = req.user as User;
      const { status } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const updated = await storage.updateAdminRequest(req.params.id, {
        status,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      });
      
      // If approved, update user role to admin
      if (updated && status === 'approved') {
        await storage.updateUser(updated.userId, { role: 'admin' });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update admin request" });
    }
  });

  // ==================== Stripe Payment Routes ====================
  
  // Get Stripe publishable key
  app.get("/api/stripe/config", async (req: Request, res: Response) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  // Create payment intent for escrow (when quote is accepted)
  app.post("/api/payments/create-intent", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { quoteId } = req.body;
      
      // Get the quote and job details
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      const job = await storage.getJob(quote.jobId);
      if (!job || job.clientId !== user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const { stripeService } = await import('./stripeService');
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email, user.id, user.fullName);
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }
      
      // Convert amount to cents (ZAR uses cents)
      const amountInCents = Math.round(parseFloat(quote.amount) * 100);
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'zar',
        customer: customerId,
        metadata: {
          quoteId: quote.id,
          jobId: job.id,
          artisanId: quote.artisanId,
          clientId: user.id,
        },
        capture_method: 'manual', // For escrow - authorize but don't capture
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error('Payment intent error:', error);
      res.status(500).json({ error: error.message || "Failed to create payment intent" });
    }
  });

  // Confirm payment and accept quote (after successful Stripe payment)
  app.post("/api/payments/confirm", isAuthenticated, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { paymentIntentId, quoteId } = req.body;
      
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      // Verify payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'requires_capture') {
        return res.status(400).json({ error: "Payment not authorized" });
      }
      
      // Get quote and verify ownership
      const quote = await storage.getQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      const job = await storage.getJob(quote.jobId);
      if (!job || job.clientId !== user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Calculate platform fee (20%)
      const totalAmount = parseFloat(quote.amount);
      const platformFee = totalAmount * 0.20;
      const artisanAmount = totalAmount - platformFee;
      
      // Update quote to accepted
      await storage.updateQuote(quote.id, { status: 'accepted' });
      
      // Update job status
      await storage.updateJob(job.id, { status: 'in_progress' });
      
      // Create payment record with escrow status and hourly billing data
      const payment = await storage.createPayment({
        jobId: job.id,
        clientId: user.id,
        artisanId: quote.artisanId,
        totalAmount: totalAmount.toString(),
        platformFee: platformFee.toString(),
        artisanAmount: artisanAmount.toString(),
        status: 'held_escrow',
        stripePaymentIntentId: paymentIntentId,
        billingType: quote.billingType || 'fixed',
        hourlyRate: quote.hourlyRate,
        estimatedHours: quote.estimatedHours,
      });
      
      const isHourly = quote.billingType === 'hourly';
      res.json({ 
        success: true, 
        payment,
        message: isHourly 
          ? "Estimated payment held in escrow. Final amount will be calculated based on actual hours worked." 
          : "Payment held in escrow. Will be released upon job completion." 
      });
    } catch (error: any) {
      console.error('Payment confirm error:', error);
      res.status(500).json({ error: error.message || "Failed to confirm payment" });
    }
  });
  
  // Record actual hours worked (for hourly billing - client only)
  app.post("/api/payments/:id/record-hours", requireClient, requireVerified, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const paymentId = req.params.id;
      const { actualHours } = req.body;
      
      if (!actualHours || parseFloat(actualHours) <= 0) {
        return res.status(400).json({ error: "Actual hours must be a positive number" });
      }
      
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // Only client can record hours
      if (payment.clientId !== user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (payment.status !== 'held_escrow') {
        return res.status(400).json({ error: "Payment is not in escrow" });
      }
      
      if (payment.billingType !== 'hourly') {
        return res.status(400).json({ error: "This payment is not hourly-based" });
      }
      
      if (payment.actualHours) {
        return res.status(400).json({ error: "Actual hours have already been recorded. Open a dispute if you need to change this." });
      }
      
      // Calculate final total based on actual hours
      const hourlyRate = parseFloat(payment.hourlyRate || '0');
      const hours = parseFloat(actualHours);
      const finalTotal = hourlyRate * hours;
      const platformFee = finalTotal * 0.20;
      const artisanAmount = finalTotal - platformFee;
      
      await storage.updatePayment(paymentId, {
        actualHours: actualHours.toString(),
        finalTotal: finalTotal.toFixed(2),
        totalAmount: finalTotal.toFixed(2),
        platformFee: platformFee.toFixed(2),
        artisanAmount: artisanAmount.toFixed(2),
      });
      
      const updatedPayment = await storage.getPayment(paymentId);
      
      res.json({ 
        success: true, 
        payment: updatedPayment,
        summary: {
          hourlyRate,
          actualHours: hours,
          estimatedHours: parseFloat(payment.estimatedHours || '0'),
          finalTotal: finalTotal.toFixed(2),
          platformFee: platformFee.toFixed(2),
          artisanAmount: artisanAmount.toFixed(2),
        },
        message: "Actual hours recorded. You can now release the payment." 
      });
    } catch (error: any) {
      console.error('Record hours error:', error);
      res.status(500).json({ error: error.message || "Failed to record hours" });
    }
  });

  // Release payment from escrow (client approves completed work)
  app.post("/api/payments/:id/release", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const paymentId = req.params.id;
      
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // Only client or admin can release
      if (payment.clientId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (payment.status !== 'held_escrow') {
        return res.status(400).json({ error: "Payment is not in escrow" });
      }
      
      // For hourly billing, ensure actual hours have been recorded
      if (payment.billingType === 'hourly' && !payment.actualHours) {
        return res.status(400).json({ error: "Please record actual hours worked before releasing payment" });
      }
      
      // For hourly billing, use the finalTotal; for fixed, use totalAmount
      const releaseAmount = payment.billingType === 'hourly' && payment.finalTotal
        ? payment.finalTotal
        : payment.totalAmount;
      
      // Try to capture the Stripe payment if configured
      let stripeProcessed = false;
      if (payment.stripePaymentIntentId) {
        try {
          const { getUncachableStripeClient } = await import('./stripeClient');
          const stripe = await getUncachableStripeClient();
          await stripe.paymentIntents.capture(payment.stripePaymentIntentId, {
            amount_to_capture: Math.round(parseFloat(releaseAmount) * 100),
          });
          stripeProcessed = true;
        } catch (stripeError: any) {
          console.log('Stripe not available, proceeding without capture:', stripeError.message);
        }
      }
      
      // Update payment status with final amounts
      await storage.updatePayment(paymentId, { 
        status: 'released',
        escrowReleaseDate: new Date(),
        totalAmount: releaseAmount,
      });
      
      // Update job status
      await storage.updateJob(payment.jobId, { status: 'completed' });
      
      const isHourly = payment.billingType === 'hourly';
      res.json({ 
        success: true, 
        message: isHourly 
          ? `Payment of R${releaseAmount} released based on ${payment.actualHours} hours worked.`
          : "Payment released successfully" 
      });
    } catch (error: any) {
      console.error('Payment release error:', error);
      res.status(500).json({ error: error.message || "Failed to release payment" });
    }
  });

  // ==================== Object Storage / Image Upload Routes ====================
  
  // Serve public objects
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const filePath = req.params.filePath;
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private/uploaded objects (with optional ACL check)
  app.get("/objects/:objectPath(*)", async (req: Request, res: Response) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error fetching object:", error);
      if (error.name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for job images
  app.post("/api/objects/upload", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getObjectEntityUploadURL();
      
      if (!result.uploadURL) {
        console.error("No upload URL returned from ObjectStorageService");
        return res.status(500).json({ error: "Failed to generate upload URL" });
      }
      
      // Generate public S3 URL that will be accessible after upload
      const bucket = process.env.AWS_S3_BUCKET || '';
      const region = process.env.AWS_REGION || 'us-east-1';
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || 'uploads';
      const objectId = result.objectPath.replace('/objects/', '');
      const s3Key = `${privateObjectDir}/${objectId}`;
      const publicS3URL = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
      
      res.json({ 
        uploadURL: result.uploadURL, 
        objectPath: result.objectPath,
        s3URL: publicS3URL // Public S3 URL to store
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Check if it's a configuration error
      if (errorMessage.includes("PRIVATE_OBJECT_DIR")) {
        console.error("Configuration Error: PRIVATE_OBJECT_DIR environment variable is not set.");
        console.error("Please set PRIVATE_OBJECT_DIR in your environment variables or .env file.");
        return res.status(500).json({ 
          error: "Upload service not configured",
          details: "PRIVATE_OBJECT_DIR environment variable is not set. Please contact the administrator."
        });
      }
      
      res.status(500).json({ 
        error: "Failed to get upload URL",
        details: errorMessage 
      });
    }
  });

  // Set object ACL to public after upload
  app.post("/api/objects/set-public", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { objectPath } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
      // Set ACL to public so S3 URL is accessible
      await objectStorageService.trySetObjectEntityAclPolicy(
        objectPath,
        {
          owner: user.id,
          visibility: "public",
        }
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error setting public ACL:", error);
      res.status(500).json({ error: "Failed to set public ACL" });
    }
  });

  // Update job images after upload
  app.put("/api/jobs/:id/images", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const jobId = req.params.id;
      const { imageURL } = req.body;

      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      // Validate image path is from our object storage (S3 URL, GCS URL, or object path)
      const isValidPath = imageURL.startsWith('/objects/') || 
                          imageURL.startsWith('https://storage.googleapis.com/') ||
                          (imageURL.startsWith('https://') && imageURL.includes('.s3.'));
      if (!isValidPath) {
        return res.status(400).json({ error: "Invalid image path - must be from our storage" });
      }

      // If it's an S3 URL, extract objectPath for ACL operations
      let objectPathForACL = imageURL;
      if (imageURL.includes('.s3.') && imageURL.includes('amazonaws.com/')) {
        // Extract key from S3 URL: https://bucket.s3.region.amazonaws.com/key
        const url = new URL(imageURL);
        const key = url.pathname.substring(1); // Remove leading /
        const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || 'uploads';
        if (key.startsWith(`${privateObjectDir}/`)) {
          const objectId = key.substring(privateObjectDir.length + 1);
          objectPathForACL = `/objects/${objectId}`;
        }
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Only job owner or admin can add images
      if (job.clientId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy - public so artisans can view (if not already an S3 URL)
      if (!imageURL.includes('.s3.')) {
        try {
          await objectStorageService.trySetObjectEntityAclPolicy(
            objectPathForACL,
            {
              owner: user.id,
              visibility: "public",
            }
          );
        } catch (aclError) {
          console.warn("Failed to set ACL, but continuing:", aclError);
        }
      }

      // Store the S3 URL directly (or objectPath if it's not an S3 URL yet)
      const currentImages = job.images || [];
      const updatedImages = [...currentImages, imageURL];
      
      await storage.updateJob(jobId, { images: updatedImages });

      res.json({ 
        success: true, 
        objectPath,
        images: updatedImages
      });
    } catch (error) {
      console.error("Error adding job image:", error);
      res.status(500).json({ error: "Failed to add image" });
    }
  });

  return httpServer;
}
