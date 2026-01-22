// src/features/sprints/hooks/useSprintDetails.js
import { useQuery } from '@tanstack/react-query';
import sprintService from '../services/sprintService';

export const useSprintDetails = (sprintId) => {
  return useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: () => sprintService.getSprintById(sprintId),
    enabled: !!sprintId, // Only run the query if sprintId is not null/undefined
    onError: (error) => {
        console.error(`Error fetching details for sprint ${sprintId}:`, error);
    }
  });
};