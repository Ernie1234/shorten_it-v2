import { Router } from "express";
import {
  register,
  login,
  validate,
  registerSchema,
  loginSchema,
  googleAuthCallback,
} from "../controllers/authController";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getUserById } from "../services/authService";

const router = Router();

// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!, // Must match your Google Cloud Console setting
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      // This callback is called after Google authenticates the user
      // `profile` contains user data from Google
      // We'll process this profile in findOrCreateGoogleUser
      done(null, profile);
    },
  ),
);

// Serialize user for session management (optional, mainly for session-based auth)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (id: any, done) => {
  try {
    const user = await getUserById(id.id); // For simplicity, we are getting it from Google's profile ID
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * @swagger
 * tags:
 * name: Auth
 * description: User authentication and authorization
 */

/**
 * @swagger
 * /api/auth/register:
 * post:
 * summary: Register a new user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * - email
 * - password
 * properties:
 * name:
 * type: string
 * example: John Doe
 * email:
 * type: string
 * format: email
 * example: john.doe@example.com
 * password:
 * type: string
 * format: password
 * example: mysecretpassword
 * responses:
 * 201:
 * description: User registered successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * message: { type: string, example: "User registered successfully!" }
 * data:
 * type: object
 * properties:
 * _id: { type: string, example: "60c72b2f9c1b3c001c8c4a4e" }
 * name: { type: string, example: "John Doe" }
 * email: { type: string, example: "john.doe@example.com" }
 * 400:
 * description: Validation error
 * 409:
 * description: User with this email already exists
 * 500:
 * description: Server error
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: Log in a user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: john.doe@example.com
 * password:
 * type: string
 * format: password
 * example: mysecretpassword
 * responses:
 * 200:
 * description: Logged in successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * message: { type: string, example: "Logged in successfully!" }
 * data:
 * type: object
 * properties:
 * user:
 * type: object
 * properties:
 * _id: { type: string, example: "60c72b2f9c1b3c001c8c4a4e" }
 * name: { type: string, example: "John Doe" }
 * email: { type: string, example: "john.doe@example.com" }
 * token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 * 400:
 * description: Validation error
 * 401:
 * description: Invalid credentials
 * 500:
 * description: Server error
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/google:
 * get:
 * summary: Initiate Google OAuth login
 * tags: [Auth]
 * responses:
 * 302:
 * description: Redirects to Google for authentication
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

/**
 * @swagger
 * /api/auth/google/callback:
 * get:
 * summary: Google OAuth callback
 * tags: [Auth]
 * description: This endpoint is called by Google after successful authentication. It redirects to the frontend with a JWT token.
 * responses:
 * 302:
 * description: Redirects to the frontend application with a JWT token.
 * 401:
 * description: Google authentication failed.
 * 500:
 * description: Server error.
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.WEB_APP_URL}/login?error=auth_failed`,
  }),
  googleAuthCallback,
);

export default router;
