// src/features/sprints/hooks/useSprintIssues.js
import { useQuery } from '@tanstack/react-query';
import sprintService from '../services/sprintService';

export const useSprintIssues = (sprintId) => {
  return useQuery({
    queryKey: ['sprintIssues', sprintId],
    queryFn: () => sprintService.getSprintIssues(sprintId),
    enabled: !!sprintId,
     onError: (error) => {
        console.error(`Error fetching issues for sprint ${sprintId}:`, error);
    }
  });
};