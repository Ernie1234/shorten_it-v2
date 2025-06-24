import User from "../models/User";
import type { IUser } from "@repo/types";
import { ApiError } from "@repo/utils";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "supersecretjwtkeythatshouldbechangedinproduction";

/**
 * Registers a new user.
 * @param userData User details (name, email, password).
 * @returns Registered user object.
 */
export const registerUser = async (
  userData: Partial<IUser>,
): Promise<IUser> => {
  const { email } = userData;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists.");
  }
  const newUser = await User.create(userData);
  return newUser;
};

/**
 * Logs in a user with email and password.
 * @param email User email.
 * @param password User password.
 * @returns User object and JWT token.
 */
export const loginUser = async (
  email: string,
  password_plain: string,
): Promise<{ user: IUser; token: string }> => {
  const user = await User.findOne({ email }).select("+password"); // Select password explicitly
  if (!user || !(await user.comparePassword(password_plain))) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });
  // Omit password when returning user object
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;
  return { user: userWithoutPassword, token };
};

/**
 * Finds or creates a user based on Google profile.
 * @param profile Google profile data.
 * @returns User object and JWT token.
 */
export const findOrCreateGoogleUser = async (
  profile: any,
): Promise<{ user: IUser; token: string }> => {
  let user = await User.findOne({ googleId: profile.id });

  if (!user) {
    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      // If user exists with email but no Google ID, link Google ID
      user.googleId = profile.id;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
      });
    }
  }

  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });
  return { user, token };
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  const user = await User.findById(userId);
  return user;
};
