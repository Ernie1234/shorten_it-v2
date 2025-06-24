import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError, logger } from "@repo/utils";
import type { JwtPayload } from "@repo/types";

const JWT_SECRET =
  process.env.JWT_SECRET || "supersecretjwtkeythatshouldbechangedinproduction";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; email: string };
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.debug("No token provided. Proceeding as unauthenticated request.");
    // If no token, proceed. Downstream services can handle if auth is required.
    // Or, you could throw ApiError(401, 'Authentication token required.') here for protected routes.
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn("Invalid or expired token:", err.message);
      return next(new ApiError(403, "Invalid or expired token."));
    }
    // Attach user information to request object for downstream services
    req.user = {
      id: (user as JwtPayload).userId,
      email: (user as JwtPayload).email,
    };
    logger.debug("Token authenticated. User:", req.user.id);
    next();
  });
};

// Middleware to enforce authentication for specific routes
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(
      new ApiError(401, "Authentication is required for this route."),
    );
  }
  next();
};
