// src/features/auth/index.js

// Exporting files for cleaner imports throughout the application.

// --- Page Components ---
export { default as LoginPage }                 from './pages/Login';
export { default as RegisterPage }              from './pages/Register';
export { default as PendingApprovalPage }       from './pages/PendingApproval';
export { default as RequestVerificationPage }   from './pages/RequestVerification';
export { default as SelectTenantPage }          from './pages/SelectTenantPage';
export { default as VerifyEmailPage }           from './pages/VerifyEmail';
export { default as VerifyTwoFactorPage }       from './pages/VerifyTwoFactor';
export { default as SetupTwoFactorPage }        from './pages/SetupTwoFactor';

export { default as SetupTwoFactorModal }       from './components/SetupTwoFactorModal';


// --- Redux Slice Exports ---
export {
  // --- Thunks ---
  register,
  login,
  logout,
  checkAuth,
  selectTenant,
  // Email Verification Thunks
  verifyEmail,
  resendVerificationEmail,
  // 2FA Thunks
  verifyTwoFactor,
  generateTwoFactor,
  enableTwoFactor,
  disableTwoFactor,

  // --- Actions ---
  clearError,

  // --- Selectors ---
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectUserStatus,
  // 2FA Selector
  selectIsTwoFactorPending,
} from './slices/authSlice';

// --- Service Exports (Uncommon, usually not needed here) ---