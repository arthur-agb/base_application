// src/store/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services';

// NEW Thunk to fetch the currently authenticated user's profile
export const fetchCurrentAuthUserProfile = createAsyncThunk(
  'users/fetchCurrentAuthUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile'); // Hits GET /api/users/profile
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch current user profile'
      );
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users'); // This now gets users for assignment
      return response.data; // Expects an array directly from listUsersForAssignment
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch users'
      );
    }
  }
);

export const fetchUserByEmail = createAsyncThunk(
  'users/fetchUserByEmail',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users?email=${email}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user by email'
      );
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ email, userData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users?email=${email}`, userData); // Admin update
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update user'
      );
    }
  }
);

export const updateSelfProfile = createAsyncThunk(
  'users/updateSelfProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      console.error("updateSelfProfile Error Raw:", error);
      console.error("updateSelfProfile Error Response Data:", error.response?.data);
      return rejectWithValue(message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (email, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${email}`); // Path parameter for DELETE
      return email;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete user'
      );
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/search', { params: { query } });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search users'
      );
    }
  }
);

export const getUserIssues = createAsyncThunk(
  'users/getUserIssues',
  async (email, { rejectWithValue }) => { // `email` param might be for admin context
    try {
      const response = await api.get(`/users/issues`); // Assumes current user issues
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user issues'
      );
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/stats?email=${email}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user statistics'
      );
    }
  }
);


const initialState = {
  users: [],
  currentUser: null,
  selectedUserIssues: [],
  searchResults: [],
  userStats: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Reducers for fetchCurrentAuthUserProfile
      .addCase(fetchCurrentAuthUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentAuthUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload; // This is the UserResponse object
      })
      .addCase(fetchCurrentAuthUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentUser = null;
      })

      // fetchUserByEmail (usage should be reviewed)
      .addCase(fetchUserByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        // Don't clear currentUser if this thunk is for viewing a *different* user profile
        // state.currentUser = null;
      })
      .addCase(fetchUserByEmail.fulfilled, (state, action) => {
        state.loading = false;
        // This might set currentUser if it's for viewing another user in a modal, for example.
        // If this thunk's result is not intended for the main state.currentUser, handle differently.
        state.currentUser = action.payload;
      })
      .addCase(fetchUserByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload };
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = { ...state.currentUser, ...action.payload };
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateSelfProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSelfProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateSelfProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload || []; // GET /api/users now returns an array directly
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.users = [];
      })

      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.email !== action.payload);
        if (state.currentUser?.email === action.payload) {
          state.currentUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.searchResults = [];
      })

      .addCase(getUserIssues.pending, (state) => {
        state.loading = true;
        state.selectedUserIssues = [];
        state.error = null;
      })
      .addCase(getUserIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUserIssues = action.payload.issues || [];
      })
      .addCase(getUserIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedUserIssues = [];
      })

      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.userStats = null;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.userStats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.userStats = null;
      })

      // --- Clears currentUser on tenant switch to ensure Layout consumes fresh auth data immediately ---
      .addMatcher(
        (action) => action.type === 'auth/selectTenant/fulfilled',
        (state) => {
          state.currentUser = null;
        }
      );
  },
});

export const { clearUserError, clearCurrentUser, clearSearchResults } =
  userSlice.actions;

export default userSlice.reducer;