// src/App.jsx
import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';

import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './config/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ----------------------------------------
// -- Local Repo Imports
// ----------------------------------------

// Import your theme and hook
import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from './context';

// Feature Imports
import {
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  PendingApprovalPage,
  RequestVerificationPage,
  checkAuth,
  selectTenant,
  SetupTwoFactorPage,
  VerifyTwoFactorPage,
} from './features/auth';

import {
  ProjectListPage,
  ProjectDetailPage,
} from './features/projects';

import {
  DashboardPage
} from './features/dashboard';

import {
  BoardViewPage,
  BoardRedirector,
  BoardJoinHandler,
} from './features/board';

import {
  EpicPage,
  EpicDetailPage
} from './features/epics';

import {
  SprintPage,
  SprintDetailPage
} from './features/sprints';

import {
  UserProfilePage,
  fetchCurrentAuthUserProfile,
} from './features/users';

import {
  TenantManagerPage,
} from './features/tenants';

import {
  NotFound,
  NotAuthorized,
} from './components/common';

import {
  Layout,
} from './components/layout';

import {
  AdminUserApprovalPage
} from './features/admin';

import {
  socketService,
} from './services';

import {
  Logger,
} from './utils';

// ----------------------------------------
// -- MUI Theme Config
// ----------------------------------------

const muiTheme = createTheme({
  palette: {
    primary: { main: '#0052CC' },
    secondary: { main: '#6554C0' },
    background: { default: '#F4F5F7' }, // Example default background
  },
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', '"Fira Sans"', '"Droid Sans"', '"Helvetica Neue"',
      'sans-serif',
    ].join(','),
  },
});

// ----------------------------------------------------
// -- ProtectedRoute with Company Admin Authorization
// ----------------------------------------------------

const ProtectedRoute = ({ children, isAdminRoute = false, isCompanyAdminRoute = false, isCompanyManagerRoute = false, isCompanyOwnerRoute = false }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }



  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }



  // Handle account status redirection first
  switch (user?.status) {
    case 'PENDING_VERIFICATION':
      if (location.pathname !== '/request-verification' && location.pathname !== '/verify-email' && !location.pathname.startsWith('/logout')) {
        Logger.info(`ProtectedRoute: User ${user.email} is PENDING_VERIFICATION. Redirecting to /login.`);
        return <Navigate to="/login" state={{ from: location, reason: 'PENDING_VERIFICATION' }} replace />;
      }
      break;
    case 'PENDING_APPROVAL':
      if (location.pathname !== '/pending-approval' && !location.pathname.startsWith('/logout')) {
        Logger.info(`ProtectedRoute: User ${user.email} is PENDING_APPROVAL. Redirecting to /pending-approval.`);
        return <Navigate to="/pending-approval" replace />;
      }
      break;
    case 'ACTIVE':
      // --- UPDATED: Role-based authorization for ACTIVE users ---
      if (isAdminRoute && user?.role !== 'ADMIN') { // Checks global platform role
        return <Navigate to="/not-authorized" replace />;
      }
      // Assumes user object in Redux has `companyRole` (e.g., from login/select-tenant API)
      if (isCompanyAdminRoute && !['ADMIN', 'OWNER'].includes(user?.companyRole)) {
        return <Navigate to="/not-authorized" replace />;
      }
      if (isCompanyManagerRoute && !['MANAGER', 'ADMIN', 'OWNER'].includes(user?.companyRole)) {
        return <Navigate to="/not-authorized" replace />;
      }
      if (isCompanyOwnerRoute && user?.companyRole !== 'OWNER') {
        return <Navigate to="/not-authorized" replace />;
      }
      break;
    default:
      // Includes null/undefined status, treats it as ok to proceed for legacy users
      if (!user?.status) {
        if (isAdminRoute && user?.role !== 'ADMIN') {
          return <Navigate to="/not-authorized" replace />;
        }
        if (isCompanyAdminRoute && !['ADMIN', 'OWNER'].includes(user?.companyRole)) {
          return <Navigate to="/not-authorized" replace />;
        }
        if (isCompanyManagerRoute && !['MANAGER', 'ADMIN', 'OWNER'].includes(user?.companyRole)) {
          return <Navigate to="/not-authorized" replace />;
        }
        if (isCompanyOwnerRoute && user?.companyRole !== 'OWNER') {
          return <Navigate to="/not-authorized" replace />;
        }
      } else {
        Logger.warn(`Unhandled user status: ${user?.status}. Redirecting to login.`);
        return <Navigate to="/login" state={{ from: location, error: "Your account status is unrecognized." }} replace />;
      }
      break;
  }

  return children;
};

// --------------------------------------------
// -- AppContent - Core Logic and Routing
// --------------------------------------------

const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user: authUser, loading: authLoading } = useSelector((state) => state.auth);
  const { currentUser, loading: userLoading, error: userError } = useSelector((state) => state.users);
  const userId = authUser?.id;
  const socketInitialized = useRef(false);
  const attemptedFetchForUser = useRef(null);

  // Get theme context values
  const { theme: currentGlobalThemeFromContext, setTheme: setGlobalTheme } = useTheme();

  // Effect to check authentication status on initial load
  useEffect(() => {
    Logger.info('AppContent: Dispatching checkAuth on initial load.');
    dispatch(checkAuth());
  }, [dispatch]);

  // Effect to fetch the current user's detailed profile if authenticated and ACTIVE
  useEffect(() => {

    if (!isAuthenticated || !authUser?.id || authUser.status !== 'ACTIVE') {
      attemptedFetchForUser.current = null;
      return;
    }

    if (userLoading) {
      return;
    }

    if (attemptedFetchForUser.current === authUser.id) {
      return;
    }

    const needsProfileFetch = !currentUser || currentUser.id !== authUser.id;

    if (needsProfileFetch) {
      Logger.info(`AppContent Effect (Fetch Profile): Conditions met for user ${authUser.email}. Fetching profile.`);

      attemptedFetchForUser.current = authUser.id;
      dispatch(fetchCurrentAuthUserProfile());
    }

  }, [dispatch, isAuthenticated, authUser, currentUser, userLoading]);


  // Effect to apply theme based on user preference or system default
  useEffect(() => {
    let newThemeToApply = null;

    if (isAuthenticated && authUser?.id) {
      if (authUser.status === 'ACTIVE') {
        if (userLoading || !currentUser || currentUser.id !== authUser.id || !currentUser.settings || typeof currentUser.settings !== 'object') {
          Logger.info(`AppContent Theme: User authenticated (ID: ${authUser.id}), profile is loading or not current. Theme decision deferred.`);
        } else if (currentUser && currentUser.id === authUser.id) {
          if (currentUser.settings?.theme) {
            newThemeToApply = currentUser.settings.theme.toLowerCase();
            Logger.info(`AppContent Theme: User ${currentUser.email} preference found: '${newThemeToApply}'.`);
          } else {
            newThemeToApply = 'system';
            Logger.info(`AppContent Theme: User ${currentUser.email} has no theme preference in users.currentUser. Defaulting to '${newThemeToApply}'.`);
          }
        }
      } else {
        newThemeToApply = 'system';
        Logger.info(`AppContent Theme: User ${authUser.email} is not ACTIVE (${authUser.status}). Defaulting to '${newThemeToApply}'.`);
      }
    }
    else if (!isAuthenticated && !authLoading) {
      newThemeToApply = 'system';
      Logger.info(`AppContent Theme: Not authenticated. Defaulting to '${newThemeToApply}'.`);
    }

    if (newThemeToApply && newThemeToApply !== currentGlobalThemeFromContext) {
      Logger.info(`AppContent Theme: Applying theme: '${newThemeToApply}'. Current context: '${currentGlobalThemeFromContext}'`);
      setGlobalTheme(newThemeToApply);
    }
  }, [
    isAuthenticated,
    authUser,
    currentUser,
    userLoading,
    authLoading,
    setGlobalTheme,
    currentGlobalThemeFromContext
  ]);

  // Effect for WebSocket initialization and cleanup [MODIFIED]
  useEffect(() => {
    // We now depend on the authUser object directly, as it's the source of truth from Redux
    const isReadyForSocket = isAuthenticated && authUser?.id && authUser?.status === 'ACTIVE';

    if (isReadyForSocket) {
      // Only proceed if the socket has not been initialized yet.
      if (!socketInitialized.current) {
        // Defensively get the token from localStorage right when we need it.
        const token = localStorage.getItem('token');

        if (token) {
          Logger.info(`AppContent (Socket): User ready (ID: ${authUser.id}), token found. Initializing socket.`);
          // Assuming socketService.initSocket() reads from localStorage implicitly.
          // If it can accept a token, it's safer to pass it: socketService.initSocket(token);
          socketService.initSocket();
          socketInitialized.current = true;
        } else {
          // This case can happen in a race condition where Redux state is updated before localStorage.
          Logger.error(`AppContent (Socket): User is authenticated but no token found in localStorage. Deferring socket connection.`);
        }
      }
    } else {
      // This logic is for disconnecting when the user logs out or becomes inactive.
      if (socketInitialized.current) {
        Logger.info(`AppContent (Socket): Conditions not met for socket. Disconnecting.`);
        socketService.disconnectSocket();
        socketInitialized.current = false;
      }
    }
    // The dependency array is updated to use the single source of truth for the user.
  }, [isAuthenticated, authUser]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/request-verification" element={<RequestVerificationPage />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />

        <Route path="/verify-2fa" element={<VerifyTwoFactorPage />} />

        {/* Status-specific Protected Routes */}
        <Route
          path="/pending-approval"
          element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>}
        />

        {/* Main Application Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/:key" element={<ProjectDetailPage />} />

          {/* --- Epics Routes --- */}
          <Route path="projects/:projectId/epics" element={<EpicPage />} />
          <Route path="epics/:epicId" element={<EpicDetailPage />} />

          {/* --- Sprints Routes --- */}
          <Route path="projects/:projectId/sprints" element={<SprintPage />} />
          <Route path="projects/:projectId/sprints/:sprintId" element={<SprintDetailPage />} />

          <Route path="boards/:boardId" element={<BoardViewPage />} />
          <Route path="boards/:boardId/join" element={<BoardJoinHandler />} />

          <Route path="profile" element={<UserProfilePage />} />
          <Route path="profile/setup-2fa" element={<SetupTwoFactorPage />} />

          <Route path="board/:key" element={<BoardRedirector />} />

          <Route
            path="workspace/settings"
            element={
              <ProtectedRoute isCompanyManagerRoute={true}>
                <TenantManagerPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Global Admin Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAdminRoute={true}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="user-approval" replace />} />
          <Route path="user-approval" element={<AdminUserApprovalPage />} />
          {/* Catch-all for unmatched routes within admin layout */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Top-level catch-all for any routes not matched above */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AppContent />
      </AppThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;