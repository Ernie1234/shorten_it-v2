import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

import {
  createShortUrl,
  getOriginalUrlAndIncrementClicks,
  getUrlsByUser,
} from "../services/urlService";
import { ApiError } from "@repo/utils";
import type { ApiResponse, IUrl } from "@repo/types";

// Zod schemas for validation
export const createUrlSchema = z.object({
  originalUrl: z
    .string()
    .url("Invalid URL format.")
    .min(1, "Original URL is required."),
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

export const shortenUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { originalUrl } = req.body;
    const userId = (req as any).user?.id; // User ID from auth middleware (if authenticated)

    const newUrl = await createShortUrl(originalUrl, userId);

    const response: ApiResponse<IUrl> = {
      success: true,
      message: "URL shortened successfully!",
      data: newUrl,
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const redirectToOriginalUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shortCode } = req.params;
    const urlEntry = await getOriginalUrlAndIncrementClicks(shortCode || "");
    res.redirect(urlEntry.originalUrl);
  } catch (error) {
    next(error);
  }
};

export const getUserUrls = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?.id; // User ID from auth middleware
    if (!userId) {
      return next(
        new ApiError(401, "Authentication required to view your URLs."),
      );
    }

    const urls = await getUrlsByUser(userId);
    const response: ApiResponse<IUrl[]> = {
      success: true,
      message: "User URLs fetched successfully!",
      data: urls,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
