// src/features/sprints/slices/sprintSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedSprintId: null, // ID of the sprint selected for detail view
  isCreateSprintModalOpen: false, // Controls visibility of the create sprint modal
};

const sprintSlice = createSlice({
  name: 'sprint',
  initialState,
  reducers: {
    selectSprint: (state, action) => {
      state.selectedSprintId = action.payload;
    },
    clearSelectedSprint: (state) => {
      state.selectedSprintId = null;
    },
    openCreateSprintModal: (state) => {
      state.isCreateSprintModalOpen = true;
    },
    closeCreateSprintModal: (state) => {
      state.isCreateSprintModalOpen = false;
    },
  },
});

export const {
  selectSprint,
  clearSelectedSprint,
  openCreateSprintModal,
  closeCreateSprintModal,
} = sprintSlice.actions;

export default sprintSlice.reducer;