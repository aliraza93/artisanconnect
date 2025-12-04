import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

// Type guard to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}

// Middleware to check user role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as User;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    next();
  };
}

// Specific role middleware
export const requireClient = requireRole("client", "admin");
export const requireArtisan = requireRole("artisan", "admin");
export const requireAdmin = requireRole("admin");
