// controllers/auth.global.controller.js

import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse.js';

import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  getUserProfile,
  updateUserProfile,
  verifyTwoFactor,
  generateTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  loginWithGoogle,
  selectWorkspace,
} from '../services/auth.service.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUserController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ErrorResponse('Please provide name, email, and password', 400);
  }
  if (password.length < 10) {
    throw new ErrorResponse('Password must be at least 10 characters long', 400);
  }

  const origin = req.get('Origin');
  const result = await registerUser(name, email, password, origin);

  res.status(201).json(result);
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUserController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ErrorResponse('Please provide email and password', 400);
  }

  const companyId = req.company ? req.company?.id : null;
  const result = await loginUser(email, password, companyId);

  if (result.twoFactorRequired) {
    res.status(200).json({ message: 'Enter the code from your authenticator app.', twoFactorRequired: true, email: result.email });
  } else if (result.status && result.status !== 'ACTIVE') {
    res.status(403).json(result);
  } else {
    res.json(result);
  }
});

// @desc    Authenticate user with Google & get token
// @route   POST /api/auth/google-login
// @access  Public
export const googleLoginController = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ErrorResponse('Please provide Google ID token', 400);
  }

  const result = await loginWithGoogle(idToken);

  if (result.twoFactorRequired) {
    res.status(200).json({ message: 'Enter the code from your authenticator app.', twoFactorRequired: true, email: result.email });
  } else if (result.status && result.status !== 'ACTIVE') {
    res.status(403).json(result);
  } else {
    res.json(result);
  }
});


// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmailController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ErrorResponse("Email is required.", 400);
  }

  await resendVerificationEmail(email, req.get('Origin'));

  res.status(200).json({ message: 'If an account with that email exists and requires verification, a new link has been sent.' });
});

// @desc    Verify user email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmailController = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ErrorResponse('Verification token is required', 400);
  }

  await verifyEmail(token);

  res.status(200).json({ message: 'Email verified successfully. Your account is now awaiting admin approval.' });
});

/**
 * @desc    Sets the active workspace (company or personal) for a user session.
 * @route   POST /api/auth/select-workspace
 * @access  Private
 */
export const selectWorkspaceController = asyncHandler(async (req, res) => {
  // companyId can be a string or null/undefined from the request body.
  const { companyId } = req.body;
  const userId = req.user.id;

  // The validation is now handled inside the service.
  // We pass companyId directly, whether it's an ID or null.
  const result = await selectWorkspace(userId, companyId);

  res.json(result);
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfileController = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    throw new ErrorResponse('Not authorized, user information missing', 401);
  }

  const userProfile = await getUserProfile(req.user.id);

  if (!userProfile) {
    throw new ErrorResponse('User not found', 404);
  }

  res.json(userProfile);
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfileController = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    throw new ErrorResponse('Not authorized, user information missing', 401);
  }

  const userId = req.user.id;
  const { password, ...dataToUpdate } = req.body;

  if (password && password.length < 6) {
    throw new ErrorResponse('New password must be at least 6 characters long', 400);
  }

  const updatedUser = await updateUserProfile(userId, dataToUpdate, password, req.user.companyId);

  res.json(updatedUser);
});


// @desc    Verify user 2FA token
// @route   POST /api/auth/verify-2fa
// @access  Public
export const verifyTwoFactorController = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    throw new ErrorResponse('Email and 2FA token are required.', 400);
  }

  const result = await verifyTwoFactor(email, token);

  res.status(200).json(result);
});

// @desc    Generate a new 2FA secret and QR code
// @route   POST /api/auth/generate-2fa
// @access  Private
export const generateTwoFactorController = asyncHandler(async (req, res) => {
  const { secret, qrCodeUrl } = await generateTwoFactor(req.user.id);
  res.json({ secret, qrCodeUrl });
});

// @desc    Enable 2FA for the user
// @route   POST /api/auth/enable-2fa
// @access  Private
export const enableTwoFactorController = asyncHandler(async (req, res) => {
  const { token } = req.body;

  await enableTwoFactor(req.user.id, token);

  res.status(200).json({ message: '2FA has been enabled successfully.' });
});

// @desc    Disable 2FA for the user
// @route   POST /api/auth/disable-2fa
// @access  Private
export const disableTwoFactorController = asyncHandler(async (req, res) => {
  const { password } = req.body;

  await disableTwoFactor(req.user.id, password);

  res.json({ message: '2FA has been disabled.' });
});
