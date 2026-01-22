// src/features/dashboard/index.js

// --- Page Components ---
export { default as DashboardPage } from './pages/Dashboard';
export { default as DashboardSkeleton } from './skeletons/DashboardSkeleton';

// --- Redux Slice Exports (from ./slices/dashboardSlice.js) ---
export {
  // Thunks
  fetchDashboard,
  fetchProjectDashboard,
  fetchAdminDashboard,

  // Actions
  clearDashboardError,
  resetDashboard
} from './slices/dashboardSlice';

// --- Component Exports (Optional) ---
// export { default as DashboardWidget } from './components/DashboardWidget';

// --- Service Exports (Optional, Uncommon if no dashboardService.js exists) ---