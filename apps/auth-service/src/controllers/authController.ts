import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import {
  registerUser,
  loginUser,
  findOrCreateGoogleUser,
} from "../services/authService";
import type { ApiResponse } from "@repo/types";
import type { IUser } from "@repo/types";
import { ApiError } from "@repo/utils";

// Zod schemas for validation
export const registerSchema = z.object({
  name: z
    .string()
    .min(3, "Name is required and must be at least 3 characters."),
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(1, "Password is required."), // Min 1 for login, handled by service comparison
});

// Middleware for Zod validation
export const validate =
  (schema: z.ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((err) => err.message).join(", ");
        return next(new ApiError(400, `Validation error: ${messages}`));
      }
      next(error);
    }
  };

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser({ name, email, password });
    const response: ApiResponse<Partial<IUser>> = {
      success: true,
      message: "User registered successfully!",
      data: { _id: user._id, name: user.name, email: user.email },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    const response: ApiResponse<{ user: Partial<IUser>; token: string }> = {
      success: true,
      message: "Logged in successfully!",
      data: {
        user: { _id: user._id, name: user.name, email: user.email },
        token,
      },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Callback for Google OAuth - will be handled by passport route
// This is typically not directly called, but passport handles the redirection.
// After successful authentication, passport redirects to a route where you can issue JWT.
export const googleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Passport attaches user to req.user after successful authentication
    const user = req.user as any;
    if (!user) {
      return next(new ApiError(401, "Google authentication failed."));
    }

    const { user: authUser, token } = await findOrCreateGoogleUser(user._json); // Pass raw Google profile
    // Redirect to frontend with token
    res.redirect(`${process.env.WEB_APP_URL}?token=${token}`);
  } catch (error) {
    next(error);
  }
};
