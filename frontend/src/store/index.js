import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/slices/authSlice';
import userReducer from '../features/users/slices/userSlice';
import dashboardReducer from '../features/dashboard/slices/dashboardSlice';

import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});