// src/services/authService.js
import { api } from '../../../services'; // Adjust path if necessary

/**
 * NEW LOGIC: Registers a user but does NOT log them in or handle tokens.
 * It sends user data and returns a confirmation message from the backend.
 * @param {object} userData - { name, email, password }
 */
const register = async (userData) => {
  console.log('[authService] Attempting registration for:', userData.email);
  const response = await api.post('/auth/register', userData);
  console.log('[authService] Registration API call complete. Response:', response.data);
  return response.data;
};

/**
 * Logs in a user. This is the primary function for getting a JWT.
 * It stores the token and user data upon successful login.
 * @param {string} email
 * @param {string} password
 */
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  // This logic is correct for login, as it's supposed to return a token for ACTIVE users.
  if (response.data && response.data.token) {
    console.log('[authService] Login: Success. Storing token and user data.');
    localStorage.setItem('token', response.data.token);
    const { token, ...userFieldsToStore } = response.data;
    localStorage.setItem('user', JSON.stringify(userFieldsToStore));
  }
  return response.data; // Return the full response (or error) to the thunk.
};

/**
 * Logs in a user with Google.
 * @param {string} idToken
 */
const googleLogin = async (idToken) => {
  const response = await api.post('/auth/google-login', { idToken });
  if (response.data && response.data.token) {
    console.log('[authService] Google Login: Success. Storing token and user data.');
    localStorage.setItem('token', response.data.token);
    const { token, ...userFieldsToStore } = response.data;
    localStorage.setItem('user', JSON.stringify(userFieldsToStore));
  }
  return response.data;
};

/**
 * Removes user credentials from local storage.
 */
const logout = () => { // Note: making this synchronous is fine as it's just localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('[authService] Logout: Token and user removed from localStorage.');
};

/**
 * Switches the user's active company, receiving a new tenant-specific token.
 * @param {string} companyId - The ID of the company to switch to.
 */
const selectTenant = async (companyId) => {
  const response = await api.post('/auth/select-workspace', { companyId });
  if (response.data && response.data.token) {
    console.log('[authService] SelectTenant: Success. Received new tenant-specific token.');
    localStorage.setItem('token', response.data.token);
    const { token, ...userFieldsToStore } = response.data;
    localStorage.setItem('user', JSON.stringify(userFieldsToStore));
  } else {
    console.warn('[authService] SelectTenant: Response did not contain a new token.', response.data);
  }
  return response.data;
};

/**
 * Updates the user's profile information.
 * @param {object} profileData - Data to update { name, email, avatar, password }.
 */
const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  if (response.data) {
    // Overwrite the local user object with the fresh data from the server
    // to ensure frontend state is in sync with the backend.
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const updatedUser = { ...currentUser, ...response.data };

    // The response for update does not contain the token, so we don't need to destructure it.
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('[authService] Profile updated. Stored user:', updatedUser);
  }
  return response.data;
};

/**
 * Fetches the user's complete profile from the server.
 */
const getProfile = async () => {
  const response = await api.get('/auth/profile');
  if (response.data) {
    // Overwrite local user data with the definitive profile from the server.
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// --- NEW FUNCTIONS FOR VERIFICATION FLOW ---

/**
 * Sends a verification token to the backend to activate a user account.
 * This should be a GET request matching the backend controller.
 * @param {string} token - The verification token from the email link.
 */
const verifyEmail = async (token) => {
  // Using a GET request as the token is in the URL query string.
  const response = await api.get(`/auth/verify-email?token=${token}`);
  // Expected response: { message: "..." }
  return response.data;
};

/**
 * Requests a new verification email for a given email address.
 * @param {string} email - The user's email address.
 */
const resendVerificationEmail = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  // Expected response: { message: "..." }
  return response.data;
};

// --- 2FA Functions ---

const verifyTwoFactor = async (email, token) => {
  const response = await api.post('/auth/verify-2fa', { email, token });

  if (response.data && response.data.token) {
    console.log('[authService] 2FA Verify: Success. Storing token and user data.');
    localStorage.setItem('token', response.data.token);
    const { token, ...userFieldsToStore } = response.data;
    localStorage.setItem('user', JSON.stringify(userFieldsToStore));
  }
  return response.data;
};

const generateTwoFactor = async () => {
  const response = await api.post('/auth/generate-2fa');
  return response.data;
};

const enableTwoFactor = async (token) => {
  const response = await api.post('/auth/enable-2fa', { token });
  return response.data;
};

const disableTwoFactor = async (password) => {
  const response = await api.post('/auth/disable-2fa', { password });
  return response.data;
};


const authService = {
  register,
  login,
  googleLogin,
  logout,
  selectTenant,
  updateProfile,
  getProfile,

  verifyEmail,
  resendVerificationEmail,

  verifyTwoFactor,
  generateTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
};

export default authService;