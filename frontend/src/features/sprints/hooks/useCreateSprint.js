// src/features/sprints/hooks/useCreateSprint.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import sprintService from '../services/sprintService';

export const useCreateSprint = (projectId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sprintService.createSprint,
    onSuccess: () => {
      // Invalidate the query for the list of sprints for the specific project
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
    onError: (error) => {
      console.error("Error creating sprint:", error);
      // Optionally add user-facing error handling like a toast
    },
  });
};