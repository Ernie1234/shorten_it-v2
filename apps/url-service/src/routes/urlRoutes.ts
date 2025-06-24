import { Router } from "express";
import {
  shortenUrl,
  redirectToOriginalUrl,
  validate,
  createUrlSchema,
  getUserUrls,
} from "../controllers/urlController";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Url:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60c72b2f9c1b3c001c8c4a4e
 *         originalUrl:
 *           type: string
 *           format: url
 *           example: https://www.example.com/long/path/to/resource
 *         shortCode:
 *           type: string
 *           example: abcdefg
 *         clicks:
 *           type: integer
 *           example: 10
 *         userId:
 *           type: string
 *           example: 60c72b2f9c1b3c001c8c4a4f
 *         createdAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: URLs
 *   description: URL shortening and redirection operations
 */

/**
 * @swagger
 * /api/urls/shorten:
 *   post:
 *     summary: Shorten a long URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: url
 *                 example: https://www.example.com/very/long/url/path
 *     responses:
 *       201:
 *         description: URL shortened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "URL shortened successfully!"
 *                 data:
 *                   $ref: '#/components/schemas/Url'
 *       400:
 *         description: Invalid URL or validation error
 *       500:
 *         description: Server error
 */
router.post("/shorten", validate(createUrlSchema), shortenUrl);

/**
 * @swagger
 * /api/urls/{shortCode}:
 *   get:
 *     summary: Redirect to the original URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The short code of the URL
 *     responses:
 *       302:
 *         description: Redirects to the original URL
 *       404:
 *         description: Short URL not found
 *       500:
 *         description: Server error
 */
router.get("/:shortCode", redirectToOriginalUrl);

/**
 * @swagger
 * /api/urls/my-urls:
 *   get:
 *     summary: Get all URLs shortened by the authenticated user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of URLs shortened by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User URLs fetched successfully!"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Url'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get("/my-urls", getUserUrls);

export default router;
