import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services';

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard');
      // The backend now returns a detailed object
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard data'
      );
    }
  }
);



export const fetchAdminDashboard = createAsyncThunk(
  'dashboard/fetchAdminDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard/admin');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch admin dashboard data'
      );
    }
  }
);

// MODIFIED: The initial state now reflects the new, richer data structure from the API.
const initialState = {
  data: {
    recentProjects: [],
    assignedIssues: [],
    issuesByStatus: [],
    issuesByPriority: [],
    recentActivity: [],
    dueSoonIssues: [],
    counts: {
      projects: 0,
      assignedIssues: 0,
      reportedIssues: 0,
    },
  },

  adminDashboard: null,   // To store admin-specific dashboard data
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    // MODIFIED: Reset now uses the new initial state structure
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // MODIFIED: The entire payload is now stored in state.data
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })



      // Fetch Admin Dashboard
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.adminDashboard = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardError, resetDashboard } = dashboardSlice.actions;

export default dashboardSlice.reducer;