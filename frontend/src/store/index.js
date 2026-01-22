import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/slices/authSlice';
import boardReducer from '../features/board/slices/boardSlice';
import projectReducer from '../features/projects/slices/projectSlice';
import userReducer from '../features/users/slices/userSlice';
import dashboardReducer from '../features/dashboard/slices/dashboardSlice';
import sprintReducer from '../features/sprints/slices/sprintSlice';

import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    projects: projectReducer,
    users: userReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    sprint: sprintReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});