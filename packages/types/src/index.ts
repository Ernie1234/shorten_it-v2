// Shared interfaces for User, URL, and common API responses
import { Types } from 'mongoose';

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUrl {
  _id?: string; // MongoDB ObjectId
  originalUrl: string;
  shortCode: string;
  clicks: number;
  userId?: string; // Optional: to link to a user
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  // Standard JWT claims
  iat?: number; // Issued at (optional)
  exp?: number;
  // Add other relevant user data to the JWT payload
}
