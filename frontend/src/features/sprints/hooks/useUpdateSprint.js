// src/features/sprints/hooks/useUpdateSprint.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import sprintService from '../services/sprintService';

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, data }) => sprintService.updateSprint(sprintId, data),
    onSuccess: (updatedSprint, variables) => {
      const { sprintId, projectId } = variables;
      // Invalidate the list of sprints
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      // Invalidate the specific sprint's details
      queryClient.invalidateQueries({ queryKey: ['sprint', sprintId] });
      // You can also update the cache directly for an optimistic update
      // queryClient.setQueryData(['sprint', sprintId], updatedSprint);
    },
    onError: (error) => {
        console.error("Error updating sprint:", error);
    }
  });
};