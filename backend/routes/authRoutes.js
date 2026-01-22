// routes/authRoutes.js
import express from 'express';

import {
  registerUserController,
  loginUserController,
  verifyEmailController,
  resendVerificationEmailController,
  getUserProfileController,
  updateUserProfileController,
  selectWorkspaceController,

  // 2FA related imports
  verifyTwoFactorController,
  generateTwoFactorController,
  enableTwoFactorController,
  disableTwoFactorController,
  googleLoginController,
} from '../controllers/auth.global.controller.js';

import { protect } from '../middleware/authMiddleware.js';

import Validators from '../utils/validators.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and profile management
 */

// ----------------------------------------------------------------
// -- PUBLIC ROUTES
// -- (No 'protect' middleware needed)
// ----------------------------------------------------------------

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 10
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please check your email to verify your account.
 *                 status:
 *                   type: string
 *                   example: PENDING_VERIFICATION
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post('/register', Validators.register(), validate, registerUserController);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate and log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: User ID
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 twoFactorRequired:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post('/login', loginUserController);

/**
 * @swagger
 * /auth/google-login:
 *   post:
 *     summary: Authenticate and log in a user with Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid Google token
 *       500:
 *         description: Server error
 */
router.post('/google-login', googleLoginController);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify user email with a token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The verification token sent to the user's email
 *         example: some_long_verification_token
 *     responses:
 *       200:
 *         description: Email successfully verified. Account now pending admin approval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully. Your account is now awaiting admin approval.
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.get('/verify-email', verifyEmailController);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Verification email resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If an account with that email exists and requires verification, a new link has been sent.
 *       400:
 *         description: Email is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post('/resend-verification', resendVerificationEmailController);

router.post('/verify-2fa', verifyTwoFactorController);

// ----------------------------------------------------------------
// -- PROTECTED ROUTES
// -- (These routes require a valid JWT)
// ----------------------------------------------------------------

/**
 * @swagger
 * /auth/select-workspace:
 *   post:
 *     summary: Select an active workspace (company or personal)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 nullable: true
 *                 description: The ID of the company to switch to. Send null or omit to switch to the personal workspace.
 *                 example: clxko2x9s000008l3gwpw0h9d
 *     responses:
 *       200:
 *         description: Workspace selected successfully, returns new user session object with a new token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User is not a member of the requested company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/select-workspace', protect, selectWorkspaceController);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the current user's profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route('/profile')
  .get(protect, getUserProfileController)
  .put(protect, updateUserProfileController);


// New protected routes for managing 2FA
router.post('/generate-2fa', protect, generateTwoFactorController);
router.post('/enable-2fa', protect, enableTwoFactorController);
router.post('/disable-2fa', protect, disableTwoFactorController);

export default router;
