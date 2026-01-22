// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';

// Get user from localStorage
let user = null;
try {
  const storedUser = localStorage.getItem('user');
  user = storedUser ? JSON.parse(storedUser) : null;
} catch (error) {
  console.error("Error parsing user data from localStorage:", error);
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

// --- ASYNC THUNKS ---

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      // Handle critical statuses that should prevent a valid session
      if (response.status === 'rejected' || response.status === 'suspended') {
        return rejectWithValue(`Your account has been ${response.status}. Please contact support.`);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Login Failed');
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await authService.googleLogin(idToken);
      if (response.status === 'rejected' || response.status === 'suspended') {
        return rejectWithValue(`Your account has been ${response.status}. Please contact support.`);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Google Login Failed');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token);
      return response.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Verification failed'
      );
    }
  }
);

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerificationEmail(email);
      return response.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to resend email'
      );
    }
  }
);

// --- START: MERGED LOGIC ---

// Thunk to verify the 2FA token
export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async ({ email, token }, { rejectWithValue }) => {
    try {
      return await authService.verifyTwoFactor(email, token);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid 2FA token.');
    }
  }
);

// Thunk to check for an existing session
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      return { isAuthenticated: false, user: null };
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      return { isAuthenticated: true, user: parsedUser };
    } catch (error) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return rejectWithValue({ isAuthenticated: false, user: null, error: 'Invalid stored user data' });
    }
  }
);

// Thunks for managing 2FA settings
export const generateTwoFactor = createAsyncThunk(
  'auth/generateTwoFactor',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.generateTwoFactor();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate 2FA secret.');
    }
  }
);

export const enableTwoFactor = createAsyncThunk(
  'auth/enableTwoFactor',
  async (token, { rejectWithValue }) => {
    try {
      return await authService.enableTwoFactor(token);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enable 2FA. Invalid token.');
    }
  }
);

export const disableTwoFactor = createAsyncThunk(
  'auth/disableTwoFactor',
  async (password, { rejectWithValue }) => {
    try {
      return await authService.disableTwoFactor(password);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to disable 2FA. Incorrect password.');
    }
  }
);

// --- END: MERGED LOGIC ---

export const selectTenant = createAsyncThunk(
  'auth/selectTenant',
  async ({ companyId }, { rejectWithValue }) => {
    try {
      return await authService.selectTenant(companyId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to switch organization.');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const initialState = {
  user: user,
  isAuthenticated: !!user && !!localStorage.getItem('token'),
  loading: false,
  error: null,
  twoFactorPending: false, // State for 2FA flow
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Login Reducers ---
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;


        if (payload.twoFactorRequired) {
          state.isAuthenticated = false;
          state.twoFactorPending = true;
          state.user = { email: payload.email };
        } else {
          const { token, ...userData } = payload;
          state.user = userData;
          state.isAuthenticated = true;
          state.twoFactorPending = false;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.twoFactorPending = false;
      })

      // --- Google Login Reducers ---
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;

        if (payload.twoFactorRequired) {
          state.isAuthenticated = false;
          state.twoFactorPending = true;
          state.user = { email: payload.email };
        } else {
          const { token, ...userData } = payload;
          state.user = userData;
          state.isAuthenticated = true;
          state.twoFactorPending = false;
        }
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.twoFactorPending = false;
      })

      // --- Verify 2FA Reducers ---
      .addCase(verifyTwoFactor.pending, (state) => {
        //state.loading = true;
        state.error = null;
      })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        //state.loading = false;
        const { token, ...userData } = action.payload;
        state.user = userData;
        state.isAuthenticated = true;
        state.twoFactorPending = false;
        state.error = null;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        //state.loading = false;
        state.error = action.payload;
      })


      // --- CheckAuth Reducers ---
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })


      // --- Logout Reducer ---
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.twoFactorPending = false;
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
      })


      // --- Select Tenant Reducers ---
      .addCase(selectTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(selectTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(selectTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Generate 2FA Reducers ---
      .addCase(generateTwoFactor.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(generateTwoFactor.fulfilled, (state) => {
        // state.loading = false;
      })
      .addCase(generateTwoFactor.rejected, (state, action) => {
        // state.loading = false;
        state.error = action.payload;
      })

      // --- Enable 2FA Reducers ---
      .addCase(enableTwoFactor.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(enableTwoFactor.fulfilled, (state, action) => {
        // state.loading = false;
        if (state.user) {
          state.user.isTwoFactorEnabled = true;
        }
        state.error = null;
      })
      .addCase(enableTwoFactor.rejected, (state, action) => {
        // state.loading = false;
        state.error = action.payload;
      })

      // --- Disable 2FA Reducers ---
      .addCase(disableTwoFactor.pending, (state) => {
        state.loading = true; // This is kept intentionally for the user feedback on the profile page
        state.error = null;
      })
      .addCase(disableTwoFactor.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.isTwoFactorEnabled = false;
        }
        state.error = null;
      })
      .addCase(disableTwoFactor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Handle user profile updates from userSlice ---
      .addMatcher(
        (action) => action.type === 'users/fetchCurrentAuthUserProfile/fulfilled',
        (state, action) => {
          if (state.user && state.user.id === action.payload.id) {
            state.user = { ...state.user, ...action.payload };
            // Also sync to localStorage to keep it persistent across reloads
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...action.payload }));
          }
        }
      );
  },
});

export const { clearError } = authSlice.actions;

// --- Selectors ---
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsTwoFactorPending = (state) => state.auth.twoFactorPending;
export const selectUserStatus = (state) => state.auth.user?.status;

export default authSlice.reducer;