// src/features/sprints/hooks/useDeleteSprint.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import sprintService from '../services/sprintService';

export const useDeleteSprint = (projectId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sprintService.deleteSprint, // Takes sprintId
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
    onError: (error) => {
      console.error("Error deleting sprint:", error);
    },
  });
};