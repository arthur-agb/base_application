// src/features/users/index.js

// --- Page Components ---
export { default as UserProfilePage } from './pages/UserProfile'; // Assuming UserProfile.jsx is UserProfilePage

// --- Redux Slice Exports (from ./slices/userSlice.js) ---
export {
  // Thunks
  fetchCurrentAuthUserProfile, // Ensure this new thunk is exported
  fetchUsers,
  fetchUserByEmail,
  updateUser,
  updateSelfProfile,
  deleteUser,
  searchUsers,
  getUserIssues,
  fetchUserStats,

  // Actions
  clearUserError,
  clearCurrentUser,
  clearSearchResults
} from './slices/userSlice';

// --- Component Exports (Optional) ---

// --- Service Exports (Optional, Uncommon if no userService.js exists or is needed externally) ---

// --- Skeleton Exports (Optional) ---
export { default as UserProfileSkeleton } from './skeletons/UserProfileSkeleton';