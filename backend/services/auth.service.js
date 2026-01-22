// services/auth.service.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Logger from '../utils/logger.js';
import { sendVerificationEmail } from '../utils/emailSender.js';
import { generateSecret, verifyToken, encrypt } from '../utils/authenticator.js';
import { OAuth2Client } from 'google-auth-library';

// Import the refactored models and direct Prisma client
import UserMain from '../models/users/UserMain.js';
import UserCredentials from '../models/users/UserCredentials.js';
import prisma from '../utils/prismaClient.js';
import ErrorResponse from '../utils/errorResponse.js';
import { UserStatus } from '@prisma/client';
import { getGlobal } from '../utils/globalsInitializer.js';


// --- HELPER FUNCTIONS ---

// Generate JWT Token
const generateToken = (id, companyId = null) => {
  if (!process.env.JWT_SECRET) {
    Logger.error("FATAL ERROR: JWT_SECRET is not defined.");
    throw new Error("Server configuration error: JWT secret missing.");
  }
  const payload = { id, companyId };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// Generate Verification Token Details
const generateVerificationDetails = () => {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const emailVerificationTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour
  return { verificationToken, emailVerificationToken, emailVerificationTokenExpiresAt };
};

// --- CORE SERVICE FUNCTIONS ---

/**
 * @desc    Registers a new user and sends a verification email.
 */
export const registerUser = async (name, email, password, origin) => {
  const lowerCaseEmail = email.toLowerCase();

  // Check for existing user by email
  const userExists = await UserMain.findUserByEmail(lowerCaseEmail, {
    credentials: true
  });

  if (userExists) {
    if (userExists.status === UserStatus.PENDING_VERIFICATION) {
      const { verificationToken, emailVerificationToken, emailVerificationTokenExpiresAt } = generateVerificationDetails();

      await UserMain.updateUserWithSelect(
        userExists.id,
        {
          emailVerificationToken,
          emailVerificationTokenExpiresAt
        },
        { id: true });

      await sendVerificationEmail(
        lowerCaseEmail,
        userExists.displayName,
        verificationToken,
        origin
      );

      Logger.info(`Resent verification for existing unverified user [${lowerCaseEmail}]`);
      return { message: 'Registration successful. A verification email has been sent to you.', status: UserStatus.PENDING_VERIFICATION };
    } else {
      throw new Error('An account with this email already exists.');
    }
  }

  // Generate a unique username
  let baseUsername = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (baseUsername.length === 0) { baseUsername = "user"; }
  let generatedUsername = baseUsername;
  let counter = 0;
  while (true) {
    const existingUserWithUsername = await UserMain.findUserByUsername(generatedUsername);
    if (!existingUserWithUsername) { break; }
    counter++;
    generatedUsername = `${baseUsername}_${counter}`;
  }

  // Hash password and generate verification tokens
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const { verificationToken, emailVerificationToken, emailVerificationTokenExpiresAt } = generateVerificationDetails();

  try {
    // Use a transaction to create the user and their credentials atomically
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.userMain.create({
        data: {
          username: generatedUsername,
          displayName: name,
          email: lowerCaseEmail,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
          status: UserStatus.PENDING_VERIFICATION,
          emailVerificationToken,
          emailVerificationTokenExpiresAt,
        },
      });
      await prisma.userCredentials.create({
        data: {
          userId: newUser.id,
          passwordHash: hashedPassword,
          lastLoginAt: new Date(),
        },
      });
      await prisma.userSettings.create({
        data: {
          userId: newUser.id,
          theme: 'SYSTEM',
          sidebarSize: 'MEDIUM',
          notificationsEnabled: false,
        },
      });
      await prisma.userSubscription.create({
        data: {
          userId: newUser.id,
          planId: getGlobal('freePlanId'),
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: null,
        },
      });
      return newUser;
    });

    await sendVerificationEmail(user.email, user.displayName || user.username, verificationToken, origin);
    return { message: 'Registration successful. Please check your email to verify your account.', status: user.status };
  } catch (error) {
    Logger.error("Registration Error:", error);
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        throw new Error('An account with this email already exists.');
      }
      if (error.meta?.target?.includes('username')) {
        throw new Error('Could not generate a unique username. Please try again.');
      }
    }
    throw new Error('User registration failed. Please try again.');
  }
};

/**
 * @desc    Authenticates a user and returns a token.
 */
export const loginUser = async (email, password, companyId) => {
  const lowerCaseEmail = email.toLowerCase();

  const user = await UserMain.findUserByEmail(lowerCaseEmail, {
    companies: { select: { company: { select: { id: true, name: true, slug: true } } } },
    credentials: { select: { passwordHash: true, twoFactorSecret: true } },
    settings: { select: { lastActiveCompanyId: true } }
  });

  if (!user || !(await bcrypt.compare(password, user.credentials.passwordHash))) {
    throw new Error('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    return {
      message: `Your account is not active. Status: ${user.status}.`,
      status: user.status,
      email: user.email,
    };
    // To complete: need to add redirect logic in here for email verification, pending approval, etc.
  }

  if (user.credentials.twoFactorSecret) {
    Logger.info(`2FA required for user [${lowerCaseEmail}].`);
    return { twoFactorRequired: true, email: user.email };
  }

  const userCompanies = user.companies.map(c => c.company);
  let activeCompanyId = null;
  let companyRole = null;

  // Determine active company ID
  // Logic:
  // 1. Explicit 'companyId' argument takes precedence.
  // 2. Saved 'lastActiveCompanyId' preference is used next.
  // 3. Fallback to single company ONLY if no preference exists (rare, as settings are created on register).

  let targetCompanyId = companyId;
  let trustSettings = !companyId && !!user.settings; // Only look at settings if no explicit ID passed

  if (trustSettings && user.settings.lastActiveCompanyId) {
    targetCompanyId = user.settings.lastActiveCompanyId;
  }

  // Verify target membership if we have a candidate
  if (targetCompanyId) {
    const isMember = userCompanies.some(c => c.id === targetCompanyId);

    if (isMember) {
      activeCompanyId = targetCompanyId;
      const membership = await prisma.companyUser.findUnique({
        where: { companyId_userId: { userId: user.id, companyId: activeCompanyId } },
        select: { role: true }
      });
      companyRole = membership?.role;
    } else if (companyId) {
      // Only throw if the USER explicitly requested a company they aren't in
      const company = await prisma.companyMain.findUnique({ where: { id: companyId } });
      throw new Error(`You are not a member of the '${company.name}' organization.`);
    }
  }

  // Strict Personal Workspace Fallback:
  // We ONLY auto-select the single company if we did NOT consult settings.
  // If settings exist and we are here, it means lastActiveCompanyId was null (Personal), 
  // or invalid (user left company). In either case, Personal Workspace (null) is the correct fallback.
  const shouldAutoSelect = !companyId && !user.settings && userCompanies.length === 1;

  if (shouldAutoSelect) {
    activeCompanyId = userCompanies[0].id;
    const membership = await prisma.companyUser.findUnique({
      where: { companyId_userId: { userId: user.id, companyId: activeCompanyId } },
      select: { role: true }
    });
    companyRole = membership?.role;
  }

  const userResponse = {
    id: user.id,
    displayName: user.displayName || user.username,
    name: user.displayName || user.username, // Maintain name for legacy compatibility if needed
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    companyRole,
    status: user.status,
    companies: userCompanies,
    activeCompanyId,
    isTwoFactorEnabled: !!user.credentials.twoFactorSecret,
    isEmailVerified: user.isEmailVerified,
  };

  return {
    ...userResponse,
    token: generateToken(user.id, activeCompanyId),
  };
};

/**
 * @desc    Authenticates a user with Google and returns a token.
 */
export const loginWithGoogle = async (idToken) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    Logger.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;
  const lowerCaseEmail = email.toLowerCase();

  Logger.info(`[Google SSO] Token verified for email: ${lowerCaseEmail}`);

  let user = await UserMain.findUserByGoogleId(googleId, {
    companies: { select: { company: { select: { id: true, name: true, slug: true } } } },
    credentials: { select: { twoFactorSecret: true } },
    settings: { select: { lastActiveCompanyId: true } }
  });

  // 2. If not found by googleId, try to find by email
  if (!user) {
    user = await UserMain.findUserByEmail(lowerCaseEmail, {
      companies: { select: { company: { select: { id: true, name: true, slug: true } } } },
      credentials: { select: { twoFactorSecret: true } },
      settings: { select: { lastActiveCompanyId: true } }
    });

    if (user) {
      // Link Google account to existing user
      Logger.info(`[Google SSO] Linking existing user account: ${lowerCaseEmail} (ID: ${user.id})`);
      await UserMain.updateUserWithSelect(user.id, { googleId }, { id: true });
    }
  }

  // 3. If still not found, create a new user
  if (!user) {
    // Generate a unique username
    let baseUsername = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (baseUsername.length === 0) { baseUsername = "user"; }
    let generatedUsername = baseUsername;
    let counter = 0;
    while (true) {
      const existingUserWithUsername = await UserMain.findUserByUsername(generatedUsername);
      if (!existingUserWithUsername) { break; }
      counter++;
      generatedUsername = `${baseUsername}_${counter}`;
    }

    Logger.info(`[Google SSO] Creating new user account: ${lowerCaseEmail} with username: ${generatedUsername}`);
    try {
      user = await prisma.$transaction(async (prisma) => {
        const newUser = await prisma.userMain.create({
          data: {
            username: generatedUsername,
            displayName: name,
            email: lowerCaseEmail,
            avatarUrl: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
            status: UserStatus.ACTIVE, // Google users are pre-verified
            isEmailVerified: true,
            googleId,
          },
        });
        await prisma.userCredentials.create({
          data: {
            userId: newUser.id,
            passwordHash: '', // No password for Google users
            lastLoginAt: new Date(),
          },
        });
        await prisma.userSettings.create({
          data: {
            userId: newUser.id,
            theme: 'SYSTEM',
            sidebarSize: 'MEDIUM',
            notificationsEnabled: false,
          },
        });
        await prisma.userSubscription.create({
          data: {
            userId: newUser.id,
            planId: getGlobal('freePlanId'),
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: null,
          },
        });
        return newUser;
      });

      // Refetch with relations
      user = await UserMain.findUserByIdWithSelect(user.id, {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        role: true,
        status: true,
        companies: { select: { company: { select: { id: true, name: true, slug: true } } } },
        credentials: { select: { twoFactorSecret: true } }
      });

    } catch (error) {
      Logger.error("Google Registration Error:", error);
      throw new Error('User registration with Google failed.');
    }
  }

  if (user.status !== 'ACTIVE') {
    return {
      message: `Your account is not active. Status: ${user.status}.`,
      status: user.status,
      email: user.email,
    };
  }

  // 2FA check (though usually Google SSO might bypass this, let's keep it if enabled)
  // 2FA check REMOVED for Google SSO as Google provides sufficient security
  // and we want a seamless experience.
  // if (user.credentials?.twoFactorSecret) {
  //   Logger.info(`2FA required for user [${lowerCaseEmail}] (Google Login).`);
  //   return { twoFactorRequired: true, email: user.email };
  // }

  const userCompanies = user.companies.map(c => c.company);
  let activeCompanyId = null;
  let companyRole = null;

  // Determine active company ID
  // Logic: 
  // 1. Saved 'lastActiveCompanyId' preference is used.
  // 2. Fallback to single company ONLY if no preference exists.
  let targetCompanyId = null;
  let trustSettings = !!user.settings;

  if (trustSettings && user.settings.lastActiveCompanyId) {
    targetCompanyId = user.settings.lastActiveCompanyId;
  }

  if (targetCompanyId) {
    const isMember = userCompanies.some(c => c.id === targetCompanyId);

    if (isMember) {
      activeCompanyId = targetCompanyId;
      const membership = await prisma.companyUser.findUnique({
        where: { companyId_userId: { userId: user.id, companyId: activeCompanyId } },
        select: { role: true }
      });
      companyRole = membership?.role;
    }
  }

  // Strict Personal Workspace Fallback:
  // We ONLY auto-select the single company if we did NOT consult settings.
  const shouldAutoSelect = !user.settings && userCompanies.length === 1;

  if (shouldAutoSelect) {
    activeCompanyId = userCompanies[0].id;
    const membership = await prisma.companyUser.findUnique({
      where: { companyId_userId: { userId: user.id, companyId: activeCompanyId } },
      select: { role: true }
    });
    companyRole = membership?.role;
  }

  const userResponse = {
    id: user.id,
    displayName: user.displayName || user.username,
    name: user.displayName || user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    companyRole,
    status: user.status,
    companies: userCompanies,
    activeCompanyId,
    isTwoFactorEnabled: !!user.credentials?.twoFactorSecret,
    isEmailVerified: user.isEmailVerified,
  };

  return {
    ...userResponse,
    token: generateToken(user.id, activeCompanyId),
  };
};

/**
 * @desc    Resends a verification email.
 */
export const resendVerificationEmail = async (email, origin) => {
  const lowerCaseEmail = email.toLowerCase();
  const user = await UserMain.findUserByEmail(lowerCaseEmail);

  if (user && user.status === UserStatus.PENDING_VERIFICATION) {
    const { verificationToken, emailVerificationToken, emailVerificationTokenExpiresAt } = generateVerificationDetails();
    await UserMain.updateUserWithSelect(user.id, { emailVerificationToken, emailVerificationTokenExpiresAt }, { id: true });
    await sendVerificationEmail(user.email, user.displayName || user.username, verificationToken, origin);
    Logger.info(`Resent verification email to [${lowerCaseEmail}] from origin [${origin}].`);
  }
};

/**
 * @desc    Verifies a user's email with a token.
 */
export const verifyEmail = async (token) => {
  if (!token) {
    throw new Error('Verification token is required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.userMain.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token. Please try again or request a new one.');
  }

  if (user.status !== UserStatus.PENDING_VERIFICATION) {
    throw new Error('This account has already been verified.');
  }

  // Define the data to be updated
  const updateData = {
    status: UserStatus.PENDING_APPROVAL,
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
  };

  await UserMain.updateUserWithSelect(user.id, updateData, { id: true });

  Logger.info(`Email verified for user [${user.email}]. Status is now pending approval from an admin.`);
};

/**
 * @desc    Selects an active workspace (company or personal) and generates a new token.
 * @param   {string} userId The ID of the user.
 * @param   {string | null} companyId The ID of the company to switch to, or null for the personal workspace.
 */
export const selectWorkspace = async (userId, companyId) => {
  // Retrieve the base user information using your custom data access method.
  const baseUser = await UserMain.findUserByIdWithSelect(userId, {
    id: true,
    displayName: true,
    email: true,
    avatarUrl: true,
    role: true,
    role: true,
    status: true,
    isEmailVerified: true,
    companies: {
      select: {
        company: {
          select: { id: true, name: true, slug: true }
        }
      }
    }
  });

  if (!baseUser) {
    throw new ErrorResponse('Your user profile could not be found.', 404);
  }

  // CASE 1: User is selecting a specific company workspace.
  if (companyId) {
    const membership = await prisma.companyUser.findUnique({
      where: { companyId_userId: { userId: userId, companyId: companyId } },
      include: { company: { select: { name: true } } }
    });

    if (!membership) {
      throw new ErrorResponse('You are not authorized to access this organization.', 403);
    }

    Logger.info(`User ID ${userId} selected tenant '${membership.company.name}' (ID: ${companyId}) with role ${membership.role}. Issuing new token.`);

    // Save the selection
    await prisma.userSettings.update({
      where: { userId },
      data: { lastActiveCompanyId: companyId }
    });

    // Assumes generateToken includes companyId in the JWT payload if provided.
    const newTenantToken = generateToken(userId, companyId);

    return {
      id: baseUser.id,
      displayName: baseUser.displayName,
      name: baseUser.displayName,
      email: baseUser.email,
      avatarUrl: baseUser.avatarUrl,
      role: baseUser.role,
      companyRole: membership.role,
      status: baseUser.status,
      companies: baseUser.companies.map(c => c.company),
      activeCompanyId: companyId,
      isEmailVerified: baseUser.isEmailVerified,
      token: newTenantToken,
    };
  }
  // CASE 2: User is selecting their personal workspace.
  else {
    Logger.info(`User ID ${userId} selected personal workspace. Issuing new token.`);

    // Save the selection (null for personal workspace)
    await prisma.userSettings.update({
      where: { userId },
      data: { lastActiveCompanyId: null }
    });

    // Generate a new token WITHOUT a companyId. Your generateToken function
    // must be able to handle the companyId argument being null or undefined.
    const personalToken = generateToken(userId);

    return {
      id: baseUser.id,
      displayName: baseUser.displayName,
      name: baseUser.displayName,
      email: baseUser.email,
      avatarUrl: baseUser.avatarUrl,
      role: baseUser.role,
      companyRole: null, // No company role in personal workspace
      status: baseUser.status,
      companies: baseUser.companies.map(c => c.company),
      activeCompanyId: null, // No active company
      isEmailVerified: baseUser.isEmailVerified,
      token: personalToken,
    };
  }
};

/**
 * @desc    Gets a user's profile information.
 */
export const getUserProfile = async (userId) => {
  const user = await UserMain.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const { password, emailVerificationToken, emailVerificationTokenExpiresAt, ...userProfileData } = user;

  return {
    ...userProfileData,
    avatar: user.avatarUrl
  };
};

/**
 * @desc    Updates a user's profile.
 */
export const updateUserProfile = async (userId, dataToUpdate, newPassword) => {
  if (dataToUpdate.email) {
    const existingUser = await UserMain.findUserByEmail(dataToUpdate.email);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email address already in use');
    }
  }

  if (newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await UserCredentials.update(userId, { passwordHash: hashedPassword });
  }

  const updatedUser = await UserMain.updateUserWithSelect(userId, dataToUpdate, {
    id: true,
    username: true,
    displayName: true,
    email: true,
    avatarUrl: true,
    role: true,
    status: true,
  });

  return updatedUser;
};

/**
 * @desc    Verifies a 2FA token.
 */
export const verifyTwoFactor = async (email, token) => {
  const lowerCaseEmail = email.toLowerCase();

  const user = await UserMain.findUserByEmail(lowerCaseEmail, {
    companies: { select: { company: { select: { id: true, name: true, slug: true } } } },
    credentials: { select: { passwordHash: true, twoFactorSecret: true } },
    settings: { select: { lastActiveCompanyId: true } }
  });

  if (!user || !user.credentials.twoFactorSecret) {
    throw new Error('Invalid credentials or 2FA not configured.');
  }

  const isValid = verifyToken(user.credentials.twoFactorSecret, token);

  if (!isValid) {
    Logger.error(`Invalid 2FA token attempt for user [${lowerCaseEmail}]`);
    throw new Error('Invalid 2FA token.');
  }

  Logger.info(`2FA verification successful for user [${lowerCaseEmail}]. Issuing token.`);

  const userCompanies = user.companies.map(c => c.company);
  let activeCompanyId = null;
  let companyRole = null;

  // Determine which company ID to use
  let targetCompanyId = null;
  if (user.settings?.lastActiveCompanyId) {
    targetCompanyId = user.settings.lastActiveCompanyId;
  }

  // If we have a target ID, verify membership
  if (targetCompanyId) {
    const isMember = userCompanies.some(c => c.id === targetCompanyId);

    if (isMember) {
      activeCompanyId = targetCompanyId;
      const membership = await prisma.companyUser.findUnique({
        where: { companyId_userId: { userId: user.id, companyId: activeCompanyId } },
        select: { role: true }
      });
      companyRole = membership?.role;
    }
  }

  // Fallback: If no valid target found AND user has only one company, default to it
  if (!activeCompanyId && userCompanies.length === 1) {
    activeCompanyId = userCompanies[0].id;
    const membership = await prisma.companyUser.findUnique({
      where: { companyId_userId: { userId: user.id, companyId: activeCompanyId } },
      select: { role: true }
    });
    companyRole = membership?.role;
  }

  const userResponse = {
    id: user.id,
    displayName: user.displayName || user.username,
    name: user.displayName || user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    companyRole,
    status: user.status,
    companies: userCompanies,
    activeCompanyId,
    isTwoFactorEnabled: !!user.credentials.twoFactorSecret,
  };

  return {
    ...userResponse,
    token: generateToken(user.id, activeCompanyId),
  };
};

/**
 * @desc    Generates a new 2FA secret and QR code.
 */
export const generateTwoFactor = async (userId) => {
  const user = await UserMain.findUserByIdWithSelect(userId, { id: true, email: true });
  if (!user) {
    throw new Error('User not found.');
  }

  const { secret, qrCodeUrl } = await generateSecret(user.email);

  await UserCredentials.update(userId, {
    twoFactorSecret: encrypt(secret),
  });

  return { secret, qrCodeUrl };
};

/**
 * @desc    Enables 2FA for a user.
 */
export const enableTwoFactor = async (userId, token) => {
  const userCreds = await UserCredentials.findByUserId(userId);

  if (userCreds.twoFactorSecret) {
    const isValid = verifyToken(userCreds.twoFactorSecret, token);

    if (!isValid) {
      throw new Error('Invalid token. Please try again.');
    }

    // No isTwoFactorEnabled field in schema, verification is enough

    Logger.info(`2FA enabled for user [${userId}]`);
    return { success: true, isTwoFactorEnabled: true };
  } else {
    // This flow shouldn't really happen here as setup is separate, 
    // but for completeness:
    return { success: false, message: "2FA is not set up." };
  }
};

/**
 * @desc    Disables 2FA for a user.
 */
export const disableTwoFactor = async (userId, password) => {
  const userCreds = await UserCredentials.findByUserId(userId);

  if (!(await bcrypt.compare(password, userCreds.passwordHash))) {
    throw new Error('Incorrect password.');
  }

  await UserCredentials.update(userId, {
    twoFactorSecret: null,
  });

  Logger.info(`2FA disabled for user [${userId}]`);
};

// --- NEW FUNCTIONS EXTRACTED FROM MIDDLEWARE ---

/**
 * @desc    Finds a user by ID including their companies.
 * @param   {string} userId - The user's ID.
 * @returns {Promise<object>} - The user object with relevant data.
 */
export const findUserWithCompaniesAndProjects = async (userId) => {
  const user = await prisma.userMain.findUnique({
    where: { id: userId },
    include: {
      companies: {
        select: { company: true }
      }
    }
  });

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  return user;
};



/**
 * @desc    Checks if a user is an ADMIN or MANAGER of a specific company.
 * @param   {string} userId
 * @param   {string} companyId
 */
export const checkCompanyAdminOrManager = async (userId, companyId) => {
  const membership = await prisma.companyUser.findUnique({
    where: {
      companyId_userId: {
        userId: userId,
        companyId: companyId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'MANAGER' && membership.role !== 'OWNER')) {
    Logger.warn(`[AuthService.checkCompanyAdminOrManager] User ${userId} attempted unauthorized access for company ${companyId}. Role: ${membership?.role}`);
    throw new ErrorResponse('Forbidden: You do not have sufficient privileges for this workspace.', 403);
  }
};

/**
 * @desc    Checks if a user is the OWNER of a specific company.
 * @param   {string} userId
 * @param   {string} companyId
 */
export const checkCompanyOwner = async (userId, companyId) => {
  const membership = await prisma.companyUser.findUnique({
    where: {
      companyId_userId: {
        userId: userId,
        companyId: companyId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership || membership.role !== 'OWNER') {
    Logger.warn(`[AuthService.checkCompanyOwner] User ${userId} attempted unauthorized access for company ${companyId}. Role: ${membership?.role}`);
    throw new ErrorResponse('Forbidden: Only the workspace owner can perform this action.', 403);
  }
};

/**
 * @desc    Finds a user by ID.
 * @param   {string} userId
 * @returns {Promise<object>} The user object.
 */
export const findUserWithProjects = async (userId) => {
  try {
    const user = await prisma.userMain.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    return user;

  } catch (error) {
    // Log the error for internal debugging
    Logger.error(`[AuthService.findUserWithProjects] An error occurred: ${error.message}`);

    // Re-throw a generic error to the client, preventing internal details from leaking.
    throw new ErrorResponse('Authentication failed.', 500);
  }
};
