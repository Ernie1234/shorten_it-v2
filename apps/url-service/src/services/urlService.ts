import Url from "../models/Url";
import type { IUrl } from "@repo/types";
import { customAlphabet } from "nanoid";
import { ApiError } from "@repo/utils";

// Generate a short code of 7 characters using alphanumeric characters
const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  7,
);

/**
 * Creates a new short URL entry in the database.
 * @param originalUrl The long URL to shorten.
 * @param userId Optional user ID if the URL is linked to a user.
 * @returns The newly created URL document.
 */
export const createShortUrl = async (
  originalUrl: string,
  userId?: string,
): Promise<IUrl> => {
  let shortCode = nanoid();
  // Ensure the generated short code is unique
  while (await Url.findOne({ shortCode })) {
    shortCode = nanoid();
  }

  const newUrl = await Url.create({
    originalUrl,
    shortCode,
    userId,
  });
  return newUrl;
};

/**
 * Finds an original URL by its short code and increments click count.
 * @param shortCode The short code to look up.
 * @returns The URL document if found.
 */
export const getOriginalUrlAndIncrementClicks = async (
  shortCode: string,
): Promise<IUrl> => {
  const urlEntry = await Url.findOneAndUpdate(
    { shortCode },
    { $inc: { clicks: 1 } }, // Increment clicks
    { new: true }, // Return the updated document
  );
  if (!urlEntry) {
    throw new ApiError(404, "Short URL not found.");
  }
  return urlEntry;
};

/**
 * Gets all URLs for a specific user.
 * @param userId The ID of the user.
 * @returns An array of URL documents.
 */
export const getUrlsByUser = async (userId: string): Promise<IUrl[]> => {
  const urls = await Url.find({ userId }).sort({ createdAt: -1 });
  return urls;
};
